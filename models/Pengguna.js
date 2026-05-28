import { DataTypes, QueryTypes } from "sequelize"
import { database } from "../config/Database.js"

export const pengguna = database.define('pengguna', {
    nama: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    refresh_token: {
        type: DataTypes.TEXT
    },
    peran: {
        type: DataTypes.ENUM('OWNER', 'ADMIN', 'OPERATOR'),
        allowNull: false
    },
    properti_id: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    freezeTableName: true
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
                p.nama,
                p.email,
                p.peran,
                p.properti_id
        `

        // ======================
        // FROM
        // ======================
        const sqlFrom = `
            FROM pengguna p
        `

        // ======================
        // FILTER
        // ======================
        const filters = []
        const replacements = []

        const {
            nama,
            email,
            peran,
            propertiId
        } = req.query

        // ======================
        // ROLE FILTER
        // ======================
        if (req.user.peran === 'OPERATOR') {
            filters.push('p.email = ?')
            replacements.push(req.user.email)
        }

        if (nama) {
            filters.push('p.nama LIKE ?')
            replacements.push(`%${nama}%`)
        }

        if (email) {
            filters.push('p.email LIKE ?')
            replacements.push(`%${email}%`)
        }

        if (peran) {
            filters.push('p.peran = ?')
            replacements.push(peran)
        }

        if (propertiId) {
            filters.push('p.properti_id = ?')
            replacements.push(propertiId)
        }

        const sqlWhere =
            filters.length > 0
                ? ` WHERE ${filters.join(' AND ')} `
                : ''

        // ======================
        // ORDER
        // ======================
        const sqlOrder = `
            ORDER BY p.tanggal_buat DESC
        `

        // ======================
        // LIMIT
        // ======================
        const sqlLimit = `
            LIMIT ? OFFSET ?
        `

        // ======================
        // FINAL SQL
        // ======================
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
            replacements: [
                ...replacements,
                limit,
                offset
            ]
        })

        // ======================
        // FORMAT DATA
        // ======================
        const formattedData = rows.map((item) => ({
            id: item.id,
            nama: item.nama,
            email: item.email,
            peran: item.peran,
            propertiId: item.properti_id
        }))

        // ======================
        // COUNT QUERY
        // ======================
        const sqlCount = `
            SELECT COUNT(p.id) AS total_row_count
            FROM pengguna p
            ${sqlWhere}
        `

        const countResult = await database.query(sqlCount, {
            type: QueryTypes.SELECT,
            replacements
        })

        // ======================
        // RETURN
        // ======================
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
                p.nama,
                p.email,
                p.peran,
                p.properti_id
        `

        // ======================
        // FROM
        // ======================
        const sqlFrom = `
            FROM pengguna p
        `

        // ======================
        // WHERE
        // ======================
        const sqlWhere = `
            WHERE p.id = ?
        `

        // ======================
        // FINAL SQL
        // ======================
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
        // HANDLE NOT FOUND
        // ======================
        if (result.length === 0) {
            return null
        }

        const row = result[0]

        // ======================
        // RETURN
        // ======================
        return {
            id: row.id,
            nama: row.nama,
            email: row.email,
            peran: row.peran,
            propertiId: row.properti_id,
            tanggalBuat: row.tanggal_buat,
            tanggalUbah: row.tanggal_ubah
        }

    } catch (error) {
        throw error
    }
}