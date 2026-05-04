import crypto from "crypto";

function base64UrlEncode(buf) {
    return Buffer.from(buf)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

function base64UrlDecode(str) {
    const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
    return Buffer.from(padded, "base64");
}

function getKey() {
    const secret = process.env.ROUTE_ID_SECRET;
    if (!secret) {
        return null;
    }
    return crypto.createHash("sha256").update(secret).digest(); // 32 bytes
}

export function decodeRouteId(routeId) {
    if (!routeId) throw new Error("Missing routeId");
    const key = getKey();
    if (!key) {
        // Fallback: treat as plain id (dev safety)
        return String(routeId);
    }
    const encrypted = base64UrlDecode(String(routeId));

    const iv = encrypted.subarray(0, 16);
    const payload = encrypted.subarray(16);

    const decipher = crypto.createDecipheriv("aes-256-ctr", key, iv);
    const decrypted = Buffer.concat([decipher.update(payload), decipher.final()]);
    return decrypted.toString("utf8");
}

export function encodeRouteId(plain) {
    if (plain == null) return "";
    const text = String(plain);
    const key = getKey();
    if (!key) {
        // Fallback: return plain id (dev safety)
        return text;
    }
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-ctr", key, iv);
    const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
    return base64UrlEncode(Buffer.concat([iv, encrypted]));
}

