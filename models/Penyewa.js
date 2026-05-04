import { DataTypes, QueryTypes } from "sequelize"
import { database } from "../config/Database.js"
import { privateFileUrl } from "../helpers/privateFileUrl.js"

export const penyewa = database.define('penyewa', {
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
    email: {
        type: DataTypes.STRING
    },
    id_pengenal: {
        type: DataTypes.STRING
    },
    no_pengenal: {
        type: DataTypes.STRING
    },
    id_jenis_kelamin: {
        type: DataTypes.STRING
    },
    id_status_pernikahan: {
        type: DataTypes.STRING
    },
    id_profesi: {
        type: DataTypes.STRING
    },
    nama_institusi: {
        type: DataTypes.STRING
    },
    alamat_institusi: {
        type: DataTypes.STRING
    },
    no_telp_institusi: {
        type: DataTypes.STRING
    },
    temp_key: {
        type: DataTypes.STRING
    },
    dokumen_pengenal: {
        type: DataTypes.STRING(512),
        allowNull: true
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
                p.nama,
                p.alamat,
                p.no_telp,
                p.email,
                p.id_pengenal,
                p.no_pengenal,
                p.id_jenis_kelamin,
                jk.nama AS jenis_kelamin_nama,
                p.id_status_pernikahan,
                sp.nama AS status_pernikahan_nama,
                p.id_profesi,
                pr.nama AS profesi_nama,
                p.nama_institusi,
                p.alamat_institusi,
                p.no_telp_institusi,
                p.dokumen_pengenal
        `

        const sqlFrom = `
            FROM KOS.penyewa p
            LEFT JOIN KOS.pengenal pen ON p.id_pengenal = pen.id
            LEFT JOIN KOS.jenis_kelamin jk ON p.id_jenis_kelamin = jk.id
            LEFT JOIN KOS.status_pernikahan sp ON p.id_status_pernikahan = sp.id
            LEFT JOIN KOS.profesi pr ON p.id_profesi = pr.id
        `

        const sqlOrder = ` ORDER BY p.nama DESC `
        const sqlLimit = ` LIMIT ? OFFSET ? `

        // ======================
        // FILTER
        // ======================
        const filters = []
        const replacements = []

        const { 
            nama, 
            alamat,
            no_telp,
            email,
            id_pengenal,
            no_pengenal,
            id_jenis_kelamin,
            id_status_pernikahan
        } = req.query

        if (nama) {
            filters.push('p.nama LIKE ?')
            replacements.push(`%${nama}%`)
        }

        if (alamat) {
            filters.push('p.alamat ILIKE ?')
            replacements.push(`%${alamat}%`)
        }

        if (no_telp) {
            filters.push('p.no_telp ILIKE ?')
            replacements.push(`%${no_telp}%`)
        }

        if (email) {
            filters.push('p.email ILIKE ?')
            replacements.push(`%${email}%`)
        }

        if (id_pengenal) {
            filters.push('p.id_pengenal = ?')
            replacements.push(id_pengenal)
        }

        if (no_pengenal) {
            filters.push('p.no_pengenal = ?')
            replacements.push(no_pengenal)
        }

        if (id_jenis_kelamin) {
            filters.push('p.id_jenis_kelamin = ?')
            replacements.push(id_jenis_kelamin)
        }

        if (id_status_pernikahan) {
            filters.push('p.id_status_pernikahan = ?')
            replacements.push(id_status_pernikahan)
        }

        const sqlWhere = filters.length > 0 
            ? ` WHERE ${filters.join(' AND ')} `
            : ''

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
            nama: item.nama,
            alamat: item.alamat,
            noTelp: item.no_telp,
            email: item.email,
            pengenal: {
                id: item.id_pengenal,
                noPengenal: item.no_pengenal
            },
            jenisKelamin: {
                id: item.id_jenis_kelamin,
                nama: item.jenis_kelamin_nama
            },
            statusPernikahan: {
                id: item.id_status_pernikahan,
                nama: item.status_pernikahan_nama
            },
            profesi: {
                id: item.id_profesi,
                nama: item.profesi_nama
            },
            institusi: {
                nama: item.nama_institusi,
                alamat: item.alamat_institusi,
                noTelp: item.no_telp_institusi
            },
            dokumenPengenal: privateFileUrl(item.dokumen_pengenal)
        }))

        // ======================
        // QUERY COUNT (🔥 FIXED)
        // ======================
        const sqlCount = `
            SELECT COUNT(p.id) as total_row_count
            FROM KOS.penyewa p
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
        // ======================
        // QUERY
        // ======================
        const sqlSelect = `
            SELECT 
                p.id,
                p.nama,
                p.alamat,
                p.no_telp,
                p.email,
                p.id_pengenal,
                p.no_pengenal,
                p.id_jenis_kelamin,
                jk.nama AS jenis_kelamin_nama,
                p.id_status_pernikahan,
                sp.nama AS status_pernikahan_nama,
                p.id_profesi,
                pr.nama AS profesi_nama,
                p.nama_institusi,
                p.alamat_institusi,
                p.no_telp_institusi,
                p.dokumen_pengenal
        `

        const sqlFrom = `
            FROM KOS.penyewa p
            LEFT JOIN KOS.pengenal pen ON p.id_pengenal = pen.id
            LEFT JOIN KOS.jenis_kelamin jk ON p.id_jenis_kelamin = jk.id
            LEFT JOIN KOS.status_pernikahan sp ON p.id_status_pernikahan = sp.id
            LEFT JOIN KOS.profesi pr ON p.id_profesi = pr.id
        `

        const sqlWhere = `
            WHERE p.id = ?
            LIMIT 1
        `

        const sql = sqlSelect + sqlFrom + sqlWhere

        // ======================
        // EXECUTE
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
            nama: item.nama,
            alamat: item.alamat,
            noTelp: item.no_telp,
            email: item.email,
            pengenal: {
                id: item.id_pengenal,
                noPengenal: item.no_pengenal
            },
            jenisKelamin: {
                id: item.id_jenis_kelamin,
                nama: item.jenis_kelamin_nama
            },
            statusPernikahan: {
                id: item.id_status_pernikahan,
                nama: item.status_pernikahan_nama
            },
            profesi: {
                id: item.id_profesi,
                nama: item.profesi_nama
            },
            institusi: {
                nama: item.nama_institusi,
                alamat: item.alamat_institusi,
                noTelp: item.no_telp_institusi
            },
            dokumenPengenal: privateFileUrl(item.dokumen_pengenal)
        }

    } catch (error) {
        throw error
    }
}