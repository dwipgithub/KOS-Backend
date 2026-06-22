import { sewa, get, show, destroy  } from "../models/Sewa.js"
import { tagihan } from "../models/Tagihan.js"
import { database } from "../config/Database.js"
import paginationDB from '../config/PaginationDB.js'
import * as response from '../helpers/response.js'
import { v4 as uuidv4 } from 'uuid'

export const getSewa = async (req, res) => {
    try {
        const results = await get(req)

        const paginationDBObject = new paginationDB(
            results.totalRowCount,
            results.page,
            results.limit,
            results.data
        )

        const pagination = paginationDBObject.getRemarkPagination()

        const message = results.data.length
            ? 'data found'
            : 'no data found'

        return response.success(
            res,
            results.data,
            message,
            pagination
        )

    } catch (err) {
        return response.error(res, err, 422)
    }
}

export const showSewa = async (req, res) => {
    try {
        const result = await show(req.params.id)

        if (!result) {
            return response.notFound(res, 'data not found')
        }

        return response.success(res, result, 'data found')

    } catch (err) {
        return response.error(res, err)
    }
}

export const destroySewa = async (req, res) => {
    try {
        const result = await destroy(
            req.params.id
        )

        return response.success(res, result, 'Rental cancelled successfully')
    } catch (err) {
        return response.error(res, err, 422)
    }
}

export const createSewa = async (req, res) => {
    const transaction = await database.transaction()

    try {
        const uniqueKey = uuidv4()

        // ======================
        // CREATE CONTRACT
        // ======================
        await sewa.create({
            id_kamar: req.body.idKamar,
            id_penyewa: req.body.idPenyewa,
            id_status_sewa: "BOOKED",
            tanggal_masuk: req.body.tanggalMasuk,
            tanggal_keluar: req.body.tanggalKeluar,
            id_durasi: req.body.idDurasi,
            catatan: req.body.catatan,
            temp_key: uniqueKey
        }, { transaction })
        
        const data = await sewa.findOne({
            where: { temp_key: uniqueKey },
            transaction
        })

        // ======================
        // CREATE RENT BILL
        // ======================
        await tagihan.create({
            id_sewa: data.id,
            id_deskripsi_tagihan: "RENT",

            id_durasi: req.body.idDurasi,
            tanggal_masuk: req.body.tanggalMasuk,
            tanggal_keluar: req.body.tanggalKeluar,

            harga_satuan: req.body.hargaSatuan,
            jumlah: req.body.jumlah || 1,

            diskon_persen: req.body.diskonPersen || 0,
            diskon_nominal: req.body.diskonNominal || 0,

            total: (req.body.hargaSatuan * (req.body.jumlah || 1)) - (req.body.diskonNominal || 0) - (req.body.uangMuka || 0),

            tanggal_tagihan: new Date(),
            tanggal_jatuh_tempo: new Date(),

            id_status_tagihan: "UNPAID",
            temp_key: uuidv4()
        }, { transaction })

        // ======================
        // CREATE DP BILL
        // ======================
        if ( 
            req.body.uangMuka != null && Number(req.body.uangMuka) > 0 
        ){
            await tagihan.create({ 
                id_sewa: data.id, 
                id_deskripsi_tagihan: "DP", 
                harga_satuan: Number(req.body.uangMuka), 
                jumlah: 1, 
                diskon_persen: 0, 
                diskon_nominal: 0, 
                total: Number(req.body.uangMuka), 
                tanggal_tagihan: new Date(), 
                tanggal_jatuh_tempo: new Date(),
                id_status_tagihan: "UNPAID", temp_key: uuidv4() 
            }, { transaction })
        }
        
        // ======================
        // CREATE DEPOSIT BILL
        // ======================
        if ( 
            req.body.uangJaminan != null && 
            Number(req.body.uangJaminan) > 0 )
        {
            await tagihan.create({ 
                id_sewa: data.id, 
                id_deskripsi_tagihan: "DEPOSIT", 
                harga_satuan: Number(req.body.uangJaminan), 
                jumlah: 1, 
                diskon_persen: 0, 
                diskon_nominal: 0, 
                total: Number(req.body.uangJaminan), 
                tanggal_tagihan: new Date(), 
                tanggal_jatuh_tempo: new Date(), 
                id_status_tagihan: "UNPAID", 
                temp_key: uuidv4()
            }, { transaction })
        }

        // ========================= 
        // COMMIT 
        // ========================= 
        
        await transaction.commit()

        return response.created(res, {
            id: data.id
        })

    }  catch (err) {
        await transaction.rollback()
        console.log("Gagal membuat sewa:", err)
        return response.error(res, err, 500)
    }
}

export const updateSewa = async (req, res) => {
    try {
        // ======================
        // 1. CEK DATA ADA ATAU TIDAK
        // ======================
        const existing = await sewa.findByPk(req.params.id)

        if (!existing) {
            return response.notFound(res, 'data not found')
        }

        // ======================
        // 2. UPDATE DATA
        // ======================
        const [affectedRows] = await sewa.update({
            id_kamar: req.body.idKamar,
            id_penyewa: req.body.idPenyewa,
            tanggal_mulai: req.body.tanggalMulai,
            tanggal_keluar: req.body.tanggalKeluar,
            id_durasi: req.body.idDurasi,
            harga: req.body.harga,
            catatan: req.body.catatan
        }, {
            where: { id: req.params.id }
        })

       // ======================
        // 3. CEK ADA PERUBAHAN ATAU TIDAK
        // ======================
        if (affectedRows === 0) {
            return response.success(
                res,
                null,
                "no changes detected"
            )
        }

        // ======================
        // 4. AMBIL DATA TERBARU
        // ======================
        const updatedData = await sewa.findByPk(req.params.id)

        return response.success(
            res,
            updatedData,
            "data updated successfully"
        )

    } catch (err) {
        console.log("Gagal mengupdate properti:", error)
        return response.error(res, error, 500)
    }
}