import { DataTypes, QueryTypes } from "sequelize"
import { database } from "../config/Database.js"

export const keluar = database.define('keluar', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    id_sewa: {
        type: DataTypes.STRING
    },
    tanggal_keluar: {
        type: DataTypes.DATEONLY
    },
    catatan: {
        type: DataTypes.TEXT
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
        // SELECT
        // ======================
        const sqlSelect = `
            SELECT 
            k.id,
            k.id_sewa,
            s.tanggal_mulai,
            s.tanggal_keluar,
            k.tanggal_keluar,
            k.catatan
        `

        // ======================
        // FROM
        // ======================
        const sqlFrom = `
            FROM keluar k
            JOIN sewa s ON k.id_sewa = s.id
        `

        const sqlOrder = ` ORDER BY t.tanggal_jatuh_tempo ASC `
        const sqlLimit = ` LIMIT ? OFFSET ? `

        // ======================
        // FILTER
        // ======================
        const filters = []
        const replacements = []

        const { id_sewa } = req.query

        if (id_sewa) {
            filters.push(`k.id_sewa = ?`)
            replacements.push(id_sewa)
        }

        const sqlWhere = filters.length ? ' WHERE ' + filters.join(' AND ') : ''

        const sql = sqlSelect + sqlFrom + sqlWhere + sqlOrder + sqlLimit

        // ======================
        // QUERY DATA
        // ======================
        const rows = await database.query(sql, {
            type: QueryTypes.SELECT,
            replacements: [...replacements, limit, offset]
        })

        const formatteData = rows.map(row => ({
            id: row.id,
            idSewa: row.id_sewa,
            tanggalMulai: row.tanggal_mulai,
            tanggalKeluarSewa: row.tanggal_keluar,
            tanggalKeluar: row.tanggal_keluar,
            catatan: row.catatan
        }))

        // ======================
        // QUERY COUNT
        // ======================
        const sqlCount = `
            SELECT COUNT(k.id) AS total_row_count
            FROM keluar k
            JOIN sewa s ON k.id_sewa = s.id
        `

        const countRows = await database.query(sqlCount, {
            type: QueryTypes.SELECT,
            replacements
        })

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
    } catch (err) {
        throw err
    }
}