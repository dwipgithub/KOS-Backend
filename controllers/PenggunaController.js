import { pengguna } from '../models/PenggunaModel.js'
import bcrypt from 'bcrypt'
import jsonWebToken from 'jsonwebtoken'
import Joi from 'joi'
import { rolePermissions } from '../config/Permissions.js'

// ======================
// LOGIN
// ======================
export const login = async (req, res) => {
    const schema = Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required(),
    })

    const { error } = schema.validate(req.body)

    if (error) {
        return res.status(400).send({
            status: false,
            message: error.details[0].message
        })
    }

    try {
        const user = await pengguna.findOne({
            attributes: ['id', 'nama', 'email', 'password', 'peran'],
            where: { email: req.body.email }
        })

        if (!user) {
            return res.status(404).send({
                status: false,
                message: 'email not found'
            })
        }

        const match = await bcrypt.compare(req.body.password, user.password)

        if (!match) {
            return res.status(401).send({
                status: false,
                message: 'wrong password'
            })
        }

        // ======================
        // PAYLOAD JWT
        // ======================
        const payload = {
            id: user.id,
            nama: user.nama,
            email: user.email,
            peran: user.peran
        }

        const accessToken = jsonWebToken.sign(
            payload,
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRESIN }
        )

        const refreshToken = jsonWebToken.sign(
            { id: user.id },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRESIN }
        )

        // ======================
        // SIMPAN REFRESH TOKEN
        // ======================
        await pengguna.update(
            { refresh_token: refreshToken },
            { where: { id: user.id } }
        )

        // ======================
        // COOKIE
        // ======================
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            sameSite: 'Strict',
            secure: false,
            maxAge: 6 * 60 * 60 * 1000
        })

        // ======================
        // PERMISSIONS
        // ======================
        const permissions = rolePermissions[user.peran] || {}

        // ======================
        // RESPONSE
        // ======================
        return res.status(200).send({
            status: true,
            message: "access token created",
            data: {
                name: user.nama,
                role: user.peran,
                permissions: permissions,
                access_token: accessToken
            }
        })

    } catch (err) {
        return res.status(500).send({
            status: false,
            message: err.message
        })
    }
}


// ======================
// LOGOUT
// ======================
export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken

        if (!refreshToken) {
            return res.status(200).send({
                status: false,
                message: 'Unauthorized'
            })
        }

        const user = await pengguna.findOne({
            where: { refresh_token: refreshToken }
        })

        if (!user) {
            return res.status(200).send({
                status: false,
                message: 'User not found'
            })
        }

        await pengguna.update(
            { refresh_token: null },
            { where: { id: user.id } }
        )

        res.clearCookie('refreshToken')

        return res.status(200).send({
            status: true,
            message: 'Logout berhasil'
        })

    } catch (err) {
        return res.status(500).send({
            status: false,
            message: err.message
        })
    }
}


// ======================
// CHANGE PASSWORD
// ======================
export const changePassword = async (req, res) => {
    const schema = Joi.object({
        passwordLama: Joi.string().required(),
        passwordBaru: Joi.string().required(),
        passwordBaruConfirmation: Joi.string()
            .valid(Joi.ref('passwordBaru'))
            .required()
    })

    const { error } = schema.validate(req.body)

    if (error) {
        return res.status(400).send({
            status: false,
            message: error.details[0].message
        })
    }

    try {
        const user = await pengguna.findOne({
            attributes: ['password'],
            where: { id: req.params.id }
        })

        const match = await bcrypt.compare(req.body.passwordLama, user.password)

        if (!match) {
            return res.status(400).send({
                status: false,
                message: 'password lama tidak sesuai'
            })
        }

        const hashedPassword = await bcrypt.hash(req.body.passwordBaru, 10)

        await pengguna.update(
            { password: hashedPassword },
            { where: { id: req.params.id } }
        )

        return res.status(200).send({
            status: true,
            message: 'Password berhasil diubah'
        })

    } catch (err) {
        return res.status(500).send({
            status: false,
            message: err.message
        })
    }
}