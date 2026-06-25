import { QueryTypes } from "sequelize"
import { database } from "../config/Database.js"
import { privateFileUrl } from "../helpers/privateFileUrl.js"

export const get = async (req) => {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) > 100 ? 100 : parseInt(req.query.limit) || 100
        const offset = (page - 1) * limit

        const { startDate, endDate, idProperti } = req.query

        const pembayaranFilters = []
        const pembayaranReplacements = []
        const pengeluaranFilters = []
        const pengeluaranReplacements = []

        pembayaranFilters.push("t.tanggal_dihapus IS NULL")
        pengeluaranFilters.push("pg.tanggal_dihapus IS NULL")

        if (startDate && endDate) {
            pembayaranFilters.push("DATE(p.tanggal_bayar) BETWEEN ? AND ?")
            pembayaranReplacements.push(startDate, endDate)
            pengeluaranFilters.push("DATE(pg.tanggal_pengeluaran) BETWEEN ? AND ?")
            pengeluaranReplacements.push(startDate, endDate)
        } else if (startDate) {
            pembayaranFilters.push("DATE(p.tanggal_bayar) >= ?")
            pembayaranReplacements.push(startDate)
            pengeluaranFilters.push("DATE(pg.tanggal_pengeluaran) >= ?")
            pengeluaranReplacements.push(startDate)
        } else if (endDate) {
            pembayaranFilters.push("DATE(p.tanggal_bayar) <= ?")
            pembayaranReplacements.push(endDate)
            pengeluaranFilters.push("DATE(pg.tanggal_pengeluaran) <= ?")
            pengeluaranReplacements.push(endDate)
        }

        if (idProperti) {
            pembayaranFilters.push("pi.id = ?")
            pembayaranReplacements.push(idProperti)
            pengeluaranFilters.push("pr.id = ?")
            pengeluaranReplacements.push(idProperti)
        }

        const pembayaranWhere =
            pembayaranFilters.length > 0 ? ` WHERE ${pembayaranFilters.join(" AND ")}` : ""
        const pengeluaranWhere =
            pengeluaranFilters.length > 0 ? ` WHERE ${pengeluaranFilters.join(" AND ")}` : ""

        const sqlQuery = `
            SELECT * FROM (
                SELECT 
                    p.id,
                    "Uang Masuk" AS tipe,
                    p.id_tagihan,
                    p.tanggal_bayar AS tanggal_transaksi,
                    p.total_bayar AS jumlah,
                    CONCAT(
                        DATE_FORMAT(t.tanggal_masuk, '%d-%m-%Y'),
                        " - ",
                        DATE_FORMAT(t.tanggal_keluar, '%d-%m-%Y')
                    ) AS keterangan_transaksi,
                    p.id_metode_bayar,
                    mb.nama AS nama_metode_bayar,
                    dt.id AS id_deskripsi_tagihan,
                    dt.nama AS nama_deskripsi_tagihan,
                    t.id_durasi,
                    t.tanggal_masuk AS tanggal_masuk_tagihan,
                    t.tanggal_keluar AS tanggal_keluar_tagihan,
                    s.id_kamar,
                    k.nama AS nama_kamar,
                    pi.id AS id_properti,
                    pi.nama AS nama_properti,
                    s.id_penyewa,
                    pe.nama AS nama_penyewa,
                    p.bukti_bayar AS bukti
                FROM pembayaran p
                JOIN tagihan t ON p.id_tagihan = t.id
                JOIN deskripsi_tagihan dt ON t.id_deskripsi_tagihan = dt.id
                JOIN sewa s ON t.id_sewa = s.id
                JOIN kamar k ON s.id_kamar = k.id
                JOIN properti pi ON k.id_properti = pi.id
                JOIN penyewa pe ON s.id_penyewa = pe.id
                JOIN metode_bayar mb ON p.id_metode_bayar = mb.id
                ${pembayaranWhere}

                UNION ALL

                SELECT
                    pg.id,
                    "Uang Keluar" AS tipe,
                    NULL AS id_tagihan,
                    pg.tanggal_pengeluaran AS tanggal_transaksi,
                    pg.total AS jumlah,
                    pg.nama AS keterangan_transaksi,
                    NULL AS id_metode_bayar,
                    NULL AS nama_metode_bayar,
                    kp.id AS id_deskripsi_tagihan,
                    kp.nama AS nama_deskripsi_tagihan,
                    NULL AS id_durasi,
                    NULL AS tanggal_masuk_tagihan,
                    NULL AS tanggal_keluar_tagihan,
                    pg.id_kamar,
                    k.nama AS nama_kamar,
                    pg.id_properti,
                    pr.nama AS nama_properti,
                    NULL AS id_penyewa,
                    NULL AS nama_penyewa,
                    pg.bukti_pengeluaran AS bukti
                FROM pengeluaran pg
                LEFT JOIN kategori_pengeluaran kp ON pg.id_kategori_pengeluaran = kp.id
                LEFT JOIN kamar k ON pg.id_kamar = k.id
                LEFT JOIN properti pr ON pg.id_properti = pr.id
                ${pengeluaranWhere}
            ) arus_kas
            ORDER BY arus_kas.tanggal_transaksi DESC
            LIMIT ? OFFSET ?
        `

        // ======================
        // QUERY DATA
        // ======================
        const result = await database.query(sqlQuery, {
            replacements: [...pembayaranReplacements, ...pengeluaranReplacements, limit, offset],
            type: QueryTypes.SELECT
        })

        // ======================
        // FORMAT DATA
        // ======================
        const formattedData = result.map(item => ({
            id: item.id,
            tipe: item.tipe,
            keterangan: item.keterangan_transaksi,
            idTagihan: item.id_tagihan,
            tanggalBayar: item.tanggal_transaksi,
            totalBayar: item.jumlah,
            deskripsiTagihan: {
                id: item.id_deskripsi_tagihan,
                nama: item.nama_deskripsi_tagihan,
            },
            idDurasi: item.id_durasi,
            tanggalMasukTagihan: item.tanggal_masuk_tagihan,
            tanggalKeluarTagihan: item.tanggal_keluar_tagihan,
            metodeBayar: {
                id: item.id_metode_bayar,
                nama: item.nama_metode_bayar
            },
            kamar: {
                id: item.id_kamar,
                nama: item.nama_kamar
            },
            properti: {
                id: item.id_properti,
                nama: item.nama_properti
            },
            penyewa: {
                id: item.id_penyewa,
                nama: item.nama_penyewa
            },
            bukti: privateFileUrl(item.bukti)
        }))

        // ======================
        // HITUNG TOTAL ROW
        // ======================
        const sqlCount = `
            SELECT (
                (SELECT COUNT(*) FROM pembayaran p
                    JOIN tagihan t ON p.id_tagihan = t.id
                    JOIN sewa s ON t.id_sewa = s.id
                    JOIN kamar k ON s.id_kamar = k.id
                    JOIN properti pi ON k.id_properti = pi.id
                    ${pembayaranWhere}
                )
                +
                (SELECT COUNT(*) FROM pengeluaran pg
                    JOIN properti pr ON pg.id_properti = pr.id
                    ${pengeluaranWhere}
                )
            ) AS totalRowCount
        `
        const countResult = await database.query(sqlCount, {
            replacements: [...pembayaranReplacements, ...pengeluaranReplacements],
            type: QueryTypes.SELECT
        })
        const totalRowCount = countResult[0].totalRowCount

        return {
            totalRowCount,
            page,
            limit,
            data: formattedData
        }

    } catch (error) {
        throw error
    }
}