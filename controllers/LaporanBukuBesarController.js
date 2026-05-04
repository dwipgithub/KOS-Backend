import { get } from '../models/LaporanBukuBesar.js'
import { properti } from '../models/Properti.js'
import * as response from '../helpers/response.js'
import { generatePdfBukuBesar } from '../helpers/generatePDF.js'

export const getLaporanBukuBesar = async (req, res) => {
    try {
        const results = await get(req)

        const message = results.data.length
            ? 'data found'
            : 'no data found'

        return response.success(
            res,
            results,
            message
        )

    } catch (err) {
        return response.error(res, err, 422)
    }
}

export const exportPdfBukuBesar = async (req, res) => {
    try {
        console.log('=== EXPORT PDF BUKU BESAR START ===')
        console.log('Query params:', req.query)
        
        const results = await get(req)
        console.log('Data retrieved')

        if (!results || !results.data || results.data.length === 0) {
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

        const pdfBuffer = await generatePdfBukuBesar(results, filters)

        console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes')

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Length', pdfBuffer.length)
        res.setHeader('Content-Disposition', `attachment; filename="Laporan-Buku-Besar-${new Date().getTime()}.pdf"`)
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
        res.setHeader('Pragma', 'no-cache')
        res.setHeader('Expires', '0')

        return res.end(pdfBuffer)

    } catch (err) {
        console.error('=== ERROR EXPORT PDF BUKU BESAR ===')
        console.error('Error message:', err.message)
        console.error('Error stack:', err.stack)
        return res.status(422).send({ error: true, message: err.message })
    }
}
