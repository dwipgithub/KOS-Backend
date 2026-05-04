import { properti, get, show  } from "../models/Properti.js"
import paginationDB from '../config/PaginationDB.js'
import * as response from '../helpers/response.js'
import { v4 as uuidv4 } from 'uuid'
import { encodeRouteId } from "../helpers/routeId.js"

export const getProperti = async (req, res) => {
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

export const showProperti = async (req, res) => {
    try {
        const result = await show(req.params.id)

        if (!result) {
            return response.notFound(res)
        }

        return response.success(res, result, "data found")

    } catch (err) {
        return response.error(res, err)
    }
}

export const createProperti = async (req, res) => {
    try {
        const uniqueKey = uuidv4()

        await properti.create({
            nama: req.body.nama,
            no_telp: req.body.noTelp,
            alamat: req.body.alamat,
            catatan: req.body.catatan,
            id_provinsi: req.body.idProvinsi,
            id_kab_kota: req.body.idKabKota,
            id_kecamatan: req.body.idKecamatan,
            id_kelurahan: req.body.idKelurahan,
            temp_key: uniqueKey
        })

        const data = await properti.findOne({
            where: { temp_key: uniqueKey }
        })

        return response.created(res, {
            id: data.id
        })

    } catch (error) {
        console.log("Gagal menyimpan properti:", error)
        return response.error(res, error, 500)
    }
}

export const updateProperti = async (req, res) => {
    try {
        // ======================
        // 1. CEK DATA ADA ATAU TIDAK
        // ======================
        const existingData = await properti.findByPk(req.params.id)

        if (!existingData) {
            return response.notFound(res, "resource not found")
        }

        // ======================
        // 2. UPDATE DATA
        // ======================
        const [affectedRows] = await properti.update({
            nama: req.body.nama,
            no_telp: req.body.noTelp,
            alamat: req.body.alamat,
            catatan: req.body.catatan,
            id_provinsi: req.body.idProvinsi,
            id_kab_kota: req.body.idKabKota,
            id_kecamatan: req.body.idKecamatan,
            id_kelurahan: req.body.idKelurahan
        }, {
            where: {
                id: req.params.id
            }
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
        const updatedData = await properti.findByPk(req.params.id)

        return response.success(
            res,
            updatedData,
            "data updated successfully"
        )

    } catch (error) {
        console.log("Gagal mengupdate properti:", error)
        return response.error(res, error, 500)
    }
}