import { DataTypes, QueryTypes } from "sequelize"
import { database } from "../config/Database.js"

export const properti = database.define('properti', {
    id: {
        type: DataTypes.STRING, // atau sesuai
        primaryKey: true
    },
    nama: {
        type: DataTypes.STRING
    },
    no_telp: {
        type: DataTypes.STRING
    },
    alamat: {
        type: DataTypes.STRING
    },
    catatan: {
        type: DataTypes.TEXT
    },
    id_provinsi: {
        type: DataTypes.CHAR
    },
    id_kab_kota: {
        type: DataTypes.CHAR
    },
    id_kecamatan: {
        type: DataTypes.CHAR
    },
    id_kelurahan: {
        type: DataTypes.CHAR
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
        // QUERY PROPERTI
        // ======================
        const sqlSelect = `
            SELECT 
                p.id,
                p.nama,
                p.no_telp,
                p.alamat,
                p.catatan,
                p.id_provinsi,
                prov.nama AS provinsi_nama,
                p.id_kab_kota,
                kab.nama AS kab_kota_nama,
                p.id_kecamatan,
                kec.nama AS kecamatan_nama,
                p.id_kelurahan,
                kel.nama AS kelurahan_nama
        `

        const sqlFrom = `
            FROM KOS.properti p
            LEFT JOIN KOS.provinsi prov ON prov.id = p.id_provinsi
            LEFT JOIN KOS.kab_kota kab ON kab.id = p.id_kab_kota
            LEFT JOIN KOS.kecamatan kec ON kec.id = p.id_kecamatan
            LEFT JOIN KOS.kelurahan kel ON kel.id = p.id_kelurahan
        `

        const sqlOrder = ` ORDER BY p.nama `
        const sqlLimit = ` LIMIT ? OFFSET ? `

        const filters = []
        const replacements = []

        const { 
            nama,
            no_telp, 
            alamat,
            id_provinsi,
            id_kabupaten, 
            id_kecamatan,
            id_kelurahan
        } = req.query

        if (nama) {
            filters.push("p.nama LIKE ?")
            replacements.push(`%${nama}%`)
        }

        if (no_telp) {
            filters.push("p.no_telp = ?")
            replacements.push(no_telp)
        }

        if (alamat) {
            filters.push("p.alamat LIKE ?")
            replacements.push(`%${alamat}%`)
        }

        if (id_provinsi) {
            filters.push("p.id_provinsi = ?")
            replacements.push(id_provinsi)
        }

        if (id_kabupaten) {
            filters.push("p.id_kab_kota = ?")
            replacements.push(id_kabupaten)
        }

        if (id_kecamatan) {
            filters.push("p.id_kecamatan = ?")
            replacements.push(id_kecamatan)
        }

        if (id_kelurahan) {
            filters.push("p.id_kelurahan = ?")
            replacements.push(id_kelurahan)
        }

        const sqlWhere = filters.length > 0 ? " WHERE " + filters.join(" AND ") : ""

        const sql = sqlSelect + sqlFrom + sqlWhere + sqlOrder + sqlLimit

        const propertiRows = await database.query(sql, {
            type: QueryTypes.SELECT,
            replacements: [...replacements, limit, offset]
        })

        // ======================
        // QUERY KAMAR
        // ======================
        const propertiIds = propertiRows.map(p => p.id)

        let kamarRows = []
        if (propertiIds.length > 0) {
            kamarRows = await database.query(`
                SELECT 
                    k.id,
                    k.nama,
                    k.catatan,
                    k.harga_per_hari,
                    k.harga_per_minggu,
                    k.harga_per_bulan,
                    k.harga_per_tahun,
                    k.id_properti,
                    CASE 
                        WHEN ss.id = 'ACTIVE' THEN 'Sudah disewa'
                        WHEN ss.id = 'BOOKED' THEN 'Sudah dipesan'
                        ELSE 'Tersedia'
                    END AS status_sewa_terbaru
                FROM KOS.kamar k
                LEFT JOIN (
                    SELECT s1.id_kamar, s1.tanggal_dibuat, s1.id_status_sewa
                    FROM KOS.sewa s1
                    JOIN (
                        SELECT id_kamar, MAX(tanggal_dibuat) AS max_dibuat
                        FROM KOS.sewa
                        GROUP BY id_kamar
                    ) s2 
                    ON s1.id_kamar = s2.id_kamar 
                    AND s1.tanggal_dibuat = s2.max_dibuat
                ) s ON k.id = s.id_kamar
                LEFT JOIN KOS.status_sewa ss ON s.id_status_sewa = ss.id
                WHERE k.id_properti IN (?)
            `, {
                replacements: [propertiIds],
                type: QueryTypes.SELECT
            })
        }

        // ======================
        // GROUPING KAMAR
        // ======================
        const kamarMap = {}

        kamarRows.forEach(k => {
            if (!kamarMap[k.id_properti]) {
                kamarMap[k.id_properti] = []
            }

            kamarMap[k.id_properti].push({
                id: k.id,
                nama: k.nama,
                catatan: k.catatan,
                hargaPerHari: k.harga_per_hari,
                hargaPerMinggu: k.harga_per_minggu,
                hargaPerBulan: k.harga_per_bulan,
                hargaPerTahun: k.harga_per_tahun,
                statusSewa: k.status_sewa_terbaru
            })
        })

        // ======================
        // FORMAT RESPONSE
        // ======================
        const formattedData = propertiRows.map(item => ({
            id: item.id,
            nama: item.nama,
            noTelp: item.no_telp,
            alamat: item.alamat,
            catatan: item.catatan,
            provinsi: {
                id: item.id_provinsi,
                nama: item.provinsi_nama
            },
            kabKota: {
                id: item.id_kab_kota,
                nama: item.kab_kota_nama
            },
            kecamatan: {
                id: item.id_kecamatan,
                nama: item.kecamatan_nama
            },
            kelurahan: {
                id: item.id_kelurahan,
                nama: item.kelurahan_nama
            },
            kamar: kamarMap[item.id] || []
        }))

        // ======================
        // COUNT
        // ======================
        const sqlCount = `
            SELECT COUNT(p.id) as total_row_count
            FROM KOS.properti p
            LEFT JOIN KOS.provinsi prov ON prov.id = p.id_provinsi
            LEFT JOIN KOS.kab_kota kab ON kab.id = p.id_kab_kota
            LEFT JOIN KOS.kecamatan kec ON kec.id = p.id_kecamatan
            LEFT JOIN KOS.kelurahan kel ON kel.id = p.id_kelurahan
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
        // QUERY PROPERTI
        // ======================
        const sqlSelect = `
            SELECT 
                p.id,
                p.nama,
                p.no_telp,
                p.alamat,
                p.catatan,
                p.id_provinsi,
                prov.nama AS provinsi_nama,
                p.id_kab_kota,
                kab.nama AS kab_kota_nama,
                p.id_kecamatan,
                kec.nama AS kecamatan_nama,
                p.id_kelurahan,
                kel.nama AS kelurahan_nama
        `

        const sqlFrom = `
            FROM KOS.properti p
            LEFT JOIN KOS.provinsi prov ON prov.id = p.id_provinsi
            LEFT JOIN KOS.kab_kota kab ON kab.id = p.id_kab_kota
            LEFT JOIN KOS.kecamatan kec ON kec.id = p.id_kecamatan
            LEFT JOIN KOS.kelurahan kel ON kel.id = p.id_kelurahan
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
        // QUERY KAMAR + STATUS SEWA
        // ======================
        const kamarRows = await database.query(`
            SELECT 
                k.id,
                k.nama,
                k.catatan,
                k.harga_per_hari,
                k.harga_per_minggu,
                k.harga_per_bulan,
                k.harga_per_tahun,
                k.id_properti,

                CASE 
                    WHEN ss.id = 'ACTIVE' THEN 'Sudah disewa'
                    WHEN ss.id = 'BOOKED' THEN 'Sudah dipesan'
                    ELSE 'Tersedia'
                END AS status_sewa_terbaru

            FROM KOS.kamar k

            LEFT JOIN (
                SELECT s1.id_kamar, s1.tanggal_dibuat, s1.id_status_sewa
                FROM KOS.sewa s1
                JOIN (
                    SELECT id_kamar, MAX(tanggal_dibuat) AS max_dibuat
                    FROM KOS.sewa
                    GROUP BY id_kamar
                ) s2 
                ON s1.id_kamar = s2.id_kamar 
                AND s1.tanggal_dibuat = s2.max_dibuat
            ) s ON k.id = s.id_kamar

            LEFT JOIN KOS.status_sewa ss ON s.id_status_sewa = ss.id

            WHERE k.id_properti = ?
        `, {
            replacements: [id],
            type: QueryTypes.SELECT
        })

        // ======================
        // FORMAT RESPONSE
        // ======================
        const formattedData = {
            id: row.id,
            nama: row.nama,
            noTelp: row.no_telp,
            alamat: row.alamat,
            catatan: row.catatan,
            provinsi: {
                id: row.id_provinsi,
                nama: row.provinsi_nama
            },
            kabKota: {
                id: row.id_kab_kota,
                nama: row.kab_kota_nama
            },
            kecamatan: {
                id: row.id_kecamatan,
                nama: row.kecamatan_nama
            },
            kelurahan: {
                id: row.id_kelurahan,
                nama: row.kelurahan_nama
            },
            kamar: kamarRows.map(k => ({
                id: k.id,
                nama: k.nama,
                catatan: k.catatan,
                hargaPerHari: k.harga_per_hari,
                hargaPerMinggu: k.harga_per_minggu,
                hargaPerBulan: k.harga_per_bulan,
                hargaPerTahun: k.harga_per_tahun,
                statusSewa: k.status_sewa_terbaru // ✅ sudah include
            }))
        }

        return formattedData

    } catch (error) {
        throw error
    }
}