import { get } from '../models/LaporanLabaRugi.js'
import { properti } from '../models/Properti.js'
import paginationDB from '../config/PaginationDB.js'
import * as response from '../helpers/response.js'
import { generatePdfLabaRugi } from '../helpers/generatePDF.js'

export const getLaporanLabaRugi = async(req, res) => {
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

export const exportPdfLabaRugi = async(req, res) => {
    try {
        console.log('=== EXPORT PDF LABA RUGI START ===')
        console.log('Query params:', req.query)
        
        const results = await get(req)
        console.log('Data retrieved')

        if (!results) {
            return res.status(404).send({ error: true, message: 'No data found' })
        }

        const filters = {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            idProperti: req.query.idProperti
        }

        // Get properti name if idProperti is provided
        if (req.query.idProperti) {
            try {
                const propertiData = await properti.findByPk(req.query.idProperti, {
                    attributes: ['nama']
                })
                if (propertiData) {
                    filters.namaProperti = propertiData.nama
                }
            } catch (error) {
                console.warn('Could not fetch properti name:', error.message)
            }
        }

        console.log('Generating PDF with filters:', filters)

        const pdfBuffer = await generatePdfLabaRugi(results, filters)

        console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes')

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Length', pdfBuffer.length)
        res.setHeader('Content-Disposition', `attachment; filename="Laporan-Laba-Rugi-${new Date().getTime()}.pdf"`)
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
        res.setHeader('Pragma', 'no-cache')
        res.setHeader('Expires', '0')

        return res.end(pdfBuffer)

    } catch (err) {
        console.error('=== ERROR EXPORT PDF LABA RUGI ===')
        console.error('Error message:', err.message)
        console.error('Error stack:', err.stack)
        return res.status(422).send({ error: true, message: err.message })
    }
}

