import { DataTypes, QueryTypes } from "sequelize"
import { database } from "../config/Database.js"

export const mutasi_kas_operasional = database.define('mutasi_kas_operasional', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    id_kas: {
        type: DataTypes.STRING
    },
    tipe: {
        type: DataTypes.STRING
    },
    tanggal_mutasi_kas: {
        type: DataTypes.DATE
    },
    total: {
        type: DataTypes.DOUBLE
    },
    keterangan: {
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

// ======================
// GET
// ======================
export const get = async (req) => {
    try {
        const page = parseInt(req.query.page) || 1
        const limit =
            parseInt(req.query.limit) > 100
                ? 100
                : parseInt(req.query.limit) || 100

        const offset = (page - 1) * limit

        // ======================
        // SELECT
        // ======================
        const sqlSelect = `
            SELECT
                mk.id,
                mk.id_kas,
                k.nama AS kas_nama,
                mk.tipe,
                mk.tanggal_mutasi_kas,
                mk.total,
                mk.keterangan,
                mk.temp_key
        `

        const sqlFrom = `
            FROM KOS.mutasi_kas_operasional mk
            LEFT JOIN KOS.kas k
                ON mk.id_kas = k.id
        `

        const sqlOrder = `
            ORDER BY mk.tanggal_mutasi_kas DESC
        `

        const sqlLimit = `
            LIMIT ? OFFSET ?
        `

        // ======================
        // FILTER
        // ======================
        const filters = []
        const replacements = []

        const {
            id_kas,
            tipe,
            startDate,
            endDate,
            keterangan
        } = req.query

        if (id_kas) {
            filters.push('mk.id_kas = ?')
            replacements.push(id_kas)
        }

        if (tipe) {
            filters.push('mk.tipe = ?')
            replacements.push(tipe)
        }

        if (keterangan) {
            filters.push('mk.keterangan LIKE ?')
            replacements.push(`%${keterangan}%`)
        }

        // ======================
        // FILTER PERIODE
        // ======================
        if (startDate && endDate) {
            filters.push('DATE(mk.tanggal_mutasi_kas) BETWEEN ? AND ?')
            replacements.push(startDate, endDate)
        } else if (startDate) {
            filters.push('DATE(mk.tanggal_mutasi_kas) >= ?')
            replacements.push(startDate)
        } else if (endDate) {
            filters.push('DATE(mk.tanggal_mutasi_kas) <= ?')
            replacements.push(endDate)
        }

        const sqlWhere =
            filters.length > 0
                ? ` WHERE ${filters.join(' AND ')} `
                : ''

        const sql =
            sqlSelect +
            sqlFrom +
            sqlWhere +
            sqlOrder +
            sqlLimit

        // ======================
        // QUERY DATA
        // ======================
        const rows = await database.query(sql, {
            type: QueryTypes.SELECT,
            replacements: [...replacements, limit, offset]
        })

        const formattedData = rows.map(item => ({
            id: item.id,
            tipe: item.tipe,
            tanggalMutasiKas: item.tanggal_mutasi_kas,
            total: item.total,
            keterangan: item.keterangan,
            kas: {
                id: item.id_kas,
                nama: item.kas_nama
            },
            tempKey: item.temp_key
        }))

        // ======================
        // QUERY COUNT
        // ======================
        const sqlCount = `
            SELECT COUNT(mk.id) AS total_row_count
            FROM KOS.mutasi_kas_operasional mk
            LEFT JOIN KOS.kas k
                ON mk.id_kas = k.id
            ${sqlWhere}
        `

        const countResult = await database.query(sqlCount, {
            type: QueryTypes.SELECT,
            replacements
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

// ======================
// SHOW
// ======================
export const show = async (id) => {
    try {

        // ======================
        // SELECT
        // ======================
        const sqlSelect = `
            SELECT
                mk.id,
                mk.id_kas,
                k.nama AS kas_nama,
                mk.tipe,
                mk.tanggal_mutasi_kas,
                mk.total,
                mk.keterangan,
                mk.temp_key
        `

        const sqlFrom = `
            FROM KOS.mutasi_kas_operasional mk
            LEFT JOIN KOS.kas k
                ON mk.id_kas = k.id
        `

        const sqlWhere = `
            WHERE mk.id = ?
            LIMIT 1
        `

        const sql =
            sqlSelect +
            sqlFrom +
            sqlWhere

        // ======================
        // QUERY
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
            tipe: item.tipe,
            tanggalMutasiKas: item.tanggal_mutasi_kas,
            total: item.total,
            keterangan: item.keterangan,
            kas: {
                id: item.id_kas,
                nama: item.kas_nama
            },
            tempKey: item.temp_key
        }

    } catch (error) {
        throw error
    }
}