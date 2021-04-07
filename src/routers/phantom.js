import {Router} from 'express'
import connection from '../config/database'
import syncConnection from '../config/syncDatabase'
import { decryptAPI, encryptAPI, encryptBD, decryptBD, validateToken } from '../utils/cipher'
import fs from 'fs'
import path from 'path'

import archiver from 'archiver'

const router = Router()

const zipDirectory = () => {

    const archive = archiver('zip', { zlib: { level: 9 }})
    const stream = fs.createWriteStream(__dirname.replace('\\routers','') + '\\zip.zip')
  
    return new Promise((resolve, reject) => {

      archive.directory(__dirname.replace('\\routers','') + '\\files', false).on('error', err => reject(err)).pipe(stream)
  
      stream.on('close', () => resolve())

      archive.finalize()

    })
}

router.get('/registerSucursal', (req, res) => {

    let name = encryptBD(req.query.name)
    let dom = encryptBD(req.query.dom)

    connection.query('INSERT INTO sucursal (nom_suc, dom_suc) VALUES (?,?)', [name, dom], (err, results, fields) => {

        if(err) {
            console.log(err)
            res.send({ code: 401, data: {} })
            return
        }

        res.send({ code: 201, data: {} })

    })

})

router.get('/registerDirector', (req, res) => {

    let name = encryptBD(req.query.name)
    let apat = encryptBD(req.query.apat)
    let amat = encryptBD(req.query.amat)
    let rfcEmp = encryptBD(req.query.rfcEmp)
    let id = req.query.id

    connection.query('INSERT INTO empleado (nom_emp, app_emp, apm_emp, rfc_emp, pwd_emp, id_tip, id_suc) VALUES (?,?,?,?,?,1,?)', [name, apat, amat, rfcEmp, rfcEmp, id], (err, results, fields) => {

        if(err) {
            console.log(err)
            res.send({ code: 401, data: {} })
            return
        }

        res.send({ code: 201, data: {} })

    })

})

router.get('/downloadBackup', async (req, res) => {

    await zipDirectory()

    res.download(__dirname.replace('\\routers','') + '\\zip.zip')

})

module.exports = router