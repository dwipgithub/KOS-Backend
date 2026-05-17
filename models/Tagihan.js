import { DataTypes, QueryTypes } from "sequelize"
import { database } from "../config/Database.js"

export const tagihan = database.define('tagihan', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    id_sewa: {
        type: DataTypes.STRING
    },
    id_deskripsi_tagihan: {
        type: DataTypes.STRING
    },
    tanggal_tagihan: {
        type: DataTypes.DATEONLY
    },
    tanggal_jatuh_tempo: {
        type: DataTypes.DATEONLY
    },
    total: {
        type: DataTypes.DOUBLE
    },
    id_status_tagihan: {
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
            t.id,
            t.id_sewa,
            s.tanggal_masuk,
            s.tanggal_keluar,
            t.id_deskripsi_tagihan,
            t.tanggal_tagihan,
            t.tanggal_jatuh_tempo,
            t.total,
            t.id_status_tagihan,
            p.id as id_penyewa,
            p.nama as nama_penyewa,
            p.no_telp as no_telp_penyewa,
            p.email as email_penyewa,
            st.nama AS status_tagihan_nama
        `

        const sqlFrom = `
            FROM tagihan t
            JOIN sewa s ON t.id_sewa = s.id
            JOIN kamar k ON s.id_kamar = k.id
            JOIN penyewa p ON s.id_penyewa = p.id
            JOIN status_tagihan st ON t.id_status_tagihan = st.id
        `

        const sqlOrder = ` 
            ORDER BY 
            CASE
                WHEN t.id_deskripsi_tagihan = 'DP' THEN 1
                WHEN t.id_deskripsi_tagihan = 'RENT' THEN 2
                ELSE 99
            END,
            t.tanggal_jatuh_tempo ASC
        `
        const sqlLimit = ` LIMIT ? OFFSET ? `

        // ======================
        // FILTER
        // ======================
        const filters = []
        const replacements = []

        const { 
            idSewa, 
            idStatusTagihan, 
            jatuhTempoStart, 
            jatuhTempoEnd 
        } = req.query

        if (idSewa) {
            filters.push('t.id_sewa = ?')
            replacements.push(idSewa)
        }

        if (idStatusTagihan) {
            filters.push('t.id_status_tagihan = ?')
            replacements.push(idStatusTagihan)
        }

        // ======================
        // FILTER TANGGAL JATUH TEMPO
        // ======================
        if (jatuhTempoStart && jatuhTempoEnd) {
            filters.push('t.tanggal_jatuh_tempo BETWEEN ? AND ?')
            replacements.push(jatuhTempoStart, jatuhTempoEnd)

        } else if (jatuhTempoStart) {
            filters.push('t.tanggal_jatuh_tempo >= ?')
            replacements.push(jatuhTempoStart)

        } else if (jatuhTempoEnd) {
            filters.push('t.tanggal_jatuh_tempo <= ?')
            replacements.push(jatuhTempoEnd)
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

        const formattedData = rows.map(item => ({
            id: item.id,
            penyewa: {
                id: item.id_penyewa,
                nama: item.nama_penyewa,
                noTelp: item.no_telp_penyewa,
                email: item.email_penyewa
            },
            sewa: {
                id: item.id_sewa,
                tanggalMasuk: item.tanggal_masuk,
                tanggalKeluar: item.tanggal_keluar
            },
            idDeskripsiTagihan: item.id_deskripsi_tagihan,
            tanggalTagihan: item.tanggal_tagihan,
            tanggalJatuhTempo: item.tanggal_jatuh_tempo,
            total: item.total,
            statusTagihan: {
                id: item.id_status_tagihan,
                nama: item.status_tagihan_nama
            }
        }))

        // ======================
        // QUERY COUNT
        // ======================
        const sqlCount = `
            SELECT COUNT(t.id) AS total_row_count
            FROM tagihan t
            JOIN sewa s ON t.id_sewa = s.id
            JOIN kamar k ON s.id_kamar = k.id
            JOIN penyewa p ON s.id_penyewa = p.id
            JOIN status_tagihan st ON t.id_status_tagihan = st.id
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
        const sqlSelect = `
            SELECT 
            t.id,
            t.id_sewa,
            s.tanggal_masuk,
            s.tanggal_keluar,
            t.tanggal_tagihan,
            t.tanggal_jatuh_tempo,
            t.total,
            t.id_status_tagihan,
            st.nama AS status_tagihan_nama
        `

        const sqlFrom = `
            FROM tagihan t
            JOIN sewa s ON t.id_sewa = s.id
            JOIN status_tagihan st ON t.id_status_tagihan = st.id
        `

        const sqlWhere = ` WHERE t.id = ? `

        const sql = sqlSelect + sqlFrom + sqlWhere

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
        // FORMAT DATA
        // ======================
        return {
            id: row.id,
            sewa: {
                id: row.id_sewa,
                tanggalMasuk: row.tanggal_masuk,
                tanggalKeluar: row.tanggal_keluar
            },
            tanggalTagihan: row.tanggal_tagihan,
            tanggalJatuhTempo: row.tanggal_jatuh_tempo,
            total: row.total,
            statusTagihan: {
                id: row.id_status_tagihan,
                nama: row.status_tagihan_nama
            }
        }

    } catch (error) {
        throw error
    }
}