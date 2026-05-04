import { DataTypes, QueryTypes } from "sequelize"
import { database } from "../config/Database.js"

export const institusi = database.define('institusi', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    nama: {
        type: DataTypes.STRING
    },
    alamat: {
        type: DataTypes.STRING
    },
    no_telp: {
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
        // SELECT
        // ======================
        const sqlSelect = `
            SELECT 
            id,
            nama,
            alamat,
            no_telp
            FROM institusi
            LIMIT :limit OFFSET :offset
        `

        const data = await database.query(sqlSelect, {
            replacements: { limit, offset },
            type: QueryTypes.SELECT
        })

        const sqlCount = `
            SELECT COUNT(id) AS total_row_count FROM institusi
        `

        const countResult = await database.query(sqlCount, {
            type: QueryTypes.SELECT
        })

        return {
            totalRowCount: countResult[0].total_row_count,
            page: page,
            limit: limit,
            data: data
        }
    } catch (error) {
        throw error
    }
}

export const show = async (id) => {
    try {
        const sqlSelect = `
            SELECT 
                p.id,
                p.nama,
                p.alamat,
                p.no_telp
        `

        const sqlFrom = `
            FROM KOS.institusi p
        `

        const sqlWhere = `
            WHERE p.id = ?
            LIMIT 1
        `

        const sql = sqlSelect + sqlFrom + sqlWhere

        const result = await database.query(sql, {
            type: QueryTypes.SELECT,
            replacements: [id]
        })

        if (result.length === 0) {
            return null
        }

        const row = result[0]

        // ======================
        // FORMAT RESPONSE
        // ======================
        const formattedData = {
            id: row.id,
            nama: row.nama
        }

        return formattedData

    } catch (error) {
        throw error
    }
}

