import { sewa, get, show  } from "../models/Sewa.js"
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

export const createSewa = async (req, res) => {
    try {
        const uniqueKey = uuidv4()

        await sewa.create({
            id_kamar: req.body.idKamar,
            id_penyewa: req.body.idPenyewa,
            id_status_sewa: "BOOKED",
            tanggal_masuk: req.body.tanggalMasuk,
            tanggal_keluar: req.body.tanggalKeluar,
            id_durasi: req.body.idDurasi,
            harga_per_durasi: req.body.hargaPerDurasi,
            jumlah_durasi: req.body.jumlahDurasi,
            uang_muka: req.body.uangMuka != null ? Number(req.body.uangMuka) : 0,
            catatan: req.body.catatan,
            temp_key: uniqueKey
        })

        const data = await sewa.findOne({
            where: { temp_key: uniqueKey }
        })

        return response.created(res, {
            id: data.id
        })

    } catch (err) {
        console.log("Gagal menyimpan sewa:", err)
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