import { QueryTypes } from "sequelize"
import { database } from "../config/Database.js"

export const get = async (req) => {
    try {

        // ======================
        // PAGINATION
        // ======================
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) > 100 ? 100 : parseInt(req.query.limit) || 100
        const offset = (page - 1) * limit

        // ======================
        // QUERY PARAM
        // ======================
        const {
            startDate,
            endDate,
            idKas
        } = req.query

        // ======================
        // FILTER
        // ======================
        const filters = []
        const replacements = []

        if (startDate && endDate) {
            filters.push("DATE(mko.tanggal_mutasi_kas) BETWEEN ? AND ?")
            replacements.push(startDate, endDate)
        } else if (startDate) {
            filters.push("DATE(mko.tanggal_mutasi_kas) >= ?")
            replacements.push(startDate)
        } else if (endDate) {
            filters.push("DATE(mko.tanggal_mutasi_kas) <= ?")
            replacements.push(endDate)
        }

        if (idKas) {
            filters.push("mko.id_kas = ?")
            replacements.push(idKas)
        }

        const whereClause =
            filters.length > 0
                ? `WHERE ${filters.join(" AND ")}`
                : ""

        // ======================
        // HITUNG SALDO AWAL
        // ======================
        let saldoAwal = 0

        if (startDate) {

            const saldoAwalFilters = []
            const saldoAwalReplacements = []

            saldoAwalFilters.push("DATE(mko.tanggal_mutasi_kas) < ?")
            saldoAwalReplacements.push(startDate)

            if (idKas) {
                saldoAwalFilters.push("mko.id_kas = ?")
                saldoAwalReplacements.push(idKas)
            }

            const saldoAwalWhere = `
                WHERE ${saldoAwalFilters.join(" AND ")}
            `

            const sqlSaldoAwal = `
                SELECT
                    COALESCE(
                        SUM(
                            CASE
                                WHEN mko.tipe = 'MASUK' THEN mko.total
                                WHEN mko.tipe = 'KELUAR' THEN -mko.total
                                ELSE 0
                            END
                        ),
                        0
                    ) AS saldo_awal
                FROM mutasi_kas_operasional mko
                ${saldoAwalWhere}
            `

            const saldoAwalResult = await database.query(sqlSaldoAwal, {
                replacements: saldoAwalReplacements,
                type: QueryTypes.SELECT
            })

            saldoAwal = parseFloat(saldoAwalResult[0].saldo_awal || 0)
        }

        // ======================
        // QUERY DATA MUTASI
        // ======================
        const sqlQuery = `
            SELECT
                mko.id,
                mko.id_kas,
                mko.id_pengeluaran,
                mko.tipe,
                mko.tanggal_mutasi_kas,
                mko.total,
                mko.keterangan,
                pg.id_properti,
                pr.nama AS nama_properti,
                pg.id_kamar,
                k.nama AS nama_kamar
            FROM mutasi_kas_operasional mko
            LEFT JOIN pengeluaran pg
                ON mko.id_pengeluaran = pg.id
            LEFT JOIN properti pr
                ON pg.id_properti = pr.id
            LEFT JOIN kamar k
                ON pg.id_kamar = k.id
            ${whereClause}
            ORDER BY
                mko.tanggal_mutasi_kas ASC,
                mko.tanggal_dibuat ASC
            LIMIT ? OFFSET ?
        `

        const result = await database.query(sqlQuery, {
            replacements: [...replacements, limit, offset],
            type: QueryTypes.SELECT
        })

        // ======================
        // FORMAT DATA + SALDO BERJALAN
        // ======================
        let saldoBerjalan = saldoAwal

        const formattedData = result.map(item => {

            const total = parseFloat(item.total)

            let masuk = 0
            let keluar = 0

            if (item.tipe === "MASUK") {
                masuk = total
                saldoBerjalan += total
            }

            if (item.tipe === "KELUAR") {
                keluar = total
                saldoBerjalan -= total
            }

            return {
                id: item.id,
                idKas: item.id_kas,
                tipe: item.tipe,
                tanggalMutasiKas: item.tanggal_mutasi_kas,
                keterangan: item.keterangan,

                masuk,
                keluar,

                saldo: saldoBerjalan,

                pengeluaran: item.id_pengeluaran
                    ? {
                        id: item.id_pengeluaran
                    }
                    : null,

                properti: item.id_properti
                    ? {
                        id: item.id_properti,
                        nama: item.nama_properti
                    }
                    : null,

                kamar: item.id_kamar
                    ? {
                        id: item.id_kamar,
                        nama: item.nama_kamar
                    }
                    : null
            }
        })

        // ======================
        // SALDO AKHIR
        // ======================
        const saldoAkhir = saldoBerjalan

        // ======================
        // TOTAL ROW
        // ======================
        const sqlCount = `
            SELECT COUNT(*) AS totalRowCount
            FROM mutasi_kas_operasional mko
            ${whereClause}
        `

        const countResult = await database.query(sqlCount, {
            replacements,
            type: QueryTypes.SELECT
        })

        const totalRowCount = countResult[0].totalRowCount

        // ======================
        // RESPONSE
        // ======================
        return {
            totalRowCount,
            page,
            limit,

            periode: {
                startDate,
                endDate
            },

            saldoAwal,
            saldoAkhir,

            data: formattedData
        }

    } catch (error) {
        throw error
    }
}