import { QueryTypes } from "sequelize"
import { database } from "../config/Database.js"
import { privateFileUrl } from "../helpers/privateFileUrl.js"

export const get = async (req) => {
    try {
        const { startDate, endDate, idProperti, idAkun } = req.query

        const filters = []
        const replacements = []

        // ======================
        // FILTER TANGGAL
        // ======================
        if (startDate && endDate) {
            filters.push("DATE(tanggal_transaksi) BETWEEN ? AND ?")
            replacements.push(startDate, endDate)
        } else if (startDate) {
            filters.push("DATE(tanggal_transaksi) >= ?")
            replacements.push(startDate)
        } else if (endDate) {
            filters.push("DATE(tanggal_transaksi) <= ?")
            replacements.push(endDate)
        }

        // ======================
        // FILTER PROPERTI
        // ======================
        if (idProperti) {
            filters.push("id_properti = ?")
            replacements.push(idProperti)
        }

        // ======================
        // FILTER AKUN
        // ======================
        if (idAkun) {
            filters.push("id_akun = ?")
            replacements.push(idAkun)
        }

        const whereClause =
            filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : ""

        // ======================================================
        // 1. OPENING BALANCE
        // ======================================================
        const openingSql = `
            SELECT 
                id_akun,
                SUM(debit - kredit) AS opening_balance
            FROM (

                SELECT 
                    dt.id_akun AS id_akun,
                    p.total_bayar AS debit,
                    0 AS kredit,
                    p.tanggal_bayar AS tanggal_transaksi,
                    k.id_properti
                FROM pembayaran p
                JOIN tagihan t ON p.id_tagihan = t.id
                JOIN deskripsi_tagihan dt ON t.id_deskripsi_tagihan = dt.id
                JOIN sewa s ON t.id_sewa = s.id
                JOIN kamar k ON s.id_kamar = k.id
                WHERE t.tanggal_dihapus IS NULL

                UNION ALL

                SELECT 
                    kp.id_akun AS id_akun,
                    0 AS debit,
                    pg.total AS kredit,
                    pg.tanggal_pengeluaran AS tanggal_transaksi,
                    pg.id_properti
                FROM pengeluaran pg
                LEFT JOIN kategori_pengeluaran kp 
                    ON pg.id_kategori_pengeluaran = kp.id
                WHERE kp.id_akun IS NOT NULL AND pg.tanggal_dihapus IS NULL

            ) t
            WHERE DATE(tanggal_transaksi) < ?
            ${idProperti ? "AND id_properti = ?" : ""}
            GROUP BY id_akun
        `

        const openingParams = []
        openingParams.push(startDate || "9999-12-31")
        if (idProperti) openingParams.push(idProperti)

        const openingRows = await database.query(openingSql, {
            replacements: openingParams,
            type: QueryTypes.SELECT
        })

        const openingMap = {}
        openingRows.forEach(item => {
            openingMap[item.id_akun] = Number(item.opening_balance || 0)
        })

        // ======================================================
        // 2. TRANSAKSI PERIODE (SUDAH DITAMBAH KATEGORI)
        // ======================================================
        const sql = `
            SELECT * FROM (

                -- ======================
                -- PENDAPATAN
                -- ======================
                SELECT 
                    p.tanggal_bayar AS tanggal_transaksi,
                    CONCAT(
                        'Pembayaran ', 
                        dt.nama,
                        ' ',
                        k.nama,
                        ' ',
                        CASE
                            WHEN t.tanggal_masuk IS NOT NULL THEN
                                CONCAT(
                                    ' Periode ',
                                    DATE_FORMAT(t.tanggal_masuk, '%d-%m-%Y'),
                                    CASE
                                        WHEN t.tanggal_keluar IS NOT NULL
                                        THEN CONCAT(
                                            ' - ',
                                            DATE_FORMAT(t.tanggal_keluar, '%d-%m-%Y')
                                        )
                                        ELSE ''
                                    END
                                )
                            ELSE ''
                        END
                    ) AS keterangan,
                    p.total_bayar AS debit,
                    0 AS kredit,
                    dt.id_akun AS id_akun,
                    a.nama AS nama_akun,
                    k.id_properti AS id_properti,
                    'PENDAPATAN' AS jenis,
                    dt.nama AS kategori,
                    p.bukti_bayar AS bukti
                FROM pembayaran p
                JOIN tagihan t ON p.id_tagihan = t.id
                JOIN deskripsi_tagihan dt ON t.id_deskripsi_tagihan = dt.id
                JOIN akun a ON dt.id_akun = a.id
                JOIN sewa s ON t.id_sewa = s.id
                JOIN kamar k ON s.id_kamar = k.id
                WHERE t.tanggal_dihapus IS NULL

                UNION ALL

                -- ======================
                -- PENGELUARAN
                -- ======================
                SELECT 
                    pg.tanggal_pengeluaran AS tanggal_transaksi,
                    CASE
                        WHEN pg.id_kamar IS NOT NULL THEN
                            CONCAT(
                                'Lokasi: ',
                                k.tipe,
                                ' ',
                                k.nama,
                                ' - ',
                                pg.nama
                            )
                        WHEN pg.id_kamar IS NULL THEN
                            CONCAT(
                                'Lokasi: Fasilitas Umum',
                                ' - ',
                                pg.nama
                            )
                        ELSE
                            pg.nama
                    END AS keterangan,
                    0 AS debit,
                    pg.total AS kredit,
                    kp.id_akun AS id_akun,
                    a.nama AS nama_akun,
                    pg.id_properti,
                    'PENGELUARAN' AS jenis,
                    kp.nama AS kategori,
                    pg.bukti_pengeluaran AS bukti
                FROM pengeluaran pg
                LEFT JOIN kategori_pengeluaran kp 
                    ON pg.id_kategori_pengeluaran = kp.id
                LEFT JOIN akun a 
                    ON kp.id_akun = a.id
                LEFT JOIN kamar k
                    ON pg.id_kamar = k.id
                WHERE kp.id_akun IS NOT NULL AND pg.tanggal_dihapus IS NULL

            ) transaksi
            ${whereClause}
            ORDER BY id_akun, tanggal_transaksi ASC
        `

        const rows = await database.query(sql, {
            replacements,
            type: QueryTypes.SELECT
        })

        // ======================================================
        // 3. GROUPING + RUNNING BALANCE
        // ======================================================
        const grouped = {}

        for (const item of rows) {
            if (!item.nama_akun) continue; // Skip if no account name
            
            if (!grouped[item.id_akun]) {
                grouped[item.id_akun] = {
                    akun: {
                        id: item.id_akun,
                        nama: item.nama_akun
                    },
                    openingBalance: openingMap[item.id_akun] || 0,
                    transaksi: [],
                    saldo: openingMap[item.id_akun] || 0
                }
            }

            const group = grouped[item.id_akun]

            const debit = Number(item.debit || 0)
            const kredit = Number(item.kredit || 0)

            group.saldo = group.saldo + debit - kredit

            group.transaksi.push({
                tanggal: item.tanggal_transaksi,
                tanggal_transaksi: item.tanggal_transaksi,
                keterangan: item.keterangan,
                kategori: {
                    nama: item.kategori,
                    jenis: item.jenis
                },
                debit,
                kredit,
                saldo: group.saldo,
                bukti: privateFileUrl(item.bukti),
                properti: {
                    id: item.id_properti
                }
            })
        }

        // ======================================================
        // 4. CLOSING BALANCE
        // ======================================================
        const data = Object.values(grouped).map(item => ({
            ...item,
            closingBalance: item.saldo
        }))

        // ======================================================
        // RESPONSE
        // ======================================================
        return {
            periode: {
                startDate,
                endDate
            },
            filter: {
                idProperti,
                idAkun
            },
            totalAkun: data.length,
            data
        }

    } catch (error) {
        throw error
    }
}