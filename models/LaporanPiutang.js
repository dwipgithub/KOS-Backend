import { QueryTypes } from "sequelize"
import { database } from "../config/Database.js"

export const get = async (req) => {
    try {
        const { startDate, endDate, idProperti } = req.query

        const filters = []
        const replacements = []

        // ======================
        // FILTER TANGGAL TAGIHAN
        // ======================
        if (startDate && endDate) {
            filters.push("DATE(t.tanggal_tagihan) BETWEEN ? AND ?")
            replacements.push(startDate, endDate)
        } else if (startDate) {
            filters.push("DATE(t.tanggal_tagihan) >= ?")
            replacements.push(startDate)
        } else if (endDate) {
            filters.push("DATE(t.tanggal_tagihan) <= ?")
            replacements.push(endDate)
        }

        // ======================
        // HANYA TAGIHAN UNPAID
        // ======================
        filters.push("t.id_status_tagihan = ?")
        replacements.push("UNPAID")

        // ======================
        // FILTER PROPERTI
        // ======================
        if (idProperti) {
            filters.push("pi.id = ?")
            replacements.push(idProperti)
        }

        // ======================
        // HANYA PIUTANG (BELUM LUNAS)
        // ======================
        filters.push("(t.total - IFNULL(p.total_bayar, 0)) > 0")

        const whereClause =
            filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : ""

        // ======================
        // QUERY
        // ======================
        const sql = `
            SELECT 
                t.id,
                t.tanggal_tagihan,
                t.tanggal_jatuh_tempo,
                t.total as total_tagihan,

                dt.nama AS deskripsi_tagihan,

                IFNULL(p.total_bayar, 0) as total_bayar,
                (t.total - IFNULL(p.total_bayar, 0)) AS sisa_tagihan,

                -- STATUS + AGING
                CASE 
                    WHEN CURDATE() < t.tanggal_jatuh_tempo THEN 'BELUM JATUH TEMPO'
                    WHEN CURDATE() = t.tanggal_jatuh_tempo THEN 'JATUH TEMPO HARI INI'
                    WHEN DATEDIFF(CURDATE(), t.tanggal_jatuh_tempo) BETWEEN 1 AND 7 THEN 'MENUNGGAK RINGAN'
                    WHEN DATEDIFF(CURDATE(), t.tanggal_jatuh_tempo) BETWEEN 8 AND 30 THEN 'MENUNGGAK'
                    ELSE 'KRITIS'
                END AS status_piutang,

                GREATEST(DATEDIFF(CURDATE(), t.tanggal_jatuh_tempo), 0) AS umur,

                penyewa.nama AS nama_penyewa,
                k.nama AS nama_kamar,
                pi.nama AS nama_properti

            FROM tagihan t

            LEFT JOIN (
                SELECT 
                    id_tagihan,
                    SUM(total_bayar) AS total_bayar
                FROM pembayaran
                GROUP BY id_tagihan
            ) p ON p.id_tagihan = t.id

            LEFT JOIN deskripsi_tagihan dt ON t.id_deskripsi_tagihan = dt.id
            LEFT JOIN sewa s ON t.id_sewa = s.id
            LEFT JOIN kamar k ON s.id_kamar = k.id
            LEFT JOIN properti pi ON k.id_properti = pi.id
            LEFT JOIN penyewa ON s.id_penyewa = penyewa.id

            ${whereClause}

            ORDER BY penyewa.nama ASC, t.tanggal_jatuh_tempo ASC
        `

        const list = await database.query(sql, {
            replacements,
            type: QueryTypes.SELECT
        })

        // ======================
        // SUMMARY GLOBAL
        // ======================
        const totalPiutang = list.reduce((sum, item) => {
            return sum + item.sisa_tagihan
        }, 0)

        const totalMenunggak = list
            .filter(item =>
                ['MENUNGGAK RINGAN', 'MENUNGGAK', 'KRITIS'].includes(item.status_piutang)
            )
            .reduce((sum, item) => sum + item.sisa_tagihan, 0)

        const totalBelumJatuhTempo = list
            .filter(item =>
                ['BELUM JATUH TEMPO', 'JATUH TEMPO HARI INI'].includes(item.status_piutang)
            )
            .reduce((sum, item) => sum + item.sisa_tagihan, 0)

        // ======================
        // GROUPING PER PENYEWA
        // ======================
        const grouped = {}

        for (const item of list) {
            const key = item.nama_penyewa || 'TANPA NAMA'

            if (!grouped[key]) {
                grouped[key] = {
                    namaPenyewa: key,
                    totalPiutang: 0,
                    status: 'BELUM JATUH TEMPO',
                    detail: []
                }
            }

            grouped[key].detail.push({
                noTagihan: item.id,
                tanggalTagihan: item.tanggal_tagihan,
                jatuhTempo: item.tanggal_jatuh_tempo,
                keterangan: item.deskripsi_tagihan,
                piutang: item.sisa_tagihan,
                umur: item.umur,
                status: item.status_piutang
            })

            grouped[key].totalPiutang += item.sisa_tagihan
        }

        // ======================
        // STATUS PENYEWA (WORST CASE)
        // ======================
        const prioritas = {
            "BELUM JATUH TEMPO": 1,
            "JATUH TEMPO HARI INI": 2,
            "MENUNGGAK RINGAN": 3,
            "MENUNGGAK": 4,
            "KRITIS": 5
        }

        for (const key in grouped) {
            let worstStatus = "BELUM JATUH TEMPO"

            for (const d of grouped[key].detail) {
                if (prioritas[d.status] > prioritas[worstStatus]) {
                    worstStatus = d.status
                }
            }

            grouped[key].status = worstStatus

            // optional: sort detail by umur tertinggi
            grouped[key].detail.sort((a, b) => b.umur - a.umur)
        }

        // ======================
        // FORMAT FINAL
        // ======================
        const formattedData = Object.values(grouped)

        // optional: sort penyewa berdasarkan total terbesar
        formattedData.sort((a, b) => b.totalPiutang - a.totalPiutang)

        // ======================
        // RETURN
        // ======================
        return {
            periode: {
                startDate,
                endDate
            },
            filter: {
                idProperti
            },
            summary: {
                totalPiutang,
                totalMenunggak,
                totalBelumJatuhTempo
            },
            data: formattedData
        }

    } catch (error) {
        throw error
    }
}