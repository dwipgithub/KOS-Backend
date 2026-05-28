import { get, show, destroy, tagihan } from "../models/Tagihan.js"
import paginationDB from '../config/PaginationDB.js'
import * as response from '../helpers/response.js'
import { v4 as uuidv4 } from 'uuid'

export const createTagihan = async (req, res) => {
    try {
        const uniqueKey = uuidv4()

        await tagihan.create({
            id_sewa: req.body.idSewa,
            id_deskripsi_tagihan: req.body.idDeskripsiTagihan,
            tanggal_tagihan: req.body.tanggalTagihan,
            tanggal_jatuh_tempo: req.body.tanggalJatuhTempo,
            harga_satuan: req.body.hargaSatuan,
            jumlah: req.body.jumlah || 1,
            diskon_persen: req.body.diskonPersen || 0,
            diskon_nominal: req.body.diskonNominal || 0,
            total: req.body.total || req.body.hargaSatuan,
            id_status_tagihan: "UNPAID",
            temp_key: uniqueKey
        })

        const data = await tagihan.findOne({
            where: { temp_key: uniqueKey }
        })

        res.status(200).send({
            error: false,
            message: 'data created successfully',
            data:  {
                id: data.id
            }
        })
    } catch (err) {
        res.status(422).send({
            error: true,
            message: err.message
        })
    }
}

export const getTagihan = async (req, res) => {
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

export const showTagihan = async (req, res) => {
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

export const destroyTagihan = async (req, res) => {
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