/** Prefix route untuk file privat (harus sama dengan route di `routes/index.js`). */
const PREFIX = "/api/v1/files"

/**
 * @param {string | null | undefined} storedRelativePath contoh: penyewa/uuid.pdf
 */
export function privateFileUrl(storedRelativePath) {
    if (!storedRelativePath) return null
    const clean = String(storedRelativePath).replace(/^\/+/, "")
    return `${PREFIX}/${clean}`
}
