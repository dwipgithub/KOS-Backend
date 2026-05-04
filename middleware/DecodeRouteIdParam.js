import { decodeRouteId } from "../helpers/routeId.js";

export const decodeRouteIdParam = (paramName = "id") => (req, res, next) => {
    try {
        const raw = req.params?.[paramName];
        const decoded = decodeRouteId(raw);
        req.params[paramName] = decoded;
        next();
    } catch (err) {
        res.status(400).json({
            status: false,
            message: "Invalid route id",
        });
    }
};

