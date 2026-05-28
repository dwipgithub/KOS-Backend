import { rolePermissions } from '../config/Permissions.js'
import { pengguna, get, show } from '../models/Pengguna.js'
import paginationDB from '../config/PaginationDB.js'
import * as response from '../helpers/response.js'
import jsonWebToken from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import Joi from 'joi'

// ======================
// CREATE PENGGUNA
// ======================
export const createPengguna = async (req, res) => {
    const schema = Joi.object({
        nama: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        peran: Joi.string().valid('OWNER', 'ADMIN', 'OPERATOR').required()
    })

    const { error } = schema.validate(req.body)

    if (error) {
        return res.status(400).send({
            status: false,
            message: error.details[0].message
        })
    }

    try {
        // ======================
        // CEK EMAIL DUPLIKAT
        // ======================
        const existingUser = await pengguna.findOne({
            where: { email: req.body.email }
        })

        if (existingUser) {
            return res.status(400).send({
                status: false,
                message: 'Email sudah digunakan'
            })
        }

        // ======================
        // HASH PASSWORD
        // ======================
        const hashedPassword = await bcrypt.hash(req.body.password, 10)

        // ======================
        // CREATE USER
        // ======================
        const newUser = await pengguna.create({
            nama: req.body.nama,
            email: req.body.email,
            password: hashedPassword,
            peran: req.body.peran
        })

        // ======================
        // RESPONSE
        // ======================
        return res.status(201).send({
            status: true,
            message: 'Pengguna berhasil dibuat',
            data: {
                id: newUser.id,
                nama: newUser.nama,
                email: newUser.email,
                peran: newUser.peran
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
// GET PENGGUNA
// ======================

export const getPengguna = async (req, res) => {
    try {
        const results = await get(req)

        const paginationDBObject = new paginationDB(
            results.totalRowCount,
            results.page,
            results.limit,
            results.data
        )

        const pagination = paginationDBObject.getRemarkPagination()
        
        const message = results.data.length
            ? 'data found'
            : 'no data found'

        return response.success(
            res,
            results.data,
            message,
            pagination
        )
    } catch (err) {
        return response.error(res, err, 422)
    }
}

// ======================
// SHOW PENGGUNA
// ======================

export const showPengguna = async (req, res) => {
    try {
        const result = await show(req.params.id)

        if (!result) {
            return response.notFound(res)
        }

        return response.success(res, result, "data found")
    } catch (err) {
        return response.error(res, err)
    }
}

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
            attributes: ['id', 'nama', 'email', 'password', 'peran', 'properti_id'],
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
            peran: user.peran,
            properti_id: user.properti_id
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
            secure: true,
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
        passwordBaru: Joi.string().min(6).required(),
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
        // 🔥 ambil dari token, bukan params
        const userId = req.user.id

        const user = await pengguna.findOne({
            attributes: ['password'],
            where: { id: userId }
        })

        if (!user) {
            return res.status(404).send({
                status: false,
                message: 'User tidak ditemukan'
            })
        }

        // cek password lama
        const match = await bcrypt.compare(req.body.passwordLama, user.password)

        if (!match) {
            return res.status(400).send({
                status: false,
                message: 'Password lama tidak sesuai'
            })
        }

        // hash password baru
        const hashedPassword = await bcrypt.hash(req.body.passwordBaru, 10)

        await pengguna.update(
            { password: hashedPassword },
            { where: { id: userId } }
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