import { DataTypes, QueryTypes } from "sequelize"
import { database } from "../config/Database.js"

export const pemasukan = database.define('pemasukan', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    keterangan: {
        type: DataTypes.STRING
    },
    total: {
        type: DataTypes.DOUBLE
    },
    tanggal_pemasukan: {
        type: DataTypes.DATE
    },
    temp_key: {
        type: DataTypes.STRING
    },
    pengguna_id: {
        type: DataTypes.INTEGER
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
                p.id,
                p.keterangan,
                p.total,
                p.tanggal_pemasukan,
                p.temp_key
        `

        const sqlFrom = `
            FROM KOS.pemasukan p
        `

        const sqlOrder = `
            ORDER BY p.tanggal_pemasukan DESC
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
            startDate,
            penggunaId,
            endDate,
            keterangan
        } = req.query

        if (keterangan) {
            filters.push('p.keterangan LIKE ?')
            replacements.push(`%${keterangan}%`)
        }

        // ======================
        // FILTER PERIODE
        // ======================
        if (startDate && endDate) {
            filters.push('DATE(p.tanggal_pemasukan) BETWEEN ? AND ?')
            replacements.push(startDate, endDate)
        } else if (startDate) {
            filters.push('DATE(mk.tanggal_pemasukan) >= ?')
            replacements.push(startDate)
        } else if (endDate) {
            filters.push('DATE(mk.tanggal_pemasukan) <= ?')
            replacements.push(endDate)
        }

        // ======================
        // FILTER PENGGUNA
        // ======================
        if (penggunaId) {
            filters.push("mp.pengguna_id = ?")
            replacements.push(penggunaId)
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
            tanggalPemasukan: item.tanggal_pemasukan,
            total: item.total,
            keterangan: item.keterangan,
            tempKey: item.temp_key
        }))

        // ======================
        // QUERY COUNT
        // ======================
        const sqlCount = `
            SELECT COUNT(p.id) AS total_row_count
            FROM KOS.pemasukan p
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
                p.id,
                p.tanggal_pemasukan,
                p.total,
                p.keterangan,
                p.temp_key
        `

        const sqlFrom = `
            FROM KOS.pemasukan p
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
            tanggalPemasukan: item.tanggal_pemasukan,
            total: item.total,
            keterangan: item.keterangan,
            tempKey: item.temp_key
        }

    } catch (error) {
        throw error
    }
}

export const destroy = async (id) => {
    try {

        const sql = `
            UPDATE pemasukan
            SET 
                tanggal_dihapus = NOW()
            WHERE id = ?
        `

        const result = await database.query(sql, {
            type: QueryTypes.UPDATE,
            replacements: [id]
        })

        return result

    } catch (error) {
        throw error
    }
}