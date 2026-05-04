import { penyewa, get, show } from "../models/Penyewa.js"
import paginationDB from "../config/PaginationDB.js"
import * as response from "../helpers/response.js"
import { v4 as uuidv4 } from "uuid"
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import { privateFileUrl } from "../helpers/privateFileUrl.js"
import { encodeRouteId } from "../helpers/routeId.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsBase = path.join(__dirname, "..", "uploads")

export const getPenyewa = async (req, res) => {
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
        return response.error(res, err, 500)
    }
}

export const showPenyewa = async (req, res) => {
    try {
        const result = await show(req.params.id)

        if (!result) {
            return response.notFound(res, "resource not found")
        }

        return response.success(res, result, "data found")

    } catch (err) {
        return response.error(res, err, 500)
    }
}

export const createPenyewa = async (req, res) => {
    try {
        const uniqueKey = uuidv4()
        const dokumenPath = `penyewa/${req.file.filename}`

        try {
            await penyewa.create({
                nama: req.body.nama,
                alamat: req.body.alamat,
                no_telp: req.body.noTelp,
                email: req.body.email,
                id_pengenal: req.body.idPengenal,
                no_pengenal: req.body.noPengenal,
                id_jenis_kelamin: req.body.idJenisKelamin,
                id_status_pernikahan: req.body.idStatusPernikahan,
                id_profesi: req.body.idProfesi,
                nama_institusi: req.body.namaInstitusi,
                alamat_institusi: req.body.alamatInstitusi,
                no_telp_institusi: req.body.noTelpInstitusi,
                dokumen_pengenal: dokumenPath,
                temp_key: uniqueKey
            })
        } catch (createErr) {
            if (req.file?.path) {
                await fs.unlink(req.file.path).catch(() => {})
            }
            throw createErr
        }

        const data = await penyewa.findOne({
            where: { temp_key: uniqueKey }
        })

        return response.created(res, {
            id: data.id,
            dokumenPengenal: privateFileUrl(dokumenPath)
        })
    } catch (err) {
        console.log("Gagal menyimpan properti:", err)
        return response.error(res, err, 500)
    }
}

export const updatePenyewa = async (req, res) => {
    try {
        // ======================
        // CEK DATA ADA / TIDAK
        // ======================
        const existing = await penyewa.findByPk(req.params.id)

        if (!existing) {
            return response.notFound(res, 'data not found')
        }

        // ======================
        // UPDATE DATA
        // ======================
        const payload = {
            nama: req.body.nama,
            alamat: req.body.alamat,
            no_telp: req.body.noTelp,
            email: req.body.email,
            id_pengenal: req.body.idPengenal,
            no_pengenal: req.body.noPengenal,
            id_jenis_kelamin: req.body.idJenisKelamin,
            id_status_pernikahan: req.body.idStatusPernikahan,
            id_profesi: req.body.idProfesi,
            nama_institusi: req.body.namaInstitusi,
            alamat_institusi: req.body.alamatInstitusi,
            no_telp_institusi: req.body.noTelpInstitusi
        }

        if (req.file) {
            payload.dokumen_pengenal = `penyewa/${req.file.filename}`
        }

        let affectedRows = 0
        try {
            ;[affectedRows] = await penyewa.update(payload, {
                where: { id: req.params.id }
            })
        } catch (updateErr) {
            if (req.file?.path) {
                await fs.unlink(req.file.path).catch(() => {})
            }
            throw updateErr
        }

        if (req.file && existing.dokumen_pengenal) {
            const oldAbs = path.join(uploadsBase, existing.dokumen_pengenal)
            await fs.unlink(oldAbs).catch(() => {})
        }

        // ======================
        // TIDAK ADA PERUBAHAN
        // ======================
        if (affectedRows === 0) {
            return response.success(res, null, 'no changes applied')
        }

        // ======================
        // SUCCESS
        // ======================
        return response.success(res, {
            id: req.params.id
        }, 'data updated successfully')

    } catch (err) {
        return response.error(res, err, 500)
    }
}