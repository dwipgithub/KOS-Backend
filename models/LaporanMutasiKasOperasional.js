import { QueryTypes } from "sequelize"
import { database } from "../config/Database.js"
import { privateFileUrl } from "../helpers/privateFileUrl.js"

export const get = async (req) => {
    try {

        // ======================
        // PAGINATION
        // ======================
        const page = parseInt(req.query.page) || 1

        const limit =
            parseInt(req.query.limit) > 100
                ? 100
                : parseInt(req.query.limit) || 100

        const offset = (page - 1) * limit

        // ======================
        // QUERY PARAM
        // ======================
        const {
            startDate,
            endDate,
            penggunaId
        } = req.query

        // ======================
        // FILTER
        // ======================
        const filters = []

        const replacements = []

        if (startDate && endDate) {

            filters.push(`
                DATE(data.tanggal_mutasi_kas)
                BETWEEN ? AND ?
            `)

            replacements.push(startDate, endDate)

        } else if (startDate) {

            filters.push(`
                DATE(data.tanggal_mutasi_kas) >= ?
            `)

            replacements.push(startDate)

        } else if (endDate) {

            filters.push(`
                DATE(data.tanggal_mutasi_kas) <= ?
            `)

            replacements.push(endDate)
        }

        // ======================
        // FILTER PENGGUNA
        // ======================
        if (penggunaId) {

            filters.push(`
                data.pengguna_id = ?
            `)

            replacements.push(penggunaId)
        }

        const whereClause =
            filters.length > 0
                ? `WHERE ${filters.join(" AND ")}`
                : ""

        // ======================
        // BASE UNION QUERY
        // ======================
        const baseQuery = `
            SELECT
                p.id,

                'MASUK' AS tipe,

                p.tanggal_pemasukan
                    AS tanggal_mutasi_kas,

                p.keterangan,

                p.total,

                NULL AS id_properti,

                NULL AS nama_properti,

                NULL AS id_kamar,

                NULL AS nama_kamar,

                p.pengguna_id,

                p.bukti_pemasukan AS bukti

            FROM pemasukan p

            WHERE p.tanggal_dihapus IS NULL

            UNION ALL

            SELECT
                pg.id,

                'KELUAR' AS tipe,

                pg.tanggal_pengeluaran
                    AS tanggal_mutasi_kas,

                pg.nama AS keterangan,

                pg.total,

                pg.id_properti,

                pr.nama AS nama_properti,

                pg.id_kamar,

                k.nama AS nama_kamar,

                pg.pengguna_id,

                pg.bukti_pengeluaran AS bukti

            FROM pengeluaran pg

            LEFT JOIN properti pr
                ON pg.id_properti = pr.id

            LEFT JOIN kamar k
                ON pg.id_kamar = k.id
            
            WHERE pg.tanggal_dihapus IS NULL
        `

        // ======================
        // HITUNG SALDO AWAL
        // ======================
        let saldoAwal = 0

        if (startDate) {

            const saldoAwalFilters = []

            const saldoAwalReplacements = []

            saldoAwalFilters.push(`
                DATE(data.tanggal_mutasi_kas) < ?
            `)

            saldoAwalReplacements.push(startDate)

            // ======================
            // FILTER PENGGUNA
            // ======================
            if (penggunaId) {

                saldoAwalFilters.push(`
                    data.pengguna_id = ?
                `)

                saldoAwalReplacements.push(penggunaId)
            }

            const saldoAwalWhere = `
                WHERE ${saldoAwalFilters.join(" AND ")}
            `

            const sqlSaldoAwal = `
                SELECT
                    COALESCE(
                        SUM(
                            CASE
                                WHEN data.tipe = 'MASUK'
                                    THEN data.total

                                WHEN data.tipe = 'KELUAR'
                                    THEN -data.total

                                ELSE 0
                            END
                        ),
                        0
                    ) AS saldo_awal

                FROM (
                    ${baseQuery}
                ) AS data

                ${saldoAwalWhere}
            `

            const saldoAwalResult = await database.query(
                sqlSaldoAwal,
                {
                    replacements: saldoAwalReplacements,
                    type: QueryTypes.SELECT
                }
            )

            saldoAwal = parseFloat(
                saldoAwalResult[0].saldo_awal || 0
            )
        }

        // ======================
        // QUERY DATA MUTASI
        // ======================
        const sqlQuery = `
            SELECT *
            FROM (
                ${baseQuery}
            ) AS data

            ${whereClause}

            ORDER BY
                data.tanggal_mutasi_kas ASC,
                data.id ASC

            LIMIT ? OFFSET ?
        `

        const result = await database.query(sqlQuery, {
            replacements: [
                ...replacements,
                limit,
                offset
            ],
            type: QueryTypes.SELECT
        })

        // ======================
        // FORMAT DATA
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

                tipe: item.tipe,

                tanggalMutasiKas:
                    item.tanggal_mutasi_kas,

                keterangan:
                    item.keterangan,

                masuk,

                keluar,

                saldo: saldoBerjalan,

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
                    : null,

                bukti: privateFileUrl(item.bukti)
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

            FROM (
                ${baseQuery}
            ) AS data

            ${whereClause}
        `

        const countResult = await database.query(
            sqlCount,
            {
                replacements,
                type: QueryTypes.SELECT
            }
        )

        const totalRowCount =
            countResult[0].totalRowCount

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

// import { QueryTypes } from "sequelize"
// import { database } from "../config/Database.js"

// export const get = async (req) => {
//     try {

//         // ======================
//         // PAGINATION
//         // ======================
//         const page = parseInt(req.query.page) || 1
//         const limit = parseInt(req.query.limit) > 100 ? 100 : parseInt(req.query.limit) || 100
//         const offset = (page - 1) * limit

//         // ======================
//         // QUERY PARAM
//         // ======================
//         const {
//             startDate,
//             endDate,
//             penggunaId
//         } = req.query

//         // ======================
//         // FILTER
//         // ======================
//         const filters = []
//         const replacements = []

//         if (startDate && endDate) {
//             filters.push("DATE(mko.tanggal_mutasi_kas) BETWEEN ? AND ?")
//             replacements.push(startDate, endDate)
//         } else if (startDate) {
//             filters.push("DATE(mko.tanggal_mutasi_kas) >= ?")
//             replacements.push(startDate)
//         } else if (endDate) {
//             filters.push("DATE(mko.tanggal_mutasi_kas) <= ?")
//             replacements.push(endDate)
//         }

//         // ======================
//         // FILTER PENGGUNA
//         // ======================
//         if (penggunaId) {
//             filters.push("mko.pengguna_id = ?")
//             replacements.push(penggunaId)
//         }

//         const whereClause =
//             filters.length > 0
//                 ? `WHERE ${filters.join(" AND ")}`
//                 : ""

//         // ======================
//         // HITUNG SALDO AWAL
//         // ======================
//         let saldoAwal = 0

//         if (startDate) {

//             const saldoAwalFilters = []
//             const saldoAwalReplacements = []

//             saldoAwalFilters.push("DATE(mko.tanggal_mutasi_kas) < ?")
//             saldoAwalReplacements.push(startDate)

//             // ======================
//             // FILTER PENGGUNA
//             // ======================
//             if (penggunaId) {
//                 saldoAwalFilters.push("mko.pengguna_id = ?")
//                 saldoAwalReplacements.push(penggunaId)
//             }


//             const saldoAwalWhere = `
//                 WHERE ${saldoAwalFilters.join(" AND ")}
//             `

//             const sqlSaldoAwal = `
//                 SELECT
//                     COALESCE(
//                         SUM(
//                             CASE
//                                 WHEN mko.tipe = 'MASUK' THEN mko.total
//                                 WHEN mko.tipe = 'KELUAR' THEN -mko.total
//                                 ELSE 0
//                             END
//                         ),
//                         0
//                     ) AS saldo_awal
//                 FROM mutasi_kas_operasional mko
//                 ${saldoAwalWhere}
//             `

//             const saldoAwalResult = await database.query(sqlSaldoAwal, {
//                 replacements: saldoAwalReplacements,
//                 type: QueryTypes.SELECT
//             })

//             saldoAwal = parseFloat(saldoAwalResult[0].saldo_awal || 0)
//         }

//         // ======================
//         // QUERY DATA MUTASI
//         // ======================
//         const sqlQuery = `
//             SELECT
//                 mko.id,
//                 mko.id_pengeluaran,
//                 mko.tipe,
//                 mko.tanggal_mutasi_kas,
//                 mko.total,
//                 mko.keterangan,
//                 pg.id_properti,
//                 pr.nama AS nama_properti,
//                 pg.id_kamar,
//                 k.nama AS nama_kamar
//             FROM mutasi_kas_operasional mko
//             LEFT JOIN pengeluaran pg
//                 ON mko.id_pengeluaran = pg.id
//             LEFT JOIN properti pr
//                 ON pg.id_properti = pr.id
//             LEFT JOIN kamar k
//                 ON pg.id_kamar = k.id
//             ${whereClause}
//             ORDER BY
//                 mko.tanggal_mutasi_kas ASC,
//                 mko.tanggal_dibuat ASC
//             LIMIT ? OFFSET ?
//         `

//         const result = await database.query(sqlQuery, {
//             replacements: [...replacements, limit, offset],
//             type: QueryTypes.SELECT
//         })

//         // ======================
//         // FORMAT DATA + SALDO BERJALAN
//         // ======================
//         let saldoBerjalan = saldoAwal

//         const formattedData = result.map(item => {

//             const total = parseFloat(item.total)

//             let masuk = 0
//             let keluar = 0

//             if (item.tipe === "MASUK") {
//                 masuk = total
//                 saldoBerjalan += total
//             }

//             if (item.tipe === "KELUAR") {
//                 keluar = total
//                 saldoBerjalan -= total
//             }

//             return {
//                 id: item.id,
//                 tipe: item.tipe,
//                 tanggalMutasiKas: item.tanggal_mutasi_kas,
//                 keterangan: item.keterangan,

//                 masuk,
//                 keluar,

//                 saldo: saldoBerjalan,

//                 pengeluaran: item.id_pengeluaran
//                     ? {
//                         id: item.id_pengeluaran
//                     }
//                     : null,

//                 properti: item.id_properti
//                     ? {
//                         id: item.id_properti,
//                         nama: item.nama_properti
//                     }
//                     : null,

//                 kamar: item.id_kamar
//                     ? {
//                         id: item.id_kamar,
//                         nama: item.nama_kamar
//                     }
//                     : null
//             }
//         })

//         // ======================
//         // SALDO AKHIR
//         // ======================
//         const saldoAkhir = saldoBerjalan

//         // ======================
//         // TOTAL ROW
//         // ======================
//         const sqlCount = `
//             SELECT COUNT(*) AS totalRowCount
//             FROM mutasi_kas_operasional mko
//             ${whereClause}
//         `

//         const countResult = await database.query(sqlCount, {
//             replacements,
//             type: QueryTypes.SELECT
//         })

//         const totalRowCount = countResult[0].totalRowCount

//         // ======================
//         // RESPONSE
//         // ======================
//         return {
//             totalRowCount,
//             page,
//             limit,

//             periode: {
//                 startDate,
//                 endDate
//             },

//             saldoAwal,
//             saldoAkhir,

//             data: formattedData
//         }

//     } catch (error) {
//         throw error
//     }
// }