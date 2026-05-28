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
    harga_satuan: {
        type: DataTypes.DOUBLE
    },
    jumlah: {
        type: DataTypes.INTEGER
    },
    diskon_persen: {
        type: DataTypes.DECIMAL(5, 2)
    },
    diskon_nominal: {
        type: DataTypes.DOUBLE
    },
    total: {
        type: DataTypes.DOUBLE
    },
    tanggal_tagihan: {
        type: DataTypes.DATEONLY
    },
    tanggal_jatuh_tempo: {
        type: DataTypes.DATEONLY
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
                t.id,
                t.id_sewa,

                s.tanggal_masuk,
                s.tanggal_keluar,

                t.id_deskripsi_tagihan,

                t.tanggal_tagihan,
                t.tanggal_jatuh_tempo,
                t.total,

                t.id_status_tagihan,
                st.nama AS status_tagihan_nama,

                p.id AS id_penyewa,
                p.nama AS nama_penyewa,
                p.no_telp AS no_telp_penyewa
        `

        // ======================
        // FROM
        // ======================
        const sqlFrom = `
            FROM tagihan t

            JOIN sewa s 
                ON t.id_sewa = s.id

            JOIN kamar k 
                ON s.id_kamar = k.id

            JOIN penyewa p 
                ON s.id_penyewa = p.id

            JOIN status_tagihan st 
                ON t.id_status_tagihan = st.id
        `

        // ======================
        // FILTER
        // ======================
        const filters = [
            "t.tanggal_dihapus IS NULL"
        ]
        const replacements = []

        const {
            idSewa,
            idStatusTagihan,
            jatuhTempoStart,
            jatuhTempoEnd
        } = req.query

        if (idSewa) {
            filters.push("t.id_sewa = ?")
            replacements.push(idSewa)
        }

        if (idStatusTagihan) {
            filters.push("t.id_status_tagihan = ?")
            replacements.push(idStatusTagihan)
        }

        // ======================
        // FILTER TANGGAL JATUH TEMPO
        // ======================
        if (jatuhTempoStart && jatuhTempoEnd) {

            filters.push("t.tanggal_jatuh_tempo BETWEEN ? AND ?")
            replacements.push(jatuhTempoStart, jatuhTempoEnd)

        } else if (jatuhTempoStart) {

            filters.push("t.tanggal_jatuh_tempo >= ?")
            replacements.push(jatuhTempoStart)

        } else if (jatuhTempoEnd) {

            filters.push("t.tanggal_jatuh_tempo <= ?")
            replacements.push(jatuhTempoEnd)
        }

        const sqlWhere =
            filters.length > 0
                ? " WHERE " + filters.join(" AND ")
                : ""

        // ======================
        // ORDER
        // ======================
        const sqlOrder = `
            ORDER BY 
                CASE
                    WHEN t.id_deskripsi_tagihan = 'DP' THEN 1
                    WHEN t.id_deskripsi_tagihan = 'DEPOSIT' THEN 2
                    WHEN t.id_deskripsi_tagihan = 'RENT' THEN 3
                    ELSE 99
                END,
                t.tanggal_jatuh_tempo ASC
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

            penyewa: {
                id: item.id_penyewa,
                nama: item.nama_penyewa,
                noTelp: item.no_telp_penyewa
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
        // COUNT QUERY
        // ======================
        const sqlCount = `
            SELECT COUNT(t.id) AS total_row_count

            FROM tagihan t

            JOIN sewa s 
                ON t.id_sewa = s.id

            JOIN kamar k 
                ON s.id_kamar = k.id

            JOIN penyewa p 
                ON s.id_penyewa = p.id

            JOIN status_tagihan st 
                ON t.id_status_tagihan = st.id

            ${sqlWhere}
        `

        const countResult = await database.query(sqlCount, {
            type: QueryTypes.SELECT,
            replacements: replacements
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

export const show = async (idSewa) => {
    try {
        // ======================
        // SELECT
        // ======================
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
                st.nama AS status_tagihan_nama,

                t.id_jenis_tagihan,
                jt.kode AS jenis_tagihan_kode,
                jt.nama AS jenis_tagihan_nama
        `

        // ======================
        // FROM
        // ======================
        const sqlFrom = `
            FROM tagihan t
            JOIN sewa s 
                ON t.id_sewa = s.id

            JOIN status_tagihan st 
                ON t.id_status_tagihan = st.id

            JOIN jenis_tagihan jt
                ON t.id_jenis_tagihan = jt.id
        `

        // ======================
        // WHERE
        // ======================
        const sqlWhere = `
            WHERE t.id_sewa = ?
        `

        // ======================
        // ORDER
        // ======================
        const sqlOrder = `
            ORDER BY
                CASE
                    WHEN jt.kode = 'DP' THEN 1
                    WHEN jt.kode = 'DEPOSIT' THEN 2
                    WHEN jt.kode = 'RENT' THEN 3
                    ELSE 999
                END,
                t.tanggal_tagihan ASC
        `

        // ======================
        // FINAL SQL
        // ======================
        const sql = sqlSelect + sqlFrom + sqlWhere + sqlOrder

        // ======================
        // QUERY
        // ======================
        const result = await database.query(sql, {
            type: QueryTypes.SELECT,
            replacements: [idSewa]
        })

        // ======================
        // HANDLE EMPTY
        // ======================
        if (result.length === 0) {
            return []
        }

        // ======================
        // FORMAT DATA
        // ======================
        return result.map((row) => ({
            id: row.id,

            sewa: {
                id: row.id_sewa,
                tanggalMasuk: row.tanggal_masuk,
                tanggalKeluar: row.tanggal_keluar
            },

            jenisTagihan: {
                id: row.id_jenis_tagihan,
                kode: row.jenis_tagihan_kode,
                nama: row.jenis_tagihan_nama
            },

            tanggalTagihan: row.tanggal_tagihan,
            tanggalJatuhTempo: row.tanggal_jatuh_tempo,

            total: row.total,

            statusTagihan: {
                id: row.id_status_tagihan,
                nama: row.status_tagihan_nama
            }
        }))

    } catch (error) {
        throw error
    }
}

export const destroy = async (id) => {
    try {

        const sql = `
            UPDATE tagihan
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