import {Router} from 'express'
import connection from '../config/database'
import syncConnection from '../config/syncDatabase'
import { decryptAPI, encryptAPI, encryptBD, decryptBD, validateToken } from '../utils/cipher'
import fs from 'fs'

import { uploadFile, deleteFile, listFiles, getFile } from '../utils/cloud'

const router = Router()

router.post('/deleteEmployee', (req, res) => {

    let id = decryptAPI(req.headers.id)
    let type = decryptAPI(req.headers.type)
    let token = decryptAPI(req.headers.token)
    let rfc = encryptBD(decryptAPI(req.headers.rfc))
    let password = encryptBD(decryptAPI(req.headers.password))

    let rfc_emp = encryptBD(decryptAPI(req.body.rfc))
		
	if(!validateToken(token)) {
        res.send({code: 402, data: {}})
        return
    }

    if(!id) {
        res.send({code: 302, data: {}})
        return
    }

    if(!rfc) {
        res.send({code: 302, data: {}})
        return
    }

    if(!password) {
        res.send({code: 302, data: {}})
        return
    }

    if(type != 1 && type != 2) {
        res.send({code: 303, data: {}})
        return
    }

    connection.query('SELECT * from empleado WHERE id_emp = ? AND id_tip = ? AND rfc_emp = ? AND pwd_emp = ?', [id, type, rfc, password], async (err, _results, field) => {

        if(err) {
            res.send({code: 401, data: {}})
            return
        }

        if(_results.length != 1) {
            res.send({code: 301, data: {}})
            return
        }

        connection.query('DELETE FROM empleado WHERE rfc_emp = ?', [rfc_emp], () => {

            if(err) {
                res.send({code: 401, data: {}})
                return
            }

            res.send({code: 201, data: {}})

        })

    })

})

router.post('/resetPassword', (req, res) => {

    let id = decryptAPI(req.headers.id)
    let type = decryptAPI(req.headers.type)
    let token = decryptAPI(req.headers.token)
    let rfc = encryptBD(decryptAPI(req.headers.rfc))
    let password = encryptBD(decryptAPI(req.headers.password))

    let rfc_emp = encryptBD(decryptAPI(req.body.rfc_emp))
		
	if(!validateToken(token)) {
        res.send({code: 402, data: {}})
        return
    }

    if(!id) {
        res.send({code: 302, data: {}})
        return
    }

    if(!rfc) {
        res.send({code: 302, data: {}})
        return
    }

    if(!password) {
        res.send({code: 302, data: {}})
        return
    }

    if(type != 1 && type != 2) {
        res.send({code: 303, data: {}})
        return
    }

    connection.query('SELECT * from empleado WHERE id_emp = ? AND id_tip = ? AND rfc_emp = ? AND pwd_emp = ?', [id, type, rfc, password], async (err, _results, field) => {

        if(err) {
            console.log(err)
            res.send({code: 401, data: {}})
            return
        }

        if(_results.length != 1) {
            res.send({code: 301, data: {}})
            return
        }

        connection.query('UPDATE empleado SET pwd_emp = ? WHERE rfc_emp = ?', [rfc_emp, rfc_emp], (err, results, field) => {

            if(err) {
                console.log(err)
                res.send({code: 401, data: {}})
                return
            }

            res.send({code: 201, data: {}})

        })

    })

})

router.post('/getEmployees', (req, res) => {

    let id = decryptAPI(req.headers.id)
    let type = decryptAPI(req.headers.type)
    let token = decryptAPI(req.headers.token)
    let rfc = encryptBD(decryptAPI(req.headers.rfc))
    let password = encryptBD(decryptAPI(req.headers.password))
		
	if(!validateToken(token)) {
        res.send({code: 402, data: {}})
        return
    }

    if(!id) {
        res.send({code: 302, data: {}})
        return
    }

    if(!rfc) {
        res.send({code: 302, data: {}})
        return
    }

    if(!password) {
        res.send({code: 302, data: {}})
        return
    }

    if(type != 1 && type != 2) {
        res.send({code: 303, data: {}})
        return
    }

    connection.query('SELECT * from empleado WHERE id_emp = ? AND id_tip = ? AND rfc_emp = ? AND pwd_emp = ?', [id, type, rfc, password], async (err, _results, field) => {

        if(err) {
            res.send({code: 401, data: {}})
            return
        }

        if(_results.length != 1) {
            res.send({code: 301, data: {}})
            return
        }

        connection.query('SELECT * FROM empleado', [], (err, results, fields) => {

            if(err) {
                res.send({code: 401, data: {}})
                return
            }

            let response = []

            results.forEach(element => {
              
                response.push({
                    name: encryptAPI(decryptBD(element.nom_emp)),
                    apat: encryptAPI(decryptBD(element.app_emp)),
                    amat: encryptAPI(decryptBD(element.apm_emp)),
                    rfc: encryptAPI(decryptBD(element.rfc_emp))
                })

            })

            res.send({code: 201, data: response})

        })

    })
    
})

router.post('/deleteReport', async (req, res) => {

    let id = decryptAPI(req.headers.id)
    let type = decryptAPI(req.headers.type)
    let token = decryptAPI(req.headers.token)
    let rfc = encryptBD(decryptAPI(req.headers.rfc))
    let password = encryptBD(decryptAPI(req.headers.password))

    let file = req.body.file
		
	if(!validateToken(token)) {
        res.send({code: 402, data: {}})
        return
    }

    if(!id) {
        res.send({code: 302, data: {}})
        return
    }

    if(!rfc) {
        res.send({code: 302, data: {}})
        return
    }

    if(!password) {
        res.send({code: 302, data: {}})
        return
    }

    if(type != 1) {
        res.send({code: 303, data: {}})
        return
    }

    connection.query('SELECT * from empleado WHERE id_emp = ? AND id_tip = ? AND rfc_emp = ? AND pwd_emp = ?', [id, type, rfc, password], async (err, _results, field) => {

        if(err) {
            res.send({code: 401, data: {}})
            return
        }

        if(_results.length != 1) {
            res.send({code: 301, data: {}})
            return
        }

        await deleteFile(file)
        await deleteFile(file.toString().replace('.json','.csv'))

        res.send({code: 201, data: {}})

    })

})

router.get('/downloadReport', (req, res) => {

    let id = decryptAPI(req.query.id.toString().replace(/\s/g,'+'))
    let type = decryptAPI(req.query.type.toString().replace(/\s/g,'+'))
    let token = decryptAPI(req.query.token.toString().replace(/\s/g,'+'))
    let rfc = encryptBD(decryptAPI(req.query.rfc.toString().replace(/\s/g,'+')))
    let password = encryptBD(decryptAPI(req.query.password.toString().replace(/\s/g,'+')))

    let file = decryptAPI(req.query.file.toString().replace(/\s/g,'+'))
		
	if(!validateToken(token)) {
        res.send(402)
        return
    }

    if(!id) {
        res.send(302)
        return
    }

    if(!rfc) {
        res.send(302)
        return
    }

    if(!password) {
        res.send(302)
        return
    }

    if(type != 1) {
        res.send(303)
        return
    }

    connection.query('SELECT * from empleado WHERE id_emp = ? AND id_tip = ? AND rfc_emp = ? AND pwd_emp = ?', [id, type, rfc, password], (err, _results, field) => {

        if(err) {
            res.send(401)
            return
        }

        if(_results.length != 1) {
            res.send(301)
            return
        }

        res.download((`src/files/reports/${file}`))

    })

})

router.post('/getReport', async (req, res) => {

    let id = decryptAPI(req.headers.id)
    let type = decryptAPI(req.headers.type)
    let token = decryptAPI(req.headers.token)
    let rfc = encryptBD(decryptAPI(req.headers.rfc))
    let password = encryptBD(decryptAPI(req.headers.password))

    let file = req.body.file
		
	if(!validateToken(token)) {
        res.send({ code: 402, data: {} })
        return
    }

    if(!id) {
        res.send({ code: 302, data: {} })
        return
    }

    if(!rfc) {
        res.send({ code: 302, data: {} })
        return
    }

    if(!password) {
        res.send({ code: 302, data: {} })
        return
    }

    if(type != 1) {
        res.send({ code: 303, data: {} })
        return
    }

    connection.query('SELECT * from empleado WHERE id_emp = ? AND id_tip = ? AND rfc_emp = ? AND pwd_emp = ?', [id, type, rfc, password], async (err, _results, field) => {

        if(err) {
            res.send({ code: 401, data: {} })
            return
        }

        if(_results.length != 1) {
            res.send({ code: 301, data: {} })
            return
        }

        let content = await getFile(file)

        res.send({
            code: 201,
            data: content["data"]
        })

    })

})

router.post('/getReportsName', async (req, res) => {

    let id = decryptAPI(req.headers.id)
    let type = decryptAPI(req.headers.type)
    let token = decryptAPI(req.headers.token)
    let rfc = encryptBD(decryptAPI(req.headers.rfc))
    let password = encryptBD(decryptAPI(req.headers.password))
		
	if(!validateToken(token)) {
        res.send({ code: 402, data: {} })
        return
    }

    if(!id) {
        res.send({ code: 302, data: {} })
        return
    }

    if(!rfc) {
        res.send({ code: 302, data: {} })
        return
    }

    if(!password) {
        res.send({ code: 302, data: {} })
        return
    }

    if(type != 1) {
        res.send({ code: 303, data: {} })
        return
    }

    connection.query('SELECT * from empleado NATURAL JOIN sucursal WHERE id_emp = ? AND id_tip = ? AND rfc_emp = ? AND pwd_emp = ?', [id, type, rfc, password], async (err, _results, field) => {

        if(err) {
            res.send({ code: 401, data: {} })
            return
        }

        if(_results.length != 1) {
            res.send({ code: 301, data: {} })
            return
        }

        let files = await listFiles()

        let filesResponse = []

        files.forEach(file => {
          
            if(file.name.split('.')[3] == 'json') {

                filesResponse.push({
                    file: file.name,
                    sucursal: file.name.split('___')[0],
                    date: file.name.split('___')[1].split('__')[0].replace(/\-/g, '\/'),
                    hour: file.name.split('___')[1].split('__')[1].split('json')[0].substring(0, 8).replace(/\./g,'\:')
                })

            }

        })

        res.send({
            code: 201,
            data: filesResponse
        })

    })

})

router.post('/getAccountStatus', (req, res) => {

    let id = decryptAPI(req.headers.id)
    let type = decryptAPI(req.headers.type)
    let token = decryptAPI(req.headers.token)
    let rfc = encryptBD(decryptAPI(req.headers.rfc))
    let password = encryptBD(decryptAPI(req.headers.password))

    let lapse = req.body.lapse
    let nom_suc = decryptAPI(req.body.nom_suc)
		
	if(!validateToken(token)) {
        res.send({ code: 402, data: {} })
        return
    }

    if(!id) {
        res.send({ code: 302, data: {} })
        return
    }

    if(!rfc) {
        res.send({ code: 302, data: {} })
        return
    }

    if(!password) {
        res.send({ code: 302, data: {} })
        return
    }

    if(type != 1) {
        res.send({ code: 303, data: {} })
        return
    }

    connection.query('SELECT * from empleado NATURAL JOIN sucursal WHERE id_emp = ? AND id_tip = ? AND rfc_emp = ? AND pwd_emp = ?', [id, type, rfc, password], (err, _results, field) => {

        if(err) {
            res.send({ code: 401, data: {} })
            return
        }

        if(_results.length != 1) {
            res.send({ code: 301, data: {} })
            return
        }

        let previousEntries = syncConnection.query('SELECT IFNULL(SUM(can_ing),0) AS sum FROM ingreso NATURAL JOIN sucursal WHERE nom_suc = ? AND fec_ing < DATE(SUBDATE(NOW(), INTERVAL ? DAY))', [nom_suc, parseInt(lapse)])
        let previousEgress = syncConnection.query('SELECT IFNULL(SUM(can_egr),0) AS sum FROM egreso NATURAL JOIN sucursal WHERE nom_suc = ? AND fec_egr < DATE(SUBDATE(NOW(), INTERVAL ? DAY))', [nom_suc, parseInt(lapse)])

        let entries = syncConnection.query('SELECT can_ing, fec_ing FROM ingreso NATURAL JOIN sucursal WHERE nom_suc = ? AND fec_ing BETWEEN DATE(SUBDATE(NOW(), INTERVAL ? DAY)) AND NOW()', [nom_suc, parseInt(lapse)])
        let egress = syncConnection.query('SELECT can_egr, fec_egr FROM egreso NATURAL JOIN sucursal WHERE nom_suc = ? AND fec_egr BETWEEN DATE(SUBDATE(NOW(), INTERVAL ? DAY)) AND NOW()', [nom_suc, parseInt(lapse)])

        let totalPrevious = previousEntries[0].sum - previousEgress[0].sum

        res.send({
            code: 201, 
            data: {
                previous: totalPrevious,
                entries: entries,
                egress: egress
            }
        })

    })

})

router.post('/registerEmployee', (req, res) => {

    let id = decryptAPI(req.headers.id)
    let type = decryptAPI(req.headers.type)
    let token = decryptAPI(req.headers.token)
    let rfc = encryptBD(decryptAPI(req.headers.rfc))
    let password = encryptBD(decryptAPI(req.headers.password))

    let name = encryptBD(decryptAPI(req.body.name))
    let apat = encryptBD(decryptAPI(req.body.apat))
    let amat = encryptBD(decryptAPI(req.body.amat))
    let rfcEmp = encryptBD(decryptAPI(req.body.rfcEmp))
    let typeEmp = decryptAPI(req.body.typeEmp)
    let nom_suc = decryptAPI(req.body.nom_suc)
		
	if(!validateToken(token)) {
        res.send({ code: 402, data: {} })
        return
    }

    if(!id) {
        res.send({ code: 302, data: {} })
        return
    }

    if(!rfc) {
        res.send({ code: 302, data: {} })
        return
    }

    if(!password) {
        res.send({ code: 302, data: {} })
        return
    }

    if(type != 1 && type!=2) {
        res.send({ code: 303, data: {} })
        return
    }

    connection.query('SELECT * from empleado NATURAL JOIN SUCURSAL WHERE id_emp = ? AND id_tip = ? AND rfc_emp = ? AND pwd_emp = ?', [id, type, rfc, password], (err, _results, field) => {

        if(err) {
            console.log(err)
            res.send({ code: 401, data: {} })
            return
        }

        if(_results.length != 1) {
            res.send({ code: 301, data: {} })
            return
        }

        connection.query('INSERT INTO empleado (nom_emp, app_emp, apm_emp, rfc_emp, pwd_emp, id_tip, id_suc) VALUES (?,?,?,?,?,?,(SELECT id_suc FROM sucursal WHERE nom_suc = ?))', [name, apat, amat, rfcEmp, rfcEmp, typeEmp, nom_suc], (err, results, fields) => {

            if(err) {
                console.log(err)
                res.send({ code: 401, data: {} })
                return
            }

            res.send({ code: 201, data: {} })

        })

    })

})

router.post('/registerSucursal', (req, res) => {

    let id = decryptAPI(req.headers.id)
    let type = decryptAPI(req.headers.type)
    let token = decryptAPI(req.headers.token)
    let rfc = encryptBD(decryptAPI(req.headers.rfc))
    let password = encryptBD(decryptAPI(req.headers.password))

    let name = decryptAPI(req.body.name)
    let dom = decryptAPI(req.body.dom)
		
	if(!validateToken(token)) {
        res.send({ code: 402, data: {} })
        return
    }

    if(!id) {
        res.send({ code: 302, data: {} })
        return
    }

    if(!rfc) {
        res.send({ code: 302, data: {} })
        return
    }

    if(!password) {
        res.send({ code: 302, data: {} })
        return
    }

    if(type != 1 && type!=2) {
        res.send({ code: 303, data: {} })
        return
    }

    connection.query('SELECT * from empleado NATURAL JOIN sucursal WHERE id_emp = ? AND id_tip = ? AND rfc_emp = ? AND pwd_emp = ?', [id, type, rfc, password], (err, _results, field) => {

        if(err) {
            console.log(err)
            res.send({ code: 401, data: {} })
            return
        }

        if(_results.length != 1) {
            res.send({ code: 301, data: {} })
            return
        }

        connection.query('INSERT INTO sucursal (nom_suc, dom_suc) VALUES (?,?)', [name, dom], (err, results, fields) => {

            if(err) {
                console.log(err)
                res.send({ code: 401, data: {} })
                return
            }

            res.send({ code: 201, data: {} })

        })

    })

})

module.exports = router