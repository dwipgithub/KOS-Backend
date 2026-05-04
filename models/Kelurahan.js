import { DataTypes, QueryTypes } from "sequelize"
import { database } from "../config/Database.js"

export const kelurahan = database.define('kelurahan', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    nama: {
        type: DataTypes.STRING
    },
    kecamatan_id: {
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
            nama,
            kecamatan_id
        `

        const sqlFrom = `
            FROM kelurahan
        `

        const sqlOrder = ' ORDER BY id '

        const sqlLimit = ' LIMIT ? OFFSET ? '

        const filters = []
        const replacements = []

        const { nama, kecamatanId } = req.query

        if (nama) {
            filters.push("nama LIKE ?")
            replacements.push(`%${nama}%`)
        }

        if (kecamatanId) {
            filters.push("kecamatan_id = ?")
            replacements.push(kecamatanId)
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

         // ======================
        // QUERY COUNT
        // ======================
        const sqlCount = `
            SELECT count(k.id) as total_row_count
            FROM kelurahan k
            ${sqlWhere}
        `

        const countResult = await database.query(sqlCount, {
            type: QueryTypes.SELECT,
            replacements: replacements
        })

        const formattedData = rows.map(item => ({
            id: item.id,
            nama: item.nama,
            kecamatanId: item.kecamatan_id
        }))

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
        const result = await kelurahan.findByPk(id)

        return {
            id: result.id,
            nama: result.nama,
            kecamatanId: result.kecamatan_id
        }
    } catch (error) {
        throw error
    }
}