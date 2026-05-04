import { DataTypes, QueryTypes } from "sequelize"
import { database } from "../config/Database.js"

export const provinsi = database.define('provinsi', {
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

        const sqlSelect = `
            SELECT 
            id,
            nama
        `

        const sqlFrom = `
            FROM provinsi
        `

        const sqlOrder = ' ORDER BY id '

        const sqlLimit = ' LIMIT ? OFFSET ? '

        const filters = []
        const replacements = []

        const { nama } = req.query

        if (nama) {
            filters.push("nama LIKE ?")
            replacements.push(`%${nama}%`)
        }

        const sqlWhere = filters.length > 0 ? " WHERE " + filters.join(" AND ") : ""

        const sql = sqlSelect + sqlFrom + sqlWhere + sqlOrder + sqlLimit

        // ======================
        // QUERY DATA
        // ======================
        const rows = await database.query(sql, {
            type: QueryTypes.SELECT,
            replacements: [...replacements, limit, offset]
        })

        console.log("Provinsi List:", rows)

         // ======================
        // QUERY COUNT
        // ======================
        const sqlCount = `
            SELECT count(k.id) as total_row_count
            FROM provinsi k
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
            data: rows
        }
    } catch (error) {
        throw error
    }
}