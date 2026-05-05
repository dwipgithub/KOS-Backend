import { database } from '../config/Database.js'
import { DataTypes } from 'sequelize'

export const pemilik = database.define('pemilik', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nama: DataTypes.STRING,
    no_telp: DataTypes.STRING,
    email: DataTypes.STRING
}, {
    tableName: 'pemilik',
    timestamps: false
})

// helper ambil 1 data
export const getPemilik = async () => {
    return await pemilik.findOne()
}