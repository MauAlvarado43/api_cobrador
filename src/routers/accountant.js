import {Router} from 'express'
import syncConnection from '../config/syncDatabase'
import connection from '../config/database'
import { decryptAPI, encryptAPI, encryptBD, decryptBD, validateToken } from '../utils/cipher'
import fs from 'fs'

import { uploadFile } from '../utils/cloud'

const router = Router()

router.post('/generateReportLendings', async (req, res) => {

    let id = decryptAPI(req.headers.id)
    let type = decryptAPI(req.headers.type)
    let token = decryptAPI(req.headers.token)
    let rfc = encryptBD(decryptAPI(req.headers.rfc))
    let password = encryptBD(decryptAPI(req.headers.password))

    let lapse = decryptAPI(req.body.lapse)
    let sucursal = decryptAPI(req.body.nom_suc)
    let save = req.body.save
		
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

    if(type != 2 && type!=1) {
        res.send({ code: 303, data: {} })
        return
    }

    connection.query('SELECT * FROM empleado NATURAL JOIN sucursal WHERE id_emp = ? AND id_tip = ? AND rfc_emp = ? AND pwd_emp = ?', [id, type, rfc, password], async (err, _results, field) => {
        
        if(err) {
            res.send({ code: 401, data: {} })
            return
        }

        if(_results.length != 1) {
            res.send({ code: 301, data: {} })
            return
        }

        let report = []
        let response = []
        let clients = syncConnection.query('SELECT id_pre, can_pre, DATE(fec_pre) as fec_pre, tfec_pre, nom_cli, app_cli, apm_cli FROM prestamo NATURAL JOIN cliente NATURAL JOIN sucursal WHERE est_pre = 0 AND nom_suc = ?;', [sucursal])
    
        clients.forEach(client => {
    
            let reportElement = []
            let sum = syncConnection.query('SELECT IFNULL(SUM(can_pag), 0) AS sum FROM pago WHERE id_pre = ?', [client.id_pre])
            let payments = syncConnection.query(`SELECT IFNULL(DATE(fec_pag), DATE(cal.date)) AS fec_pag, IFNULL(can_pag,0) AS can_pag
            FROM (
                  SELECT NOW() - INTERVAL xc DAY AS date
                  FROM (
                        SELECT @xi:=@xi+1 as xc from
                        (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) xc1,
                        (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) xc2,
                        (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) xc3,
                        (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) xc4,
                        (SELECT @xi:=-1) xc0
                  ) AS xxc1
            ) AS cal
            LEFT JOIN (SELECT * FROM pago WHERE id_pre = ?) AS a ON DATE(fec_pag) = DATE(cal.date)
            WHERE cal.date >= SUBDATE(NOW(), INTERVAL ? DAY) AND cal.date < ADDDATE(NOW(), INTERVAL 1 DAY)
            ORDER BY cal.date ASC;`, [client.id_pre, parseInt(lapse)])
    
            payments.forEach(payment => {
    
                if(payment.fec_pag < client.fec_pre) 
                    reportElement.push({
                        date: payment.fec_pag,
                        can_pag: -2
                    })
                else if(payment.fec_pag == client.fec_pre) 
                    reportElement.push({
                        date: payment.fec_pag,
                        can_pag: -1
                    })
                else if(payment.fec_pag > client.fec_pre) 
                    reportElement.push({
                        date: payment.fec_pag,
                        can_pag: payment.can_pag
                    }) 
                
            })
    
            report.push({
                fec_pre: client.fec_pre,
                tfec_pre: client.tfec_pre,
                can_pre: client.can_pre,
                tot_pag: sum[0].sum,
                left: Math.round(((new Date()) - new Date(client.fec_pre))/(1000*60*60*24)),
                name: decryptBD(client.nom_cli) + ' ' + decryptBD(client.app_cli) + ' ' + decryptBD(client.apm_cli),
                payments: reportElement
            })
    
            response.push({
                fec_pre: client.fec_pre,
                tfec_pre: client.tfec_pre,
                can_pre: client.can_pre,
                tot_pag: sum[0].sum,
                left: Math.round(((new Date()) - new Date(client.fec_pre))/(1000*60*60*24)),
                name: encryptAPI(decryptBD(client.nom_cli) + ' ' + decryptBD(client.app_cli) + ' ' + decryptBD(client.apm_cli)),
                payments: reportElement
            })
    
        })
    
        res.send({
            code: 201,
            data: response
        })

        let str = ''

        if(save == "true") {
            for(let i = 0; i < report.length + 1; i++) {

                for(let j = 0; j < parseInt(lapse) + 8; j++) {

                    if(i == 0) {
                        if(j == 0) {
                            str += 'Cliente' +','
                        }
                        else if(j == 1) {
                            str += 'Fecha de inicio' +','
                        }
                        else if(j == 2) {
                            str += 'Fecha de termino' +','
                        }
                        else if(j == 3) {
                            str += 'Monto' +','
                        }
                        else if(j == 4) {
                            str += 'Cuota' + ','
                        }
                        else if(j == 5) {
                            str += 'Total pagado' + ','
                        }
                        else if(j == 6) {
                            str += 'Dias restantes' + ','
                        }
                        else {
                            str += report[0]["payments"][j - 7]["date"].toString().split("T")[0] + ','
                        }
                    }
                    else {
                        if(j == 0) {
                            str += report[i - 1]["name"] + ','
                        }
                        else if(j == 1) {
                            str += report[i - 1]["fec_pre"].split('T')[0] + ','
                        }
                        else if(j == 2) {
                            str += report[i - 1]["tfec_pre"].split('T')[0] + ','
                        }
                        else if(j == 3) {
                            str += report[i - 1]["can_pre"] + ','
                        }
                        else if(j == 4) {
                            str += (parseFloat(report[i - 1]["can_pre"] * 0.20)) + ','
                        }
                        else if(j == 5) {
                            str += report[i - 1]["tot_pag"] + ','
                        }
                        else if(j == 6) {
                            str += report[i - 1]["left"] + ','
                        }
                        else {
                            if(report[i - 1]["payments"][j - 7]["can_pag"] == -2) {
                                str += ','
                            }
                            else if(report[i - 1]["payments"][j - 7]["can_pag"] == -1) {
                                str += '*,'
                            }
                            else {
                                str += report[i - 1]["payments"][j - 7]["can_pag"] + ','
                            }
                        }
                    }
                }
                str += '\n'
            }

            let jsonName = `src/files/reports/${sucursal}___${new Date().toLocaleString().replace(/\//g, '_').replace(/\:/g,'.').replace(' ','__')}.json`
            let csvName = `src/files/reports/${sucursal}___${new Date().toLocaleString().replace(/\//g, '_').replace(/\:/g,'.').replace(' ','__')}.csv`

            fs.writeFileSync(jsonName, JSON.stringify({data: response}), 'utf-8')
            fs.writeFileSync(csvName, str, 'utf-8')

            await uploadFile(jsonName)
            await uploadFile(csvName)

        }
        
    })

})

router.post('/getSucursals', (req, res) => {

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

    if(type != 2 && type!=1) {
        res.send({ code: 303, data: {} })
        return
    }

    connection.query('SELECT * from empleado WHERE id_emp = ? AND id_tip = ? AND rfc_emp = ? AND pwd_emp = ?', [id, type, rfc, password], (err, _results, field) => {

        if(err) {
            res.send({ code: 401, data: {} })
            return
        }

        if(_results.length != 1) {
            res.send({ code: 301, data: {} })
            return
        }

        connection.query('SELECT * FROM sucursal ', [], (err, results, fields) => {

            if(err) {
                res.send({ code: 401, data: {} })
                return
            }

            let response = []

            results.forEach(element => {
              
                response.push({
                    name: encryptAPI(element.nom_suc)
                })

            })

            res.send({ 
                code: 201, 
                data: response
            })

        })

    })

})

router.post('/getEntriesEgress', (req, res) => {

    let id = decryptAPI(req.headers.id)
    let type = decryptAPI(req.headers.type)
    let token = decryptAPI(req.headers.token)
    let rfc = encryptBD(decryptAPI(req.headers.rfc))
    let password = encryptBD(decryptAPI(req.headers.password))

    let sucursal = decryptAPI(req.body.nom_suc)
		
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

    if(type != 2 && type!=1) {
        res.send({ code: 303, data: {} })
        return
    }

    connection.query('SELECT * from empleado WHERE id_emp = ? AND id_tip = ? AND rfc_emp = ? AND pwd_emp = ?', [id, type, rfc, password], (err, _results, field) => {

        if(err) {
            res.send({ code: 401, data: {} })
            return
        }

        if(_results.length != 1) {
            res.send({ code: 301, data: {} })
            return
        }

        connection.query('SELECT can_ing, fec_ing FROM ingreso NATURAL JOIN sucursal WHERE nom_suc = ? AND fec_ing BETWEEN DATE(NOW()) AND NOW()', [sucursal], (err, entries, fields) => {

            if(err) {
                res.send({ code: 401, data: {} })
                return
            }

            connection.query('SELECT can_egr, fec_egr FROM egreso NATURAL JOIN sucursal WHERE nom_suc = ? AND fec_egr BETWEEN DATE(NOW()) AND NOW()', [sucursal], (err, egress, fields) => {

                if(err) {
                    res.send({ code: 401, data: {} })
                    return
                }

                res.send({
                    code: 201,
                    data: {
                        entries: entries,
                        egress: egress
                    }
                })

            })

        })

    })

})

router.post('/getPaymentsSucursal', (req, res) => {

    let id = decryptAPI(req.headers.id)
    let type = decryptAPI(req.headers.type)
    let token = decryptAPI(req.headers.token)
    let rfc = encryptBD(decryptAPI(req.headers.rfc))
    let password = encryptBD(decryptAPI(req.headers.password))

    let sucursal = decryptAPI(req.body.nom_suc)
		
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

    if(type != 2 && type!=1) {
        res.send({ code: 303, data: {} })
        return
    }

    connection.query('SELECT * from empleado WHERE id_emp = ? AND id_tip = ? AND rfc_emp = ? AND pwd_emp = ?', [id, type, rfc, password], (err, _results, field) => {

        if(err) {
            res.send({ code: 401, data: {} })
            return
        }

        if(_results.length != 1) {
            res.send({ code: 301, data: {} })
            return
        }

        connection.query('SELECT * FROM pago NATURAL JOIN prestamo NATURAL JOIN cliente NATURAL JOIN sucursal WHERE fec_pag BETWEEN DATE(NOW()) AND NOW() AND nom_suc = ?', [sucursal], (err, results, fields) => {

            if(err) {
                res.send({ code: 401, data: {} })
                return
            }

            let response = []

            results.forEach(element => {
                response.push({
                    can_pag: element.can_pag,
                    fec_pag: element.fec_pag,
                    name: encryptAPI(decryptBD(element.nom_cli) + ' ' + decryptBD(element.app_cli))
                })
            });

            res.send({ 
                code: 201, 
                data: response
            })

        })

    })

})

module.exports = router