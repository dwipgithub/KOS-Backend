import { pengeluaran, get, show } from "../models/Pengeluaran.js"
import paginationDB from '../config/PaginationDB.js'
import * as response from '../helpers/response.js'
import { v4 as uuidv4 } from 'uuid'
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import { privateFileUrl } from "../helpers/privateFileUrl.js"
import { encodeRouteId } from "../helpers/routeId.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsBase = path.join(__dirname, "..", "uploads")

export const getPengeluaran = async (req, res) => {
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

export const showPengeluaran = async (req, res) => {
    try {
        const result = await show(req.params.id)

        if (!result) {
            return response.notFound(res)
        }

        return response.success(res, {
            ...result,
            routeId: encodeRouteId(result.id)
        }, "data found")
    } catch (err) {
        return response.error(res, err)
    }
}

export const createPengeluaran = async (req, res) => {
    try {
        const uniqueKey = uuidv4()
        const dokumenPath = req.file ? `pengeluaran/${req.file.filename}` : null

        try {
            await pengeluaran.create({
                id_properti: req.body.idProperti,
                id_kamar: req.body.idKamar || null,
                id_kategori_pengeluaran: req.body.idKategoriPengeluaran,
                tanggal_pengeluaran: req.body.tanggalPengeluaran,
                nama: req.body.nama,
                total: req.body.total,
                catatan: req.body.catatan,
                bukti_pengeluaran: dokumenPath,
                temp_key: uniqueKey
            })
        } catch (createErr) {
            if (req.file?.path) {
                await fs.unlink(req.file.path).catch(() => {})
            }
            throw createErr
        }

        const data = await pengeluaran.findOne({
            where: { temp_key: uniqueKey }
        })

        return response.created(res, {
            id: data.id,
            dokumenKeluar: dokumenPath ? privateFileUrl(dokumenPath) : null
        })
    } catch (err) {
        console.log("Gagal menyimpan properti:", err)
        return response.error(res, err, 500)
    }
}

export const updatePengeluaran = async (req, res) => {
    try {
        // ======================
        // 1. CEK DATA ADA
        // ======================
        const existingData = await pengeluaran.findByPk(req.params.id)

        if (!existingData) {
            return response.notFound(res, "resource not found")
        }

        // ======================
        // 2. UPDATE
        // ======================
        const [affectedRows] = await pengeluaran.update({
            id_properti: req.body.idProperti,
            id_kamar: req.body.idKamar,
            id_kategori_pengeluaran: req.body.idKategoriPengeluaran,
            tanggal_pengeluaran: req.body.tanggalPengeluaran,
            nama: req.body.nama,
            total: req.body.total,
            catatan: req.body.catatan
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
        const updatedData = await pengeluaran.findByPk(req.params.id)

        return response.success(
            res,
            updatedData,
            "data updated successfully"
        )

    } catch (err) {
        return response.error(res, err, 500)
    }
}