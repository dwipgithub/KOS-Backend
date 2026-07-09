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
    bisa_disewakan: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
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
            k.bisa_disewakan,
            sk.nama AS status_kamar_nama,
            k.catatan,
            k.bisa_disewakan,
            k.harga_per_hari,
            k.harga_per_minggu,
            k.harga_per_bulan,
            k.harga_per_tahun,
            CASE 
                WHEN k.bisa_disewakan = 0 THEN 'Tidak disewakan'
                WHEN ss.id = 'ACTIVE' THEN 'Sudah disewa'
                WHEN ss.id = 'BOOKED' THEN 'Sudah dipesan'
                ELSE 'Tersedia'
            END AS status_sewa_terbaru,
            py.id AS penyewa_id,
            py.nama AS penyewa_nama,
            py.no_telp AS penyewa_no_telp,
            lt.tanggal_tagihan,
            lt.tanggal_masuk,
            lt.tanggal_keluar,
            lt.nama_durasi as durasi_sewa,
            lt.harga_satuan,
            lt.jumlah,
            lt.total,
            lt.id_status_tagihan,
            lt.nama_status_tagihan,
            CASE
                WHEN ss.id = 'ACTIVE'
                    AND DATEDIFF(lt.tanggal_keluar, CURDATE()) BETWEEN 0 AND 3
                THEN 'WARNING'
                WHEN ss.id = 'ACTIVE'
                    AND lt.tanggal_keluar < CURDATE()
                THEN 'OVERDUE'
                ELSE NULL
            END AS jenis_notifikasi,
            CASE
                WHEN ss.id = 'ACTIVE'
                    AND DATEDIFF(lt.tanggal_keluar, CURDATE()) = 3
                THEN '3 hari lagi masa sewa berakhir'
                WHEN ss.id = 'ACTIVE'
                    AND DATEDIFF(lt.tanggal_keluar, CURDATE()) = 2
                THEN '2 hari lagi masa sewa berakhir'
                WHEN ss.id = 'ACTIVE'
                    AND DATEDIFF(lt.tanggal_keluar, CURDATE()) = 1
                THEN 'Besok masa sewa berakhir'
                WHEN ss.id = 'ACTIVE'
                    AND DATEDIFF(lt.tanggal_keluar, CURDATE()) = 0
                THEN 'Masa sewa berakhir hari ini'
                WHEN ss.id = 'ACTIVE'
                    AND lt.tanggal_keluar < CURDATE()
                THEN CONCAT(
                    'Terlambat ',
                    DATEDIFF(CURDATE(), lt.tanggal_keluar),
                    ' hari'
                )
                ELSE NULL
            END AS pesan_notifikasi,
            CASE
                WHEN ss.id = 'ACTIVE'
                    AND DATEDIFF(lt.tanggal_keluar, CURDATE()) BETWEEN 0 AND 3
                THEN DATEDIFF(lt.tanggal_keluar, CURDATE())
                WHEN ss.id = 'ACTIVE'
                    AND lt.tanggal_keluar < CURDATE()
                THEN DATEDIFF(CURDATE(), lt.tanggal_keluar)
                ELSE NULL
            END AS jumlah_hari
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
            LEFT JOIN penyewa py ON py.id = s.id_penyewa AND ss.id IN ('ACTIVE','BOOKED')
            LEFT JOIN (
                SELECT
                    t1.id_sewa,
                    t1.tanggal_masuk,
                    t1.tanggal_keluar,
                    t1.tanggal_tagihan,
                    d.nama AS nama_durasi,
                    t1.harga_satuan,
                    t1.jumlah,
                    t1.total,
                    t1.id_status_tagihan,
                    st.nama as nama_status_tagihan
                FROM tagihan t1
                INNER JOIN durasi d
                    ON d.id = t1.id_durasi
                INNER JOIN status_tagihan st 
                    ON st.id = t1.id_status_tagihan
                INNER JOIN (
                    SELECT
                        id_sewa,
                        MAX(tanggal_tagihan) AS max_tanggal_tagihan
                    FROM tagihan
                    GROUP BY id_sewa
                ) t2
                    ON t1.id_sewa = t2.id_sewa
                    AND t1.tanggal_tagihan = t2.max_tanggal_tagihan
            ) lt
                ON lt.id_sewa = s.id_sewa AND ss.id IN ('ACTIVE','BOOKED')
        `

        const sqlOrder = ' ORDER BY k.id_properti '
        const sqlLimit = ' LIMIT ? OFFSET ? '

        const filters = []
        const replacements = []

        const {
            id_properti,
            nama,
            id_status_kamar,
            tipe
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

        if (tipe) {
            filters.push("k.tipe = ?")
            replacements.push(tipe)
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
            bisaDisewakan: item.bisa_disewakan,
            sewa:
                item.penyewa_id
                    ? {
                        id: item.id_sewa,
                        penyewa: {
                            id: item.penyewa_id,
                            nama: item.penyewa_nama,
                            noTelp: item.penyewa_no_telp
                        },
                        tagihan: item.tanggal_tagihan
                        ? {
                            tanggalTagihan: item.tanggal_tagihan,
                            tanggalMasuk: item.tanggal_masuk,
                            tanggalKeluar: item.tanggal_keluar,
                            durasi: item.nama_durasi,
                            hargaSatuan: item.harga_satuan,
                            jumlah: item.jumlah,
                            total: item.total,
                            status: item.nama_status_tagihan
                        }
                        : null,
                        notifikasi: item.jenis_notifikasi
                        ? {
                            jenis: item.jenis_notifikasi,
                            pesan: item.pesan_notifikasi,
                            jumlahHari: item.jumlah_hari
                        }
                        : null
                    }
                    : null,
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
            k.bisa_disewakan,
            sk.nama AS status_kamar_nama,
            k.catatan,
            k.harga_per_hari,
            k.harga_per_minggu,
            k.harga_per_bulan,
            k.harga_per_tahun,
            CASE
                WHEN k.bisa_disewakan = 0 THEN 'Tidak disewakan'
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
            bisaDisewakan: row.bisa_disewakan,
            sewa:
                row.status_sewa_terbaru === "Tersedia"
                    ? null
                    : row.penyewa_id
                        ? {
                            id: row.id_sewa,
                            penyewa: {
                                id: row.penyewa_id,
                                nama: row.penyewa_nama,
                                noTelp: row.penyewa_no_telp
                            }
                        }
                        : null,
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