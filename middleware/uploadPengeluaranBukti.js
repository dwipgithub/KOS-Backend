import multer from "multer"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"
import { v4 as uuidv4 } from "uuid"
import * as response from "../helpers/response.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadRoot = path.join(__dirname, "..", "uploads", "pengeluaran")

const ALLOWED_EXT = new Set([".pdf", ".jpg", ".jpeg", ".png", ".webp", ".gif"])
const ALLOWED_MIMES = new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif"
])

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        fs.mkdirSync(uploadRoot, { recursive: true })
        cb(null, uploadRoot)
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname || "").toLowerCase()
        cb(null, `${uuidv4()}${ext}`)
    }
})

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase()
    if (!ALLOWED_EXT.has(ext) || !ALLOWED_MIMES.has(file.mimetype)) {
        return cb(new Error("File harus PDF atau gambar (JPEG, PNG, WebP, GIF)"))
    }
    cb(null, true)
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1
    }
})

export function pengeluaranBuktiUpload(req, res, next) {
    const ct = req.headers["content-type"] || ""
    if (!ct.includes("multipart/form-data")) {
        return response.error(
            res,
            new Error("Gunakan multipart/form-data dan unggah bukti pengeluaran"),
            400
        )
    }

    return upload.single('buktiPengeluaran')(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    return response.error(res, new Error("Ukuran file maksimal 10 MB"), 400)
                }
                if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_PART_COUNT") {
                    return response.error(
                        res,
                        new Error("Hanya satu file yang diperbolehkan per request"),
                        400
                    )
                }
            }
            return response.error(res, err, 400)
        }
        if (!req.file) {
            return response.error(res, new Error("Bukti pengeluaran wajib diunggah"), 400)
        }
        return next()
    })
}
