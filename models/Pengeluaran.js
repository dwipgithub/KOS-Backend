import { DataTypes, QueryTypes } from "sequelize"
import { database } from "../config/Database.js"

export const pengeluaran = database.define('pengeluaran', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    id_properti: {
        type: DataTypes.STRING
    },
    id_kamar: {
        type: DataTypes.STRING
    },
    id_kategori_pengeluaran: {
        type: DataTypes.STRING
    },
    tanggal_pengeluaran: {
        type: DataTypes.DATE
    },
    nama: {
        type: DataTypes.STRING
    },
    total: {
        type: DataTypes.DOUBLE
    },
    catatan: {
        type: DataTypes.STRING
    },
        temp_key: {
            type: DataTypes.STRING
    },
    bukti_pengeluaran: {
        type: DataTypes.STRING(512),
        allowNull: true
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
        // SELECT
        // ======================
        const sqlSelect = `
            SELECT 
                p.id,
                p.id_properti,
                pr.nama AS properti_nama,
                p.id_kamar,
                k.nama AS kamar_nama,
                p.id_kategori_pengeluaran,
                kp.nama AS kategori_pengeluaran_nama,
                p.tanggal_pengeluaran,
                p.nama,
                p.total,
                p.catatan,
                p.temp_key,
                p.tanggal_dibuat,
                p.tanggal_diubah
        `

        const sqlFrom = `
            FROM KOS.pengeluaran p
            LEFT JOIN KOS.properti pr ON p.id_properti = pr.id
            LEFT JOIN KOS.kamar k ON p.id_kamar = k.id
            LEFT JOIN KOS.kategori_pengeluaran kp ON p.id_kategori_pengeluaran = kp.id
        `

        const sqlOrder = ` ORDER BY p.tanggal_pengeluaran DESC `
        const sqlLimit = ` LIMIT ? OFFSET ? `

        // ======================
        // FILTER
        // ======================
        const filters = []
        const replacements = []

        const {
            nama,
            id_properti,
            id_kamar,
            id_kategori_pengeluaran,
            startDate, 
            endDate
        } = req.query

        if (nama) {
            filters.push('p.nama LIKE ?')
            replacements.push(`%${nama}%`)
        }

        if (id_properti) {
            filters.push('p.id_properti = ?')
            replacements.push(id_properti)
        }

        if (id_kamar) {
            filters.push('p.id_kamar = ?')
            replacements.push(id_kamar)
        }

        if (id_kategori_pengeluaran) {
            filters.push('p.id_kategori_pengeluaran = ?')
            replacements.push(id_kategori_pengeluaran)
        }

        // FILTER PERIODE ARUS KAS
        if (startDate && endDate) {
            filters.push('DATE(p.tanggal_pengeluaran) BETWEEN ? AND ?')
            replacements.push(startDate, endDate)
        } else if (startDate) {
            filters.push('DATE(p.tanggal_pengeluaran) >= ?')
            replacements.push(startDate)
        } else if (endDate) {
            filters.push('DATE(p.tanggal_pengeluaran) <= ?')
            replacements.push(endDate)
        }

        const sqlWhere = filters.length > 0 
            ? ` WHERE ${filters.join(' AND ')} `
            : ''

        const sql = sqlSelect + sqlFrom + sqlWhere + sqlOrder + sqlLimit

        // ======================
        // QUERY DATA
        // ======================
        const rows = await database.query(sql, {
            type: QueryTypes.SELECT,
            replacements: [...replacements, limit, offset]
        })

        const formattedData = rows.map(item => ({
            id: item.id,
            nama: item.nama,
            tanggalPengeluaran: item.tanggal_pengeluaran,
            total: item.total,
            catatan: item.catatan,
            properti: {
                id: item.id_properti,
                nama: item.properti_nama
            },
            kamar: {
                id: item.id_kamar,
                nama: item.kamar_nama
            },
            kategoriPengeluaran: {
                id: item.id_kategori_pengeluaran,
                nama: item.kategori_pengeluaran_nama
            },
            tempKey: item.temp_key,
            tanggalDibuat: item.tanggal_dibuat,
            tanggalDiubah: item.tanggal_diubah
        }))

        // ======================
        // QUERY COUNT
        // ======================
        const sqlCount = `
            SELECT COUNT(p.id) as total_row_count
            FROM KOS.pengeluaran p
            LEFT JOIN KOS.properti pr ON p.id_properti = pr.id
            LEFT JOIN KOS.kamar k ON p.id_kamar = k.id
            LEFT JOIN KOS.kategori_pengeluaran kp ON p.id_kategori_pengeluaran = kp.id
            ${sqlWhere}
        `

        const countResult = await database.query(sqlCount, {
            type: QueryTypes.SELECT,
            replacements: replacements
        })

        return {
            totalRowCount: countResult[0].total_row_count,
            page,
            limit,
            data: formattedData
        }

    } catch (error) {
        throw error
    }
}

export const show = async (id) => {
    try {
        // ======================
        // QUERY
        // ======================
        const sqlSelect = `
            SELECT 
                p.id,
                p.id_properti,
                pr.nama AS properti_nama,
                p.id_kamar,
                k.nama AS kamar_nama,
                p.id_kategori_pengeluaran,
                kp.nama AS kategori_pengeluaran_nama,
                p.tanggal_pengeluaran,
                p.nama,
                p.total,
                p.catatan,
                p.temp_key,
                p.tanggal_dibuat,
                p.tanggal_diubah
        `

        const sqlFrom = `
            FROM KOS.pengeluaran p
            LEFT JOIN KOS.properti pr ON p.id_properti = pr.id
            LEFT JOIN KOS.kamar k ON p.id_kamar = k.id
            LEFT JOIN KOS.kategori_pengeluaran kp ON p.id_kategori_pengeluaran = kp.id
        `

        const sqlWhere = `
            WHERE p.id = ?
            LIMIT 1
        `

        const sql = sqlSelect + sqlFrom + sqlWhere

        // ======================
        // EXECUTE
        // ======================
        const result = await database.query(sql, {
            type: QueryTypes.SELECT,
            replacements: [id]
        })

        // ======================
        // NOT FOUND
        // ======================
        if (result.length === 0) {
            return null
        }

        const item = result[0]

        // ======================
        // FORMAT
        // ======================
        return {
            id: item.id,
            nama: item.nama,
            tanggalPengeluaran: item.tanggal_pengeluaran,
            total: item.total,
            catatan: item.catatan,
            properti: {
                id: item.id_properti,
                nama: item.properti_nama
            },
            kamar: {
                id: item.id_kamar,
                nama: item.kamar_nama
            },
            kategoriPengeluaran: {
                id: item.id_kategori_pengeluaran,
                nama: item.kategori_pengeluaran_nama
            },
            tempKey: item.temp_key,
            tanggalDibuat: item.tanggal_dibuat,
            tanggalDiubah: item.tanggal_diubah
        }

    } catch (error) {
        throw error
    }
}