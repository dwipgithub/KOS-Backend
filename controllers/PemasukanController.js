import { pemasukan, get, show, destroy } from "../models/Pemasukan.js"
import paginationDB from '../config/PaginationDB.js'
import * as response from '../helpers/response.js'
import { v4 as uuidv4 } from 'uuid'
import fs from "fs/promises"
import { privateFileUrl } from "../helpers/privateFileUrl.js"
import { encodeRouteId } from "../helpers/routeId.js"

// ======================
// GET
// ======================
export const getPemasukan = async (req, res) => {
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
export const showPemasukan = async (req, res) => {
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
export const createPemasukan = async (req, res) => {
    try {

        const uniqueKey = uuidv4()

        const idKas = req.body.idKas || "KAS-1"
        const dokumenPath = req.file ? `pemasukan/${req.file.filename}` : null

        try {
            await pemasukan.create({
                id_kas: idKas,
                tipe: req.body.tipe,
                tanggal_pemasukan: req.body.tanggalPemasukan,
                total: req.body.total,
                keterangan: req.body.keterangan,
                bukti_pemasukan: dokumenPath,
                temp_key: uniqueKey,
                pengguna_id: req.user.id
            })
        } catch (createErr) {
            if (req.file?.path) {
                await fs.unlink(req.file.path).catch(() => {})
            }
            throw createErr
        }

        const data = await pemasukan.findOne({
            where: {
                temp_key: uniqueKey
            }
        })

        return response.created(res, {
            id: data.id,
            routeId: encodeRouteId(data.id),
            buktiPemasukan: dokumenPath ? privateFileUrl(dokumenPath) : null
        })

    } catch (err) {
        console.log("Gagal menyimpan pemasukan kas:", err)
        return response.error(res, err, 500)
    }
}

// ======================
// UPDATE
// ======================
export const updatePemasukan = async (req, res) => {
    try {

        // ======================
        // CEK DATA
        // ======================
        const existingData = await pemasukan.findByPk(req.params.id)

        if (!existingData) {
            return response.notFound(
                res,
                "resource not found"
            )
        }

        // ======================
        // UPDATE
        // ======================
        const [affectedRows] = await pemasukan.update({
            id_kas: req.body.idKas,
            tipe: req.body.tipe,
            tanggal_pemasukan: req.body.tanggalPemasukan,
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
        const updatedData = await pemasukan.findByPk(req.params.id)

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

export const destroyPemasukan = async (req, res) => {
    try {

        const result = await destroy(req.params.id)

        if (!result || result[0] === 0) {
            return response.notFound(
                res,
                "data not found"
            )
        }

        return response.success(
            res,
            null,
            "data deleted successfully"
        )

    } catch (err) {

        return response.error(
            res,
            err,
            422
        )
    }
}