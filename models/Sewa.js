import { DataTypes, QueryTypes } from "sequelize"
import { database } from "../config/Database.js"

export const sewa = database.define('sewa', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    id_kamar: {
        type: DataTypes.STRING
    },
    id_penyewa: {
        type: DataTypes.STRING
    },
    id_status_sewa: {
        type: DataTypes.STRING
    },
    tanggal_masuk: {
        type: DataTypes.DATEONLY
    },
    tanggal_keluar: {
        type: DataTypes.DATEONLY
    },
    id_durasi: {
        type: DataTypes.STRING
    },
    harga_per_durasi: {
        type: DataTypes.DOUBLE
    },
    jumlah_durasi: {
        type: DataTypes.INTEGER
    },
    uang_muka: {
        type: DataTypes.DOUBLE
    },
    catatan: {
        type: DataTypes.TEXT
    },
    file_dokumen: {
        type: DataTypes.STRING
    },
    temp_key: {
        type: DataTypes.STRING
    }
}, {
    freezeTableName: true,
    defaultScope: {
        attributes: {
            exclude: ['temp_key']
        }
    }
})

export const get = async (req) => {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) > 100 ? 100 : parseInt(req.query.limit) || 100
        const offset = (page - 1) * limit

        // ======================
        // SELECT SEWA
        // ======================
        const sqlSelect = `
            SELECT 
            s.id,
            s.id_kamar,
            k.nama AS kamar_nama,
            s.id_penyewa,
            p.nama AS penyewa_nama,
            s.tanggal_masuk,
            s.tanggal_keluar,
            s.id_durasi,
            s.uang_muka,
            d.nama AS durasi_nama,
            s.id_status_sewa,
            ss.nama AS status_sewa_nama,
            s.harga_per_durasi,
            s.catatan
        `

        const sqlFrom = `
            FROM sewa s
            JOIN kamar k ON s.id_kamar = k.id
            JOIN penyewa p ON s.id_penyewa = p.id
            JOIN durasi d ON s.id_durasi = d.id
            JOIN status_sewa ss ON s.id_status_sewa = ss.id
        `

        const sqlOrder = ` ORDER BY s.tanggal_dibuat DESC `
        const sqlLimit = ` LIMIT ? OFFSET ? `

        // ======================
        // FILTER
        // ======================
        const filters = []
        const replacements = []

        const { idKamar, idPenyewa, tanggalMasuk, tanggalKeluar } = req.query

        if (idKamar) {
            filters.push('s.id_kamar = ?')
            replacements.push(idKamar)
        }

        if (idPenyewa) {
            filters.push('s.id_penyewa = ?')
            replacements.push(idPenyewa)
        }

        if (tanggalMasuk) {
            filters.push('s.tanggal_masuk >= ?')
            replacements.push(tanggalMasuk)
        }

        if (tanggalKeluar) {
            filters.push('s.tanggal_keluar <= ?')
            replacements.push(tanggalKeluar)
        }

        const sqlWhere = filters.length > 0 ? " WHERE " + filters.join(" AND ") : ""
        const sql = sqlSelect + sqlFrom + sqlWhere + sqlOrder + sqlLimit

        // ======================
        // QUERY DATA SEWA
        // ======================
        const rows = await database.query(sql, {
            type: QueryTypes.SELECT,
            replacements: [...replacements, limit, offset]
        })

        // ======================
        // LOOP TAMBAH TAGIHAN & PENGELUARAN
        // ======================
        const formattedData = await Promise.all(
            rows.map(async (item) => {

                // ======================
                // TAGIHAN (by id_sewa)
                // ======================
                const tagihan = await database.query(`
                    SELECT 
                        t.id,
                        t.tanggal_tagihan,
                        t.total as total_tagihan,
                        t.id_status_tagihan
                    FROM tagihan t
                    WHERE t.id_sewa = ?
                    ORDER BY t.tanggal_tagihan DESC
                `, {
                    type: QueryTypes.SELECT,
                    replacements: [item.id]
                })

                // ======================
                // PENGELUARAN (by id_kamar)
                // ======================
                const pengeluaran = await database.query(`
                    SELECT 
                        p.id,
                        p.tanggal_pengeluaran,
                        p.nama as nama_pengeluaran,
                        p.total as total_pengeluaran
                    FROM pengeluaran p
                    WHERE p.id_kamar = ?
                    ORDER BY p.tanggal_pengeluaran DESC
                `, {
                    type: QueryTypes.SELECT,
                    replacements: [item.id_kamar]
                })

                return {
                    id: item.id,
                    kamar: {
                        id: item.id_kamar,
                        nama: item.kamar_nama
                    },
                    penyewa: {
                        id: item.id_penyewa,
                        nama: item.penyewa_nama
                    },
                    tanggalMasuk: item.tanggal_masuk,
                    tanggalKeluar: item.tanggal_keluar,
                    durasi: {
                        id: item.id_durasi,
                        nama: item.durasi_nama
                    },
                    statusSewa: {
                        id: item.id_status_sewa,
                        nama: item.status_sewa_nama
                    },
                    harga: item.harga,
                    catatan: item.catatan,

                    // ✅ tambahan
                    tagihan: tagihan,
                    pengeluaran: pengeluaran
                }
            })
        )

        // ======================
        // COUNT
        // ======================
        const sqlCount = `
            SELECT COUNT(*) as total_row_count
            FROM sewa s
            ${sqlWhere}
        `

        const countResult = await database.query(sqlCount, {
            type: QueryTypes.SELECT,
            replacements: replacements
        })

        return {
            totalRowCount: countResult[0].total_row_count,
            page: page,
            limit: limit,
            data: formattedData
        }

    } catch (error) {
        throw error
    }
}

export const show = async (id) => {
    try {
        // ======================
        // QUERY SEWA
        // ======================
        const sqlSelect = `
            SELECT 
            s.id,
            s.id_kamar,
            k.nama AS kamar_nama,
            s.id_penyewa,
            p.nama AS penyewa_nama,
            s.tanggal_masuk,
            s.tanggal_keluar,
            s.id_durasi,
            s.jumlah_durasi,
            d.nama AS durasi_nama,
            s.id_status_sewa,
            ss.nama AS status_sewa_nama,
            s.harga_per_durasi,
            s.uang_muka,
            s.catatan
        `

        const sqlFrom = `
            FROM sewa s
            JOIN kamar k ON s.id_kamar = k.id
            JOIN penyewa p ON s.id_penyewa = p.id
            JOIN durasi d ON s.id_durasi = d.id
            JOIN status_sewa ss ON s.id_status_sewa = ss.id
        `

        const sqlWhere = ` WHERE s.id = ? LIMIT 1 `
        const sql = sqlSelect + sqlFrom + sqlWhere

        const result = await database.query(sql, {
            type: QueryTypes.SELECT,
            replacements: [id]
        })

        if (result.length === 0) {
            return null
        }

        const item = result[0]

        // ======================
        // QUERY TAGIHAN
        // ======================
        const tagihanResult = await database.query(`
            SELECT 
                t.id,
                t.tanggal_tagihan,
                t.total,
                t.id_status_tagihan
            FROM tagihan t
            WHERE t.id_sewa = ?
            ORDER BY t.tanggal_tagihan DESC
        `, {
            type: QueryTypes.SELECT,
            replacements: [id]
        })

        // ======================
        // QUERY PENGELUARAN
        // ======================
        const pengeluaranResult = await database.query(`
            SELECT 
                p.id,
                p.nama,
                p.tanggal_pengeluaran,
                p.total
            FROM pengeluaran p
            WHERE p.id_kamar = ?
            ORDER BY p.tanggal_pengeluaran DESC
        `, {
            type: QueryTypes.SELECT,
            replacements: [item.id_kamar]
        })

        // ======================
        // FORMAT DATA
        // ======================
        return {
            id: item.id,
            kamar: {
                id: item.id_kamar,
                nama: item.kamar_nama
            },
            penyewa: {
                id: item.id_penyewa,
                nama: item.penyewa_nama
            },
            tanggalMasuk: item.tanggal_masuk,
            tanggalKeluar: item.tanggal_keluar,
            durasi: {
                id: item.id_durasi,
                nama: item.durasi_nama
            },
            jumlahDurasi: item.jumlah_durasi,
            statusSewa: {
                id: item.id_status_sewa,
                nama: item.status_sewa_nama
            },
            hargaPerDurasi: item.harga_per_durasi,
            uangMuka: item.uang_muka,
            catatan: item.catatan,

            // ✅ TAMBAHAN
            tagihan: tagihanResult.map(t => ({
                id: t.id,
                tanggal: t.tanggal_tagihan,
                total: t.total,
                status: t.id_status_tagihan
            })),

            pengeluaran: pengeluaranResult.map(p => ({
                id: p.id,
                nama: p.nama,
                tanggal: p.tanggal_pengeluaran,
                total: p.total
            }))
        }

    } catch (error) {
        throw error
    }
}