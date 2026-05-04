import express from "express"
import session from "express-session"
import {} from "dotenv/config"
import { database } from "./config/Database.js"
import router from "./routes/index.js"
import cookieParser from "cookie-parser"
import cors from "cors"

const app = express()

try {
    await database.authenticate()
    console.log('database connected...')
} catch (error) {
    console.log(error)
}

app.use(session({
    secret: 'c7936f-b388-4909-b26c-d07dbafdc7a7', 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true },
    name: 'connectV2.id'
}))

app.use(cors({
    credentials: true, 
    origin: [process.env.ORIGIN]}
))

app.use(cookieParser())
app.use(express.json())
app.use(router)

app.listen(5001, () => {
    console.log("server running at port 5001")
})