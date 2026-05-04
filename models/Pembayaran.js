import { DataTypes, QueryTypes } from "sequelize"
import { database } from "../config/Database.js"
import { privateFileUrl } from "../helpers/privateFileUrl.js"

export const pembayaran = database.define("pembayaran", {
    id: { 
        type: DataTypes.STRING,
        primaryKey: true
    },
    id_tagihan: {
        type: DataTypes.STRING
    },
    tanggal_bayar: {
        type: DataTypes.DATE
    },
    total_bayar: {
        type: DataTypes.DOUBLE
    },
    id_metode_bayar: {
        type: DataTypes.STRING
    },
    bukti_bayar: {
        type: DataTypes.STRING(512),
        allowNull: true
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
            p.id,
            p.id_tagihan,
            p.tanggal_bayar,
            p.total_bayar,
            p.id_metode_bayar,
            p.bukti_bayar,
            s.id_kamar,
            s.id_penyewa,
            k.nama AS nama_kamar,
            pe.nama AS nama_penyewa,
            mb.nama AS nama_metode_bayar
        `

        const sqlFrom = `
            FROM pembayaran p
            JOIN tagihan t ON p.id_tagihan = t.id
            JOIN sewa s ON t.id_sewa = s.id
            JOIN kamar k ON s.id_kamar = k.id
            JOIN penyewa pe ON s.id_penyewa = pe.id
            JOIN metode_bayar mb ON p.id_metode_bayar = mb.id
        `

        const sqlOrder = ` ORDER BY p.tanggal_bayar DESC `
        const sqlLimit = ' LIMIT ? '
        const sqlOffset = ' OFFSET ? '

        // ======================
        // FILTER
        // ======================
        const filters = []
        const replacements = []

        const { id_tagihan } = req.query
        if (id_tagihan) {
            filters.push('p.id_tagihan = ?')
            replacements.push(id_tagihan)
        }

        const sqlWhere = filters.length > 0 ? ' WHERE ' + filters.join(' AND ') : ''
        const sqlQuery = sqlSelect + sqlFrom + sqlWhere + sqlOrder + sqlLimit + sqlOffset

        // ======================
        // QUERY DATA
        // ======================
        const result = await database.query(sqlQuery, {
            replacements: [...replacements, limit, offset],
            type: QueryTypes.SELECT
        })

        // ======================
        // FORMAT DATA
        // ======================
        const formattedData = result.map(item => ({
            id: item.id,
            idTagihan: item.id_tagihan,
            tanggalBayar: item.tanggal_bayar,
            totalBayar: item.total_bayar,
            buktiBayar: privateFileUrl(item.bukti_bayar),
            metodeBayar: {
                id: item.id_metode_bayar,
                nama: item.nama_metode_bayar
            },
            kamar: {
                id: item.id_kamar,
                nama: item.nama_kamar
            },
            penyewa: {
                id: item.id_penyewa,
                nama: item.nama_penyewa
            }
        }))

        // ======================
        // HITUNG TOTAL ROW
        // ======================
        const sqlCount = `
            SELECT COUNT(*) AS totalRowCount
            ${sqlFrom}
            ${sqlWhere}
        `
        const countResult = await database.query(sqlCount, {
            replacements,
            type: QueryTypes.SELECT
        })
        const totalRowCount = countResult[0].totalRowCount

        return {
            totalRowCount,
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
        const sqlSelect = `
            SELECT 
            p.id,
            p.id_tagihan,
            p.tanggal_bayar,
            p.total_bayar,
            p.id_metode_bayar,
            p.bukti_bayar,
            s.id_kamar,
            s.id_penyewa,
            k.nama AS nama_kamar,
            pe.nama AS nama_penyewa,
            mb.nama AS nama_metode_bayar
        `

        const sqlFrom = `
            FROM pembayaran p
            JOIN tagihan t ON p.id_tagihan = t.id
            JOIN sewa s ON t.id_sewa = s.id
            JOIN kamar k ON s.id_kamar = k.id
            JOIN penyewa pe ON s.id_penyewa = pe.id
            JOIN metode_bayar mb ON p.id_metode_bayar = mb.id
        `

        const sqlWhere = `WHERE p.id = ?`
        const sql = sqlSelect + sqlFrom + sqlWhere

        // ======================
        // QUERY
        // ======================
        const result = await database.query(sql, {
            replacements: [id],
            type: QueryTypes.SELECT
        })

        // ======================
        // HANDLE NOT FOUND
        // ======================
        if (result.length === 0) {
            return null
        }

        const item = result[0]

        // ======================
        // FORMAT DATA
        // ======================
        return {
            id: item.id,
            idTagihan: item.id_tagihan,
            tanggalBayar: item.tanggal_bayar,
            totalBayar: item.total_bayar,
            buktiBayar: privateFileUrl(item.bukti_bayar),
            metodeBayar: {
                id: item.id_metode_bayar,
                nama: item.nama_metode_bayar
            },
            kamar: {
                id: item.id_kamar,
                nama: item.nama_kamar
            },
            penyewa: {
                id: item.id_penyewa,
                nama: item.nama_penyewa
            }
        }

    } catch (error) {
        throw error
    }
}