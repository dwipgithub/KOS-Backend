import { kamar, get, show  } from "../models/Kamar.js"
import paginationDB from '../config/PaginationDB.js'
import * as response from '../helpers/response.js'
import { v4 as uuidv4 } from 'uuid'
import { encodeRouteId } from "../helpers/routeId.js"

export const getKamar = async (req, res) => {
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

        const dataWithRouteId = results.data.map((item) => ({
            ...item,
            routeId: encodeRouteId(item.id),
            routeIdPenyewa: item.sewa?.penyewa?.id
                ? encodeRouteId(item.sewa.penyewa.id)
                : null,
        }))

        return response.success(
            res,
            dataWithRouteId,
            message,
            pagination
        )
    } catch (err) {
        return response.error(res, err, 422)
    }
}

export const showKamar = async (req, res) => {
    try {
        console.log(req.params.id)
        const result = await show(req.params.id)

        if (!result) {
            return response.notFound(res)
        }

        return response.success(res, {
            ...result,
            routeId: encodeRouteId(result.id),
            routeIdPenyewa: result.sewa?.penyewa?.id
            ? encodeRouteId(result.sewa.penyewa.id)
            : null,
        }, "data found")
    } catch (err) {
        return response.error(res, err)
    }
}

export const createKamar = async (req, res) => {
    try {
        const uniqueKey = uuidv4()

        await kamar.create({
            id_properti: req.body.idProperti,
            nama: req.body.nama,
            id_status_kamar: req.body.idStatusKamar,
            catatan: req.body.catatan,
            harga_per_hari: req.body.hargaPerHari,
            harga_per_minggu: req.body.hargaPerMinggu,
            harga_per_bulan: req.body.hargaPerBulan,
            harga_per_tahun: req.body.hargaPerTahun,
            temp_key: uniqueKey
        })

        const data = await kamar.findOne({
            where: { temp_key: uniqueKey }
        })

        return response.created(res, {
            id: data.id
        })
    } catch (err) {
        console.log("Gagal menyimpan properti:", err)
        return response.error(res, err, 500)
    }
}

export const updateKamar = async (req, res) => {
    try {
        // ======================
        // 1. CEK DATA ADA
        // ======================
        const existingData = await kamar.findByPk(req.params.id)

        if (!existingData) {
            return response.notFound(res, "resource not found")
        }

        // ======================
        // 2. UPDATE
        // ======================
        const [affectedRows] = await kamar.update({
            id_properti: req.body.idProperti,
            nama: req.body.nama,
            id_status_kamar: req.body.idStatusKamar,
            catatan: req.body.catatan,
            harga_per_hari: req.body.hargaPerHari,
            harga_per_minggu: req.body.hargaPerMinggu,
            harga_per_bulan: req.body.hargaPerBulan,
            harga_per_tahun: req.body.hargaPerTahun
        }, {
            where: { id: req.params.id }
        })

        // ======================
        // 3. TIDAK ADA PERUBAHAN
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
        const updatedData = await kamar.findByPk(req.params.id)

        return response.success(
            res,
            updatedData,
            "data updated successfully"
        )

    } catch (err) {
        return response.error(res, err, 500)
    }
}