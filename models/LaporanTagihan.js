import { QueryTypes } from "sequelize"
import { database } from "../config/Database.js"

export const get = async (req) => {
    try {
        const { startDate, endDate, idProperti, idStatusTagihan } = req.query

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
        // FILTER PROPERTI
        // ======================
        if (idProperti) {
            filters.push("pi.id = ?")
            replacements.push(idProperti)
        }

        // ======================
        // FILTER STATUS TAGIHAN
        // ======================
        if (idStatusTagihan) {
            filters.push("t.id_status_tagihan = ?")
            replacements.push(idStatusTagihan)
        }

        const whereClause =
            filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : ""

        // ======================
        // QUERY UTAMA
        // ======================
        const sql = `
            SELECT 
                t.id,
                t.tanggal_tagihan,
                t.tanggal_jatuh_tempo,
                t.total,
                t.id_status_tagihan,
                st.nama,

                dt.nama AS deskripsi_tagihan,

                p.total_bayar,

                (t.total - IFNULL(p.total_bayar, 0)) AS sisa_tagihan,

                s.id AS id_sewa,
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
            LEFT JOIN status_tagihan st ON t.id_status_tagihan = st.id

            ${whereClause}

            ORDER BY t.tanggal_tagihan DESC
        `

        const list = await database.query(sql, {
            replacements,
            type: QueryTypes.SELECT
        })

        // ======================
        // SUMMARY
        // ======================
        const totalTagihan = list.reduce((sum, item) => {
            return sum + (item.total || 0)
        }, 0)

        const totalDibayar = list.reduce((sum, item) => {
            return sum + (item.total_bayar || 0)
        }, 0)

        const totalSisa = list.reduce((sum, item) => {
            return sum + (item.sisa_tagihan || 0)
        }, 0)

        // ======================
        // FORMAT OUTPUT
        // ======================
        return {
            periode: {
                startDate,
                endDate
            },
            filter: {
                idProperti,
                idStatusTagihan
            },
            summary: {
                totalTagihan,
                totalDibayar,
                totalSisa
            },
            data: list.map(item => ({
                id: item.id,
                tanggalTagihan: item.tanggal_tagihan,
                jatuhTempo: item.tanggal_jatuh_tempo,
                status: item.nama,

                deskripsi: item.deskripsi_tagihan,

                properti: item.nama_properti,
                kamar: item.nama_kamar,
                penyewa: item.nama_penyewa,

                totalTagihan: item.total,
                totalDibayar: item.total_bayar || 0,
                sisaTagihan: item.sisa_tagihan
            }))
        }

    } catch (error) {
        throw error
    }
}