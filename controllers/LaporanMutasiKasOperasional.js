import { get } from '../models/LaporanMutasiKasOperasional.js'
import Joi from 'joi';
import paginationDB from '../config/PaginationDB.js'
import * as response from '../helpers/response.js'
import { generatePdfMutasiKasOperasional } from '../helpers/generatePDF.js'

export const getLaporanMutasiKasOperasional = async(req, res) => {
    try {
        const schema = Joi.object({
            startDate: Joi.date().required(),
            endDate: Joi.date().required(),
        })

        const { error } = schema.validate(req.query)

        if (error) {
            return response.error(res, error.details[0].message, 400)
        }

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
            results,
            message,
            pagination
        )

    } catch (err) {
        return response.error(res, err, 422)
    }
}

export const exportPdfMutasiKasOperasional = async (req, res) => {
    try {
        const schema = Joi.object({
            startDate: Joi.date().required(),
            endDate: Joi.date().required(),
            idKas: Joi.string().optional(),
        })

        const { error } = schema.validate(req.query)

        if (error) {
            return response.error(res, error.details[0].message, 400)
        }

        req.query.limit = 999999
        if (!req.query.idKas) {
            req.query.idKas = 'KAS-1'
        }

        const results = await get(req)

        const filters = {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            idKas: req.query.idKas,
        }

        const pdfBuffer = await generatePdfMutasiKasOperasional(results, filters)

        res.clearCookie()
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Length', pdfBuffer.length)
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="Laporan-Mutasi-Kas-Operasional-${new Date().getTime()}.pdf"`
        )
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
        res.setHeader('Pragma', 'no-cache')
        res.setHeader('Expires', '0')

        return res.end(pdfBuffer)
    } catch (err) {
        console.error('=== ERROR EXPORT PDF MUTASI KAS OPERASIONAL ===')
        console.error('Error message:', err.message)
        console.error('Error stack:', err.stack)
        return res.status(422).send({ error: true, message: err.message })
    }
}