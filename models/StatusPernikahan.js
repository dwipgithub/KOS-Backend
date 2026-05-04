import { DataTypes, QueryTypes } from "sequelize"
import { database } from "../config/Database.js"

export const statusPernikahan = database.define('status_pernikahan', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    nama: {
        type: DataTypes.STRING
    }
}, {
    freezeTableName: true
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
            nama
            FROM status_pernikahan
            LIMIT :limit OFFSET :offset
        `

        const data = await database.query(sqlSelect, {
            replacements: { limit, offset },
            type: QueryTypes.SELECT
        })

        const sqlCount = `
            SELECT COUNT(*) AS total_row_count FROM status_pernikahan
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