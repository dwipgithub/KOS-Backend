import { pembayaran, get, show } from '../models/Pembayaran.js'
import paginationDB from '../config/PaginationDB.js'
import * as response from '../helpers/response.js'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs/promises'
import { privateFileUrl } from '../helpers/privateFileUrl.js'

export const createPembayaran = async (req, res) => {
    try {
        const uniqueKey = uuidv4()
        const buktiPath = `pembayaran/${req.file.filename}`

        try {
            await pembayaran.create({
                id_tagihan: req.body.idTagihan,
                tanggal_bayar: req.body.tanggalBayar,
                total_bayar: req.body.totalBayar,
                id_metode_bayar: req.body.idMetodeBayar,
                bukti_bayar: buktiPath,
                temp_key: uniqueKey
            })
        } catch (createErr) {
            if (req.file?.path) {
                await fs.unlink(req.file.path).catch(() => {})
            }
            throw createErr
        }

        const data = await pembayaran.findOne({
            where: { temp_key: uniqueKey }
        })

        res.status(200).send({
            error: false,
            message: 'data created successfully',
            data: {
                id: data.id,
                buktiBayar: privateFileUrl(buktiPath)
            }
        })
    } catch (err) {
        res.status(422).send({
            error: true,
            message: err.message
        })
    }
}

export const getPembayaran = async(req, res) => {
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

export const showPembayaran = async(req, res) => {
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
