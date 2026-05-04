import { get } from '../models/LaporanTagihan.js'
import paginationDB from '../config/PaginationDB.js'
import * as response from '../helpers/response.js'

export const getLaporanTagihan = async(req, res) => {
    try {
        const results = await get(req)

        return response.success(
            res,
            results,
            'data found'
        )

    } catch (err) {
        return response.error(res, err, 422)
    }
}

