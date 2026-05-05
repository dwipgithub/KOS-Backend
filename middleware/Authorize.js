export const authorize = (allowedRoles = []) => {
    return (req, res, next) => {
        const userRole = req.user.role || req.user.peran

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).send({
                error: true,
                message: 'Akses ditolak'
            })
        }

        next()
    }
}