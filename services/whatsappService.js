import axios from "axios"
import dotenv from "dotenv"
import { getRandomTemplate } from "../templates/whatsappTemplates.js"
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({
    path: path.join(__dirname, '../.env')
})

// ======================
// FUNCTION KIRIM WA
// ======================
export const sendWhatsapp = async ({
    target,
    nama,
    jatuhTempo,
    countryCode = "62"
}) => {

    const message = getRandomTemplate({ nama, jatuhTempo })

    try {
        const response = await axios.post(
            process.env.WHATSAPP_URL,
            new URLSearchParams({
                target,
                message,
                countryCode
            }),
            {
                headers: {
                    Authorization: process.env.WHATSAPP_TOKEN,
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
        )

        console.log("=== TEMPLATE DIPAKAI ===")
        console.log(message)
        console.log("========================")

        console.log("=== RESPONSE ===")
        console.log(response.data)

        return response.data

    } catch (error) {
        if (error.response) {
            console.error("API Error:", error.response.data)
            return error.response.data
        } else {
            console.error("Request Error:", error.message)
            return error.message
        }
    }
}