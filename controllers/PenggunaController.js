import { pengguna } from '../models/PenggunaModel.js'
import bcrypt from 'bcrypt'
import jsonWebToken from 'jsonwebtoken'
import Joi from 'joi'
import { Sequelize } from "sequelize";
const Op = Sequelize.Op

export const login = async (req, res) => {
    const schema = Joi.object({
        email: Joi.string()
            .required(),
        password: Joi.string()
            .required(),
    })

    const { error, value } =  schema.validate(req.body)
    
    if (error) {
        res.status(404).send({
            status: false,
            message: error.details[0].message
        })
        return
    }

    pengguna.findAll({
        attributes: ['id','nama','email','password','id_peran'],
        where: {
            email: req.body.email
        }
    })
    .then((results) => {
        if (!results.length) {
            res.status(404).send({
                status: false,
                message: 'email not found'
            })
            return
        }
        bcrypt.compare(req.body.password, results[0].password, (error, compareResult) => {
            if (compareResult == false) {
                res.status(404).send({
                    status: false,
                    message: 'wrong password'
                })
                return
            }

            const payloadObject = {
                id: results[0].id,
                nama: results[0].nama,
                email: results[0].email,
                id_peran: results[0].id_peran
            }

            const payloadObjectRefreshToken = {
                id: results[0].id
            }

            const accessToken = jsonWebToken.sign(payloadObject, process.env.ACCESS_TOKEN_SECRET, {expiresIn: process.env.ACCESS_TOKEN_EXPIRESIN})
            jsonWebToken.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, result) => {
                const refreshToken = jsonWebToken.sign(payloadObjectRefreshToken, process.env.REFRESH_TOKEN_SECRET, {expiresIn: process.env.REFRESH_TOKEN_EXPIRESIN})
                pengguna.update({refresh_token: refreshToken},{
                    where: {
                        id: results[0].id
                    }
                })
                .then(() => {
                    res.cookie('refreshToken', refreshToken, {
                        httpOnly: true,
                        sameSite: 'Strict',
                        secure: false, 
                        maxAge: 6 * 60 * 60 * 1000
                    })

                    // const csrfToken = crypto.randomUUID()

                    // res.cookie('XSRF-TOKEN', csrfToken, {
                    //     httpOnly: true,
                    //     sameSite: 'Strict', // atau 'Lax' tergantung kebutuhan
                    //     secure: true
                    // });

                    res.status(201).send({
                        status: true,
                        message: "access token created",
                        data: {
                            name: results[0].nama,
                            access_token: accessToken
                        }
                    })
                })
                .catch((err) => {
                    res.status(404).send({
                        status: false,
                        message: err
                    })
                    return
                })
            })
        })
    })
    .catch((err) => {
        res.status(404).send({
            status: false,
            message: err
        })
        return
    })
}

export const logout = (req, res) => {
    const refreshToken = req.cookies.refreshToken
    if(!refreshToken) {
        res.status(200).send({
            status: false,
            message: 'Unauthorized'
        })
        return
    }

    pengguna.findAll({
        where: {
            refresh_token: refreshToken
        }
    })
    .then((results) => {
        pengguna.update({refresh_token: null},{
            where: {
                id: results[0].id
            }
        })
        .then((resultsUpdate) => {
            res.clearCookie('refreshToken')
            res.status(200).send({
                status: true,
                message: resultsUpdate
            })
        })
    })
    .catch((err) => {
        res.status(404).send({
            status: false,
            message: err
        })
        return
    })

}

export const changePassword = async (req, res) => {
    const schema = Joi.object({
        passwordLama: Joi.string()
            .required(),
        passwordBaru: Joi.string()
            .required(),
        passwordBaruConfirmation: Joi.string()
            .required().valid(Joi.ref('passwordBaru'))
    })

    const { error, value } =  schema.validate(req.body)
    
    if (error) {
        res.status(404).send({
            status: false,
            message: error.details[0].message
        })
        return
    }

    try {
        const passwordLama = await pengguna.findOne({
            attributes: ['password'],
            where: {
                id: req.params.id
            }
        })

        const compareResult = await bcrypt.compare(req.body.passwordLama, passwordLama.dataValues.password)
        if (!compareResult) {
            res.status(404).json({
                status: false,
                message: 'password lama tidak sesuai'
            })
            return
        }

        const saltRound = 10
        const plainPassword = req.body.passwordBaru
        const password = await bcrypt.hash(plainPassword, saltRound)
        const update = await pengguna.update(
            {
                password: password
            },
            {
                where: {
                    id: req.params.id
                }
            }
        )
        res.status(200).json({
            status: true,
            message: update
        })
    } catch (error) {
        console.log(error.message);
    }
}