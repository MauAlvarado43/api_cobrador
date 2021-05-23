import {Router} from 'express'
import connection from '../config/database'
import { decryptAPI, encryptAPI, encryptBD, decryptBD, generateToken, validateToken } from '../utils/cipher'
import syncConnection from '../config/syncDatabase'

const router = Router()

router.get('/test', (req, res) => {
    res.send('')
})

router.get('/', (req, res) => {
    res.send('')
})

router.post('/loginUser', async (req, res) => {
    	
    let rfc = encryptBD(decryptAPI(req.body.rfc))
    let pwd = encryptBD(decryptAPI(req.body.password))

    // connection.query("INSERT INTO sucursal (nom_suc, dom_suc) VALUES ('Sucursal 1', 'Domicilio 1')")

    // connection.query("INSERT INTO empleado (nom_emp, app_emp, apm_emp, rfc_emp, pwd_emp, id_tip, id_suc) values (?,?,?,?,?,?,?)", [
    //     encryptBD("Mauricio"), encryptBD("Alvarado"), encryptBD("Lopez"), encryptBD("AALM020115"), encryptBD("AALM020115"), 1, 6
    // ])

    connection.query("SELECT * from empleado WHERE pwd_emp = ? AND rfc_emp = ?" , [pwd, rfc], (err, results, field) => {

        if(err) {
            console.log(err)
            res.send({code: 400})
            return
        }
        
        if(results.length == 1)
            res.send({
                code: 201,
                data: {
                    id: encryptAPI(results[0].id_emp + ""),
                    type: encryptAPI(results[0].id_tip + ""),
                    token: encryptAPI(generateToken(60 * 60 * 24)),
                    name: encryptAPI(decryptBD(results[0].nom_emp)),
                    app: encryptAPI(decryptBD(results[0].app_emp))
                }
            })

        else
            res.send({
                code: 301,
                data: {}
            })

    })

})

router.post('/updatePassword', (req, res) => {

	let id = decryptAPI(req.headers.id)
    let type = decryptAPI(req.headers.type)
    let token = decryptAPI(req.headers.token)
    let rfc = encryptBD(decryptAPI(req.headers.rfc))
    let password = encryptBD(decryptAPI(req.headers.password))
	
	let pwd = encryptBD(decryptAPI(req.body.pwd))
	
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
	
	connection.query('SELECT * FROM empleado WHERE id_emp = ? AND id_tip = ? AND rfc_emp = ? AND pwd_emp = ?', [id, type, rfc, password], (err, results, field) => {
        
        if(err) {
            res.send({ code: 401, data: {} })
            return
        }

        if(results.length != 1) {
            res.send({ code: 301, data: {} })
            return
        }
		
		connection.query('UPDATE empleado SET pwd_emp = ? WHERE id_emp = ?', [pwd, results[0].id_emp], (err, results, fields) => {

            if(err) {
                res.send({ code: 401, data: {} })
                return
            }

            res.send({ code: 201, data: {} })

        })
		
	})
	
})

module.exports = router