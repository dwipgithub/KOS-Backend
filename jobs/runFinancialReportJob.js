import { getPemilik } from '../models/Pemilik.js'
import { get as getArusKas } from '../models/LaporanArusKas.js'
import { get as getLabaRugi } from '../models/LaporanLabaRugi.js'
import { get as getBukuBesar } from '../models/LaporanBukuBesar.js'
import { get as getPiutang } from '../models/LaporanPiutang.js'
import { get as getProperti } from '../models/Properti.js'
import { generatePdfArusKas, generatePdfLabaRugi, generatePdfBukuBesar, generatePdfPiutang } from '../helpers/generatePDF.js'
import { sendEmail } from '../services/emailService.js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({
    path: path.join(__dirname, '../.env')
})

// dotenv.config({
//     path: '/Users/dp/Documents/Project/Kos/Backend/.env'
// })

// const RECEIVER_EMAIL = 'kotakelektronik@gmail.com'

const formatDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const formatPeriodText = (startDate, endDate) => {
    const start = new Date(startDate).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric'
    })
    const end = new Date(endDate).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric'
    })
    return `${start} s.d. ${end}`
}

const sanitizeFileName = (value) =>
    value.replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '_')

const createEmailBody = (propertyName, periodText) => {
    return `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5;">
            <h2 style="color: #2c3e50;">Laporan Keuangan Properti ${propertyName}</h2>
            <p>Berikut terlampir laporan keuangan untuk properti <strong>${propertyName}</strong> periode <strong>${periodText}</strong>.</p>
            <ul>
                <li>Laporan Arus Kas</li>
                <li>Laporan Laba Rugi</li>
                <li>Laporan Buku Besar</li>
                <li>Laporan Piutang</li>
            </ul>
            <p>Silakan buka lampiran untuk melihat detail laporan per properti.</p>
        </div>
    `
}

export const runFinancialReportJob = async () => {
    console.log('🚀 Mulai job Laporan Keuangan...')

    try {
        // ======================
        // AMBIL EMAIL PEMILIK
        // ======================
        const pemilikData = await getPemilik()
        const pemilik = Array.isArray(pemilikData) ? pemilikData[0] : pemilikData

        if (!pemilik || !pemilik.email) {
            console.log('❌ Email pemilik tidak ditemukan')
            return
        }

        const RECEIVER_EMAIL = pemilik.email

        console.log(`📧 Email tujuan: ${RECEIVER_EMAIL}`)

        const propertiResult = await getProperti({ query: { limit: 999999 } })
        const propertyList = propertiResult.data || []

        if (propertyList.length === 0) {
            console.log('ℹ️ Tidak ada properti ditemukan. Job selesai.')
            return
        }

        const now = new Date()
        const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const startDate = formatDate(new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 1))
        const endDate = formatDate(new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 0))
        const periodText = formatPeriodText(startDate, endDate)

        console.log(`📅 Periode laporan: ${periodText}`)
        console.log(`🏢 Jumlah properti: ${propertyList.length}`)

        let emailSentCount = 0

        for (const property of propertyList) {
            try {
                const propertyId = property.id
                const propertyName = property.nama || propertyId
                console.log(`\n🔎 Memproses properti: ${propertyName} (${propertyId})`)

                // Build address from existing property response
                const alamatProperti = [
                    property.alamat,
                    property.kelurahan?.nama,
                    property.kecamatan?.nama,
                    property.kabKota?.nama,
                    property.provinsi?.nama
                ]
                    .filter(Boolean)
                    .join(', ')

                const noTelpProperti = property.noTelp || '-'

                const arusKasReq = {
                    query: {
                        startDate,
                        endDate,
                        idProperti: propertyId,
                        limit: 999999
                    }
                }
                const arusKasResult = await getArusKas(arusKasReq)
                const arusKasBuffer = await generatePdfArusKas(arusKasResult.data, {
                    startDate,
                    endDate,
                    idProperti: propertyId,
                    namaProperti: propertyName,
                    alamatProperti,
                    noTelpProperti
                })

                const labaRugiReq = {
                    query: {
                        startDate,
                        endDate,
                        idProperti: propertyId
                    }
                }
                const labaRugiResult = await getLabaRugi(labaRugiReq)
                const labaRugiBuffer = await generatePdfLabaRugi(labaRugiResult, {
                    startDate,
                    endDate,
                    idProperti: propertyId,
                    namaProperti: propertyName,
                    alamatProperti,
                    noTelpProperti
                })

                const bukuBesarReq = {
                    query: {
                        startDate,
                        endDate,
                        idProperti: propertyId
                    }
                }
                const bukuBesarResult = await getBukuBesar(bukuBesarReq)
                const bukuBesarBuffer = await generatePdfBukuBesar(bukuBesarResult, {
                    startDate,
                    endDate,
                    idProperti: propertyId,
                    namaProperti: propertyName,
                    alamatProperti,
                    noTelpProperti
                })

                const piutangReq = {
                    query: {
                        startDate,
                        endDate,
                        idProperti: propertyId
                    }
                }
                const piutangResult = await getPiutang(piutangReq)
                const piutangBuffer = await generatePdfPiutang(piutangResult, {
                    startDate,
                    endDate,
                    idProperti: propertyId,
                    namaProperti: propertyName,
                    alamatProperti,
                    noTelpProperti
                })

                const safePropertyName = sanitizeFileName(propertyName)
                const attachments = [
                    {
                        filename: `Laporan-Arus-Kas-${safePropertyName}.pdf`,
                        content: arusKasBuffer,
                        contentType: 'application/pdf'
                    },
                    {
                        filename: `Laporan-Laba-Rugi-${safePropertyName}.pdf`,
                        content: labaRugiBuffer,
                        contentType: 'application/pdf'
                    },
                    {
                        filename: `Laporan-Buku-Besar-${safePropertyName}.pdf`,
                        content: bukuBesarBuffer,
                        contentType: 'application/pdf'
                    },
                    {
                        filename: `Laporan-Piutang-${safePropertyName}.pdf`,
                        content: piutangBuffer,
                        contentType: 'application/pdf'
                    }
                ]

                const emailSubject = `Laporan Keuangan ${propertyName} (${periodText})`
                const emailBody = createEmailBody(propertyName, periodText)

                console.log(`📧 Mengirim email untuk properti ${propertyName}...`)
                console.log(`   Subject: ${emailSubject}`)
                console.log(`   Lampiran: ${attachments.length} file`)
                console.log(`   Penerima: ${RECEIVER_EMAIL}`)

                await sendEmail(RECEIVER_EMAIL, emailSubject, emailBody, attachments)
                emailSentCount++

                console.log(`✅ Email laporan properti ${propertyName} terkirim ke ${RECEIVER_EMAIL}`)
            } catch (propertyError) {
                console.error(`❌ Gagal memproses properti ${property?.nama || property?.id}:`, propertyError)
            }
        }

        console.log(`\n✅ Job Laporan Keuangan selesai. Total email terkirim: ${emailSentCount}`)
    } catch (error) {
        console.error('❌ Job Laporan Keuangan gagal:', error)
        throw error
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runFinancialReportJob().catch((error) => {
        console.error('Job finished with error:', error)
        process.exit(1)
    })
}
