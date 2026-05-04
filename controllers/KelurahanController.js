import { get, show  } from "../models/Kelurahan.js"
import paginationDB from '../config/PaginationDB.js'
import * as response from '../helpers/response.js'

export const getKelurahan = async (req, res) => {
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

export const showKelurahan = async (req, res) => {
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