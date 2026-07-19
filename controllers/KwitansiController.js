import Joi from 'joi'
import { QueryTypes } from 'sequelize'
import { database } from '../config/Database.js'
import * as response from '../helpers/response.js'
import { generatePdfKwitansi } from '../helpers/generatePDF.js'

export const downloadKwitansi = async (req, res) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        })

        const { error } = schema.validate(req.params)
        if (error) {
            return response.error(res, error.details[0].message, 400)
        }

        const [payment] = await database.query(
            `
            SELECT
                p.id AS idPembayaran,
                p.tanggal_bayar AS tanggalBayar,
                p.total_bayar AS totalBayar,
                p.bukti_bayar AS buktiBayar,
                p.id_metode_bayar AS idMetodeBayar,
                mb.nama AS metodeBayarNama,

                t.id AS idTagihan,
                t.tanggal_tagihan AS tanggalTagihan,
                t.tanggal_jatuh_tempo AS tanggalJatuhTempo,
                t.total AS totalTagihan,
                t.id_deskripsi_tagihan AS idDeskripsiTagihan,
                dt.nama AS deskripsiTagihanNama,
                t.id_status_tagihan AS idStatusTagihan,
                st.nama AS statusTagihanNama,

                s.id AS idSewa,
                s.tanggal_masuk AS sewaTanggalMasuk,
                s.tanggal_keluar AS sewaTanggalKeluar,

                k.id AS idKamar,
                k.nama AS kamarNama,

                pr.id AS idProperti,
                pr.nama AS propertiNama,
                pr.alamat AS propertiAlamat,
                pr.no_telp AS propertiNoTelp,

                pe.id AS idPenyewa,
                pe.nama AS penyewaNama,
                pe.alamat AS penyewaAlamat,
                pe.no_telp AS penyewaNoTelp
            FROM pembayaran p
            JOIN metode_bayar mb ON p.id_metode_bayar = mb.id
            JOIN tagihan t ON p.id_tagihan = t.id
            JOIN sewa s ON t.id_sewa = s.id
            JOIN kamar k ON s.id_kamar = k.id
            JOIN properti pr ON k.id_properti = pr.id
            JOIN penyewa pe ON s.id_penyewa = pe.id
            LEFT JOIN deskripsi_tagihan dt ON t.id_deskripsi_tagihan = dt.id
            LEFT JOIN status_tagihan st ON t.id_status_tagihan = st.id
            WHERE p.id = ?
            `,
            {
                type: QueryTypes.SELECT,
                replacements: [req.params.id]
            }
        )

        if (!payment) {
            return response.notFound(res, 'data not found')
        }

        const pdfBuffer = await generatePdfKwitansi(payment)

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Length', pdfBuffer.length)
        res.setHeader('Content-Disposition', `attachment; filename="Kwitansi-${payment.idPembayaran}.pdf"`)
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
        res.setHeader('Pragma', 'no-cache')
        res.setHeader('Expires', '0')

        return res.end(pdfBuffer)
    } catch (err) {
        console.error('Error download kwitansi:', err)
        return response.error(res, err, 422)
    }
}
