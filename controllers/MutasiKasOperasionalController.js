import { mutasi_kas_operasional, get, show } from "../models/MutasiKasOperasional.js"
import paginationDB from '../config/PaginationDB.js'
import * as response from '../helpers/response.js'
import { v4 as uuidv4 } from 'uuid'
import { encodeRouteId } from "../helpers/routeId.js"

// ======================
// GET
// ======================
export const getMutasiKas = async (req, res) => {
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
            routeId: encodeRouteId(item.id)
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

// ======================
// SHOW
// ======================
export const showMutasiKas = async (req, res) => {
    try {

        const result = await show(req.params.id)

        if (!result) {
            return response.notFound(res)
        }

        return response.success(
            res,
            {
                ...result,
                routeId: encodeRouteId(result.id)
            },
            "data found"
        )

    } catch (err) {
        return response.error(res, err)
    }
}

// ======================
// CREATE
// ======================
export const createMutasiKas = async (req, res) => {
    try {

        const uniqueKey = uuidv4()

        const idKas = req.body.idKas || "KAS-1"

        await mutasi_kas_operasional.create({
            id_kas: idKas,
            tipe: req.body.tipe,
            tanggal_mutasi_kas: req.body.tanggalMutasiKas,
            total: req.body.total,
            keterangan: req.body.keterangan,
            temp_key: uniqueKey
        })

        const data = await mutasi_kas_operasional.findOne({
            where: {
                temp_key: uniqueKey
            }
        })

        return response.created(res, {
            id: data.id,
            routeId: encodeRouteId(data.id)
        })

    } catch (err) {
        console.log("Gagal menyimpan mutasi kas:", err)
        return response.error(res, err, 500)
    }
}

// ======================
// UPDATE
// ======================
export const updateMutasiKas = async (req, res) => {
    try {

        // ======================
        // CEK DATA
        // ======================
        const existingData = await mutasi_kas.findByPk(req.params.id)

        if (!existingData) {
            return response.notFound(
                res,
                "resource not found"
            )
        }

        // ======================
        // UPDATE
        // ======================
        const [affectedRows] = await mutasi_kas.update({
            id_kas: req.body.idKas,
            tipe: req.body.tipe,
            tanggal_mutasi_kas: req.body.tanggalMutasiKas,
            total: req.body.total,
            keterangan: req.body.keterangan
        }, {
            where: {
                id: req.params.id
            }
        })

        // ======================
        // NO CHANGES
        // ======================
        if (affectedRows === 0) {
            return response.success(
                res,
                null,
                "no changes detected"
            )
        }

        // ======================
        // GET UPDATED DATA
        // ======================
        const updatedData = await mutasi_kas.findByPk(req.params.id)

        return response.success(
            res,
            {
                ...updatedData.toJSON(),
                routeId: encodeRouteId(updatedData.id)
            },
            "data updated successfully"
        )

    } catch (err) {
        return response.error(res, err, 500)
    }
}