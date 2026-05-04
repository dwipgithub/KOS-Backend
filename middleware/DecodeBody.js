import { decodeRouteId } from "../helpers/routeId.js";

export const decodeBodyFields = (fields = []) => (req, res, next) => {
    try {
        console.log("=== BEFORE DECODE ===");
        console.log(req.body);

        for (const field of fields) {
            if (req.body[field]) {
                const original = req.body[field];
                const decoded = decodeRouteId(original);

                console.log(`Field: ${field}`);
                console.log(`Encrypted: ${original}`);
                console.log(`Decrypted: ${decoded}`);
                console.log("---------------");

                req.body[field] = decoded;
            }
        }

        console.log("=== AFTER DECODE ===");
        console.log(req.body);

        next();
    } catch (err) {
        console.log("DECODE ERROR:", err);

        return res.status(400).json({
            status: false,
            message: "Invalid encrypted field in body",
        });
    }
};