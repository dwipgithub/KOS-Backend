export const verifyCsrfToken = (req, res, next) => {
    const csrfTokenFromClient = req.headers['xsrf-token']
    const csrfTokenFromCookie = req.cookies['XSRF-TOKEN']
    const arrayCSRFToken = [csrfTokenFromCookie, '4c7936f-b388-4909-b26c-d07dbafdc7a7']

    // console.log(csrfTokenFromClient)
    console.log(csrfTokenFromCookie)
    // console.log(arrayCSRFToken)

    if (!csrfTokenFromClient || !arrayCSRFToken.includes(csrfTokenFromClient)) {
        res.status(403).send({
            status: false,
            message: 'CSRF token gagal validasi'
        })
        return
    }
    next();
}