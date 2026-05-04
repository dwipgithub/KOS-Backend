import { QueryTypes } from "sequelize"
import { database } from "../config/Database.js"

export const get = async (req) => {
    try {
        const { startDate, endDate, idProperti } = req.query

        const pembayaranFilters = []
        const pembayaranReplacements = []
        const pengeluaranFilters = []
        const pengeluaranReplacements = []

        // ======================
        // FILTER TANGGAL
        // ======================
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

        // ======================
        // FILTER PROPERTI
        // ======================
        if (idProperti) {
            // untuk pendapatan (harus join ke properti)
            pembayaranFilters.push("pi.id = ?")
            pembayaranReplacements.push(idProperti)

            // untuk pengeluaran (langsung ada)
            pengeluaranFilters.push("pg.id_properti = ?")
            pengeluaranReplacements.push(idProperti)
        }

        const pembayaranWhere =
            pembayaranFilters.length > 0 ? ` WHERE ${pembayaranFilters.join(" AND ")}` : ""

        const pengeluaranWhere =
            pengeluaranFilters.length > 0 ? ` WHERE ${pengeluaranFilters.join(" AND ")}` : ""

        // ======================
        // PENDAPATAN PER JENIS
        // ======================
        const sqlPendapatan = `
            SELECT 
                dt.id,
                dt.nama,
                SUM(p.total_bayar) AS total
            FROM pembayaran p
            JOIN tagihan t ON p.id_tagihan = t.id
            JOIN deskripsi_tagihan dt ON t.id_deskripsi_tagihan = dt.id
            JOIN sewa s ON t.id_sewa = s.id
            JOIN kamar k ON s.id_kamar = k.id
            JOIN properti pi ON k.id_properti = pi.id
            ${pembayaranWhere}
            GROUP BY dt.id, dt.nama
        `

        const pendapatanList = await database.query(sqlPendapatan, {
            replacements: pembayaranReplacements,
            type: QueryTypes.SELECT
        })

        const totalPendapatan = pendapatanList.reduce((sum, item) => {
            return sum + (item.total || 0)
        }, 0)

        // ======================
        // PENGELUARAN PER KATEGORI
        // ======================
        const sqlPengeluaran = `
            SELECT 
                kp.id,
                kp.nama,
                SUM(pg.total) AS total
            FROM pengeluaran pg
            LEFT JOIN kategori_pengeluaran kp 
                ON pg.id_kategori_pengeluaran = kp.id
            ${pengeluaranWhere}
            GROUP BY kp.id, kp.nama
        `

        const pengeluaranList = await database.query(sqlPengeluaran, {
            replacements: pengeluaranReplacements,
            type: QueryTypes.SELECT
        })

        const totalPengeluaran = pengeluaranList.reduce((sum, item) => {
            return sum + (item.total || 0)
        }, 0)

        // ======================
        // LABA BERSIH
        // ======================
        const labaBersih = totalPendapatan - totalPengeluaran

        // ======================
        // FORMAT
        // ======================
        return {
            periode: {
                startDate,
                endDate
            },
            filter: {
                idProperti
            },
            pendapatan: {
                total: totalPendapatan,
                rincian: pendapatanList.map(item => ({
                    id: item.id,
                    nama: item.nama,
                    total: item.total
                }))
            },
            pengeluaran: {
                total: totalPengeluaran,
                rincian: pengeluaranList.map(item => ({
                    id: item.id,
                    nama: item.nama,
                    total: item.total
                }))
            },
            labaBersih
        }

    } catch (error) {
        throw error
    }
}