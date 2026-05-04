import { get, keluar } from '../models/Keluar.js'
import paginationDB from '../config/PaginationDB.js'
import * as response from '../helpers/response.js'
import { v4 as uuidv4 } from 'uuid'

export const createKeluar = async (req, res) => {
    try {
        const uniqueKey = uuidv4()

        await keluar.create({
            id: uuidv4(),
            id_sewa: req.body.idSewa,
            tanggal_keluar: req.body.tanggalKeluar,
            catatan: req.body.catatan,
            temp_key: uniqueKey
        })

        const data = await keluar.findOne({
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

export const getKeluar = async (req, res) => {
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
            message,
            pagination,
            results.data
        )

    } catch (err) {
        return response.error(res, err, 422)
    }
}