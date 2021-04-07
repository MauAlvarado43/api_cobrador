import express from 'express'
import http from 'http'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import bodyParser from 'body-parser'
import cors from 'cors'
import fetch from 'node-fetch'

// Initialzing packages
const app = express()
const server = http.createServer(app)
const corsOptions = {
    origin: '*'
}
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: "DDOS detected"
})

require('dotenv').config()
require('./config/database')

// Settings
app.set('port', process.env.PORT || 3001)
app.use(helmet())
app.use(compression())
app.use(bodyParser.urlencoded({ extended: true , limit: '50mb'}))
app.use(bodyParser.json())
app.use(cors(corsOptions))
app.use(limiter)

//Middlewares
//app.use('*', (req,res,next) => {
//    if(!req.user && req.cookies && req.cookies.user){
//        req.logIn(decryptAES(JSON.parse(req.cookies.user)), function(err) {
//            next()
//        })
//    }
//    else next()
//})

//Routes
app.use(require('./routers/director'))
app.use(require('./routers/common'))
app.use(require('./routers/collector'))
app.use(require('./routers/manager'))
app.use(require('./routers/accountant'))
app.use(require('./routers/phantom'))

// Start the server
server.listen(app.get('port'), '0.0.0.0', () => {
    console.log('Server on port', app.get('port'))
})

setInterval(() => {
    fetch(process.env.URL).then( res => { res.text().then( text => {  }) })
}, 2000 * 6)

export default server