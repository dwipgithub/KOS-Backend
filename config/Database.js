import dotenv from 'dotenv'
import { Sequelize } from "sequelize"

dotenv.config()

export const database = new Sequelize(process.env.DB_DATABASE, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: "mysql",
    define: {
        freezeTableName: true,
        timestamps: false
    },
    dialectOptions: {
        // useUTC: false
	connectTimeout: 60000
    },
    timezone: '+07:00', //for writing to database
    logging: true,
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
})
