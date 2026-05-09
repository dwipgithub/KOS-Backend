import { get } from '../models/LaporanPiutang.js'
import { properti, show } from '../models/Properti.js'
import Joi from 'joi';
import paginationDB from '../config/PaginationDB.js'
import * as response from '../helpers/response.js'
import { generatePdfPiutang } from '../helpers/generatePDF.js'

export const getLaporanPiutang = async(req, res) => {
    try {
        const schema = Joi.object({
            startDate: Joi.date().required(),
            endDate: Joi.date().required(),
            idProperti: Joi.string().required()
        })

        const { error } = schema.validate(req.query)

        if (error) {
            return response.error(res, error.details[0].message, 400)
        }
        
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

export const exportPdfPiutang = async(req, res) => {
    try {
        const schema = Joi.object({
            startDate: Joi.date().required(),
            endDate: Joi.date().required(),
            idProperti: Joi.string().required()
        })

        const { error } = schema.validate(req.query)

        if (error) {
            return response.error(res, error.details[0].message, 400)
        }

        console.log('=== EXPORT PDF PIUTANG START ===')
        console.log('Query params:', req.query)

        // Disable pagination untuk export semua data
        req.query.limit = 999999

        const results = await get(req)
        console.log('Data retrieved:', results.data ? results.data.length : 0, 'records')

        if (!results.data || results.data.length === 0) {
            return response.error(res, 'No data found', 404)
        }

        // Extract filter params untuk ditampilkan di PDF
        const filters = {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            idProperti: req.query.idProperti
        }

        if (req.query.idProperti) {
            try {
                const propertiData = await show(req.query.idProperti)

                if (propertiData) {
                    filters.namaProperti = propertiData.nama
                    filters.alamatProperti = [
                        propertiData.alamat,
                        propertiData.kelurahan?.nama,
                        propertiData.kecamatan?.nama,
                        propertiData.kabKota?.nama,
                        propertiData.provinsi?.nama
                    ]
                    .filter(Boolean)
                    .join(', ')
                    filters.noTelpProperti = propertiData.noTelp
                }
            } catch (error) {
                console.warn('Could not fetch properti name:', error.message)
            }
        }

        console.log('Generating PDF with filters:', filters)

        // Generate PDF
        const pdfBuffer = await generatePdfPiutang(results, filters)

        console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes')

        // Clear any existing headers
        res.clearCookie()

        // Set response headers untuk PDF
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Length', pdfBuffer.length)
        res.setHeader('Content-Disposition', `attachment; filename="Laporan-Piutang-${new Date().getTime()}.pdf"`)
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
        res.setHeader('Pragma', 'no-cache')
        res.setHeader('Expires', '0')

        return res.end(pdfBuffer)

    } catch (err) {
        console.error('=== ERROR EXPORT PDF PIUTANG ===')
        console.error('Error message:', err.message)
        console.error('Error stack:', err.stack)
        return res.status(422).send({ error: true, message: err.message })
    }
}

