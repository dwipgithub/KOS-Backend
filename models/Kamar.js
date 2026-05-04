import { DataTypes, QueryTypes } from "sequelize"
import { database } from "../config/Database.js"

export const kamar = database.define('kamar', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    id_properti: {
        type: DataTypes.STRING
    },
    nama: {
        type: DataTypes.STRING
    },
    id_status_kamar: {
        type: DataTypes.STRING
    },
    catatan: {
        type: DataTypes.TEXT
    },
    harga_per_hari: {
        type: DataTypes.DOUBLE
    },
    harga_per_minggu: {
        type: DataTypes.DOUBLE
    },
    harga_per_bulan: {
        type: DataTypes.DOUBLE
    },
    harga_per_tahun: {
        type: DataTypes.DOUBLE
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

        const sqlSelect = `
            SELECT 
            k.id,
            k.id_properti,
            p.nama AS properti_nama,
            p.no_telp,
            p.alamat,
            p.catatan AS properti_catatan,
            p.id_provinsi,
            prov.nama AS provinsi_nama,
            p.id_kab_kota,
            kab.nama AS kab_kota_nama,
            p.id_kecamatan,
            kec.nama AS kecamatan_nama,
            p.id_kelurahan,
            kel.nama AS kelurahan_nama,
            k.nama,
            k.id_status_kamar,
            sk.nama AS status_kamar_nama,
            k.catatan,
            k.harga_per_hari,
            k.harga_per_minggu,
            k.harga_per_bulan,
            k.harga_per_tahun,
            CASE 
                WHEN ss.id = 'ACTIVE' THEN 'Sudah disewa'
                WHEN ss.id = 'BOOKED' THEN 'Sudah dipesan'
                ELSE 'Tersedia'
            END AS status_sewa_terbaru,
            py.id AS penyewa_id,
            py.nama AS penyewa_nama,
            py.no_telp AS penyewa_no_telp
        `

        const sqlFrom = `
            FROM kamar k
            LEFT JOIN properti p ON p.id = k.id_properti
            LEFT JOIN status_kamar sk ON sk.id = k.id_status_kamar
            LEFT JOIN provinsi prov ON prov.id = p.id_provinsi
            LEFT JOIN kab_kota kab ON kab.id = p.id_kab_kota
            LEFT JOIN kecamatan kec ON kec.id = p.id_kecamatan
            LEFT JOIN kelurahan kel ON kel.id = p.id_kelurahan

            LEFT JOIN (
                SELECT s1.id_kamar, s1.tanggal_masuk, s1.id_status_sewa, s1.id_penyewa, s1.id AS id_sewa
                FROM sewa s1
                JOIN (
                    SELECT 
                        id_kamar, 
                        MAX(tanggal_dibuat) AS max_tanggal_dibuat
                    FROM 
                        sewa
                    GROUP BY 
                        id_kamar
                ) s2 
                ON s1.id_kamar = s2.id_kamar 
                AND s1.tanggal_dibuat = s2.max_tanggal_dibuat
            ) s ON k.id = s.id_kamar
            LEFT JOIN status_sewa ss ON s.id_status_sewa = ss.id
            LEFT JOIN penyewa py ON py.id = s.id_penyewa
        `

        const sqlOrder = ' ORDER BY k.id_properti '
        const sqlLimit = ' LIMIT ? OFFSET ? '

        const filters = []
        const replacements = []

        const { 
            id_properti,
            nama, 
            id_status_kamar
        } = req.query

        if (nama) {
            filters.push("k.nama LIKE ?")
            replacements.push(`%${nama}%`)
        }

        if (id_properti) {
            filters.push("k.id_properti = ?")
            replacements.push(id_properti)
        }

        if (id_status_kamar) {
            filters.push("k.id_status_kamar = ?")
            replacements.push(id_status_kamar)
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

        const formattedData = rows.map(item => ({
            id: item.id,
            nama: item.nama,
            catatan: item.catatan,
            statusKamar: {
                id: item.id_status_kamar,
                nama: item.status_kamar_nama
            },
            statusSewa: item.status_sewa_terbaru,
            sewa: item.status_sewa_terbaru === "Tersedia"
            ? null
            : {
                id: item.id_sewa,
                penyewa: item.penyewa_id
                    ? {
                        id: item.penyewa_id,
                        nama: item.penyewa_nama,
                        noTelp: item.penyewa_no_telp
                    }
                    : null
            },
            hargaPerHari: item.harga_per_hari,
            hargaPerMinggu: item.harga_per_minggu,
            hargaPerBulan: item.harga_per_bulan,
            hargaPerTahun: item.harga_per_tahun,
            properti: {
                id: item.id_properti,
                nama: item.properti_nama,
                noTelp: item.no_telp,
                alamat: item.alamat,
                catatan: item.properti_catatan,
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
                }
            },
        }))

        // ======================
        // QUERY COUNT
        // ======================
        const sqlCount = `
            SELECT count(k.id) as total_row_count
            FROM kamar k
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
            k.id,
            k.id_properti,
            p.nama AS properti_nama,
            p.no_telp,
            p.alamat,
            p.catatan AS properti_catatan,
            p.id_provinsi,
            prov.nama AS provinsi_nama,
            p.id_kab_kota,
            kab.nama AS kab_kota_nama,
            p.id_kecamatan,
            kec.nama AS kecamatan_nama,
            p.id_kelurahan,
            kel.nama AS kelurahan_nama,
            k.nama,
            k.id_status_kamar,
            sk.nama AS status_kamar_nama,
            k.catatan,
            k.harga_per_hari,
            k.harga_per_minggu,
            k.harga_per_bulan,
            k.harga_per_tahun,
            CASE 
                WHEN ss.id = 'ACTIVE' THEN 'Sudah disewa'
                WHEN ss.id = 'BOOKED' THEN 'Sudah dipesan'
                ELSE 'Tersedia'
            END AS status_sewa_terbaru,
            s.id AS id_sewa,
            py.id AS penyewa_id,
            py.nama AS penyewa_nama,
            py.no_telp AS penyewa_no_telp
        `
        const sqlFrom = `
            FROM kamar k
            LEFT JOIN properti p ON p.id = k.id_properti
            LEFT JOIN status_kamar sk ON sk.id = k.id_status_kamar
            LEFT JOIN provinsi prov ON prov.id = p.id_provinsi
            LEFT JOIN kab_kota kab ON kab.id = p.id_kab_kota
            LEFT JOIN kecamatan kec ON kec.id = p.id_kecamatan
            LEFT JOIN kelurahan kel ON kel.id = p.id_kelurahan
            LEFT JOIN (
                SELECT
                    s1.id,
                    s1.id_kamar,
                    s1.id_penyewa,
                    s1.id_status_sewa,
                    s1.tanggal_dibuat
                FROM 
                    sewa s1
                JOIN (
                    SELECT 
                        id_kamar, 
                        MAX(tanggal_dibuat) AS max_tanggal_dibuat
                    FROM 
                        sewa
                    GROUP BY 
                        id_kamar
                ) s2 
                ON s1.id_kamar = s2.id_kamar 
                AND s1.tanggal_dibuat = s2.max_tanggal_dibuat
            ) s ON k.id = s.id_kamar
            LEFT JOIN penyewa py ON py.id = s.id_penyewa
            LEFT JOIN status_sewa ss ON s.id_status_sewa = ss.id
        `
        const sqlWhere = `
            WHERE k.id = ?
            LIMIT 1
        `
        const sql = sqlSelect + sqlFrom + sqlWhere

        const result = await database.query(sql, {
            type: QueryTypes.SELECT,
            replacements: [id]
        })

        // 🔥 kalau tidak ditemukan → return null
        if (result.length === 0) {
            return null
        }

        const row = result[0]

        return {
            id: row.id,
            nama: row.nama,
            catatan: row.catatan,
            statusKamar: {
                id: row.id_status_kamar,
                nama: row.status_kamar_nama
            },
            statusSewa: row.status_sewa_terbaru,
            sewa: row.status_sewa_terbaru === "Tersedia"
            ? null
            : {
                id: row.id_sewa,
                penyewa: row.penyewa_id
                    ? {
                        id: row.penyewa_id,
                        nama: row.penyewa_nama,
                        noTelp: row.penyewa_no_telp
                    }
                    : null
            },
            hargaPerHari: row.harga_per_hari,
            hargaPerMinggu: row.harga_per_minggu,
            hargaPerBulan: row.harga_per_bulan,
            hargaPerTahun: row.harga_per_tahun,
            properti: {
                id: row.id_properti,
                nama: row.properti_nama,
                noTelp: row.no_telp,
                alamat: row.alamat,
                catatan: row.properti_catatan,
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
                }
            }
        }
    } catch (error) {
        throw error
    }
}