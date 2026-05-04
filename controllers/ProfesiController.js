import { get, show, profesi } from "../models/Profesi.js"
import paginationDB from '../config/PaginationDB.js'
import * as response from '../helpers/response.js'
import { v4 as uuidv4 } from "uuid"

export const createProfesi = async (req, res) => {
    try {
        const uniqueKey = uuidv4()

        await profesi.create({
            nama: req.body.nama,
            temp_key: uniqueKey
        })

        const data = await profesi.findOne({
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

export const getProfesi = async (req, res) => {
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

export const showProfesi = async (req, res) => {
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