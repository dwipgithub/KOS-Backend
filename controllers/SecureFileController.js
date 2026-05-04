import path from "path"
import fs from "fs/promises"
import { fileURLToPath } from "url"
import * as response from "../helpers/response.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOAD_ROOT = path.resolve(path.join(__dirname, "..", "uploads"))
const ALLOWED_FOLDERS = new Set(["penyewa", "pembayaran"])

const MIME_BY_EXT = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif"
}

/**
 * GET /api/v1/files/:folder/:filename
 * Hanya folder yang diizinkan; cegah path traversal.
 */
export const servePrivateFile = async (req, res) => {
    try {
        const { folder, filename } = req.params

        if (!folder || !filename || !ALLOWED_FOLDERS.has(folder)) {
            return response.error(res, new Error("Path tidak valid"), 400)
        }

        if (filename !== path.basename(filename) || filename.includes("..")) {
            return response.error(res, new Error("Path tidak valid"), 400)
        }

        const abs = path.resolve(UPLOAD_ROOT, folder, filename)
        const rel = path.relative(UPLOAD_ROOT, abs)
        if (rel.startsWith("..") || path.isAbsolute(rel)) {
            return response.error(res, new Error("Path tidak valid"), 400)
        }

        const st = await fs.stat(abs)
        if (!st.isFile()) {
            return response.notFound(res, "File tidak ditemukan")
        }

        const ext = path.extname(filename).toLowerCase()
        const contentType = MIME_BY_EXT[ext] || "application/octet-stream"

        return res.sendFile(abs, {
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": "inline",
                "Cache-Control": "private, no-store"
            }
        })
    } catch (err) {
        if (err.code === "ENOENT") {
            return response.notFound(res, "File tidak ditemukan")
        }
        return response.error(res, err, 500)
    }
}
