import { get as getTagihan } from '../models/Tagihan.js'
import { sendWhatsapp } from '../services/whatsappService.js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({
    path: path.join(__dirname, '../.env')
})

const formatDateYMD = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const addDays = (date, days) => {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
}

const normalizePhone = (phone) => {
    if (!phone) return null
    const digits = String(phone).replace(/\D/g, '')
    if (!digits) return null
    return digits.replace(/^0+/, '')
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const groupTagihanByPenyewa = (tagihanList = []) => {
    return tagihanList.reduce((groups, item) => {
        const penyewa = item.penyewa || {}
        const key = penyewa.id || `unknown-${item.id}`

        if (!groups[key]) {
            groups[key] = {
                penyewa,
                tagihan: []
            }
        }

        groups[key].tagihan.push(item)
        return groups
    }, {})
}

const getRandomDelay = (minMs, maxMs) => {
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
}

const getReminderCategory = (jatuhTempo) => {
    const today = new Date()
    const jt = new Date(jatuhTempo)

    today.setHours(0, 0, 0, 0)
    jt.setHours(0, 0, 0, 0)

    const diff = (jt - today) / (1000 * 60 * 60 * 24)

    if (diff > 0) return 'BEFORE'
    if (diff === 0) return 'TODAY'
    return 'AFTER'
}

export const runSendWhatsappJob = async () => {
    console.log('🚀 Memulai job reminder WhatsApp tagihan...')

    const todayDate = new Date()

    const startDate = formatDateYMD(addDays(todayDate, -3))
    const endDate = formatDateYMD(addDays(todayDate, 3))

    // const today = formatDateYMD(todayDate)

    console.log(`📅 Filter tanggal: ${startDate} s/d ${endDate}`)

    const request = {
        query: {
            idStatusTagihan: 'UNPAID',
            limit: 999999
        }
    }

    const result = await getTagihan(request)
    const invoices = result.data || []

    console.log(`🧾 Tagihan UNPAID ditemukan: ${invoices.length}`)

    // const dueToday = invoices.filter((item) => item.tanggalJatuhTempo === today)
    // console.log(`📅 Tagihan jatuh tempo hari ini (${today}): ${dueToday.length}`)

    const dueRange = invoices.filter((item) => {
        const tgl = item.tanggalJatuhTempo
        return tgl >= startDate && tgl <= endDate
    })

    console.log(`📅 Tagihan dalam range: ${dueRange.length}`)


    // if (dueToday.length === 0) {
    //     return {
    //         totalTagihan: invoices.length,
    //         dueToday: 0,
    //         recipients: 0,
    //         sent: 0,
    //         skipped: 0
    //     }
    // }

    if (dueRange.length === 0) {
        return {
            totalTagihan: invoices.length,
            dueRange: 0,
            recipients: 0,
            sent: 0,
            skipped: 0
        }
    }

    // const grouped = groupTagihanByPenyewa(dueToday)
    const grouped = groupTagihanByPenyewa(dueRange)
    const recipients = Object.values(grouped)

    let sentCount = 0
    let skippedCount = 0

    for (let index = 0; index < recipients.length; index++) {
        const { penyewa, tagihan } = recipients[index]
        const nama = penyewa?.nama || 'Pelanggan'
        const rawPhone = penyewa?.noTelp || ''
        const target = normalizePhone(rawPhone)

        if (!target) {
            console.warn(`⚠️ Skip pengiriman untuk ${nama} karena nomor tidak valid: ${rawPhone}`)
            skippedCount++
            continue
        }

        // ======================
        // DELAY PERTAMA (RANDOM 1-3 MENIT)
        // ======================
        if (index === 0) {
            const delay = getRandomDelay(60000, 180000) // 1–3 menit
            console.log(`⏳ Delay awal (random): ${Math.round(delay / 1000)} detik...`)
            await sleep(delay)
        }

        const jatuhTempo = tagihan[0]?.tanggalJatuhTempo || today
        console.log(`📲 Mengirim WA ke ${nama} (${target}) — ${tagihan.length} tagihan`) 

        const category = getReminderCategory(jatuhTempo)

        const response = await sendWhatsapp({
            target,
            nama,
            jatuhTempo,
            category
        })

        console.log('Response WA:', response)
        sentCount++

        const isLastRecipient = index === recipients.length - 1

        // ======================
        // DELAY SELANJUTNYA (FIX 3 MENIT)
        // ======================
        if (!isLastRecipient && recipients.length > 1) {
            console.log('⏳ Menunggu 3 menit sebelum pengiriman berikutnya...')
            await sleep(180000)
        }
    }

    console.log(`✅ Job selesai. Pesan terkirim: ${sentCount}, skip: ${skippedCount}`)

    // return {
    //     totalTagihan: invoices.length,
    //     dueToday: dueToday.length,
    //     recipients: recipients.length,
    //     sent: sentCount,
    //     skipped: skippedCount
    // }

    return {
        totalTagihan: invoices.length,
        dueRange: dueRange.length,
        recipients: recipients.length,
        sent: sentCount,
        skipped: skippedCount
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runSendWhatsappJob().catch((error) => {
        console.error('Job reminder WhatsApp gagal:', error)
        process.exit(1)
    })
}