import {Router} from 'express'
import connection from '../config/database'
import { decryptAPI, encryptAPI, encryptBD, decryptBD, generateToken } from '../utils/cipher'

const router = Router()

router.get('/', (req, res) => {
    res.send('')
})

router.post('/loginUser', async (req, res) => {
    	
    let rfc = encryptBD(decryptAPI(req.body.rfc))
    let pwd = encryptBD(decryptAPI(req.body.password))

     // connection.query("INSERT INTO sucursal (nom_suc, dom_suc, tot_suc) VALUES ('Sucursal 1', 'Domicilio 1', 999999)")

     //connection.query("INSERT INTO empleado (nom_emp, app_emp, apm_emp, rfc_emp, pwd_emp, id_tip, id_suc) values (?,?,?,?,?,?,?)", [
     //    encryptBD("Mauricio"), encryptBD("Alvarado"), encryptBD("Lopez"), encryptBD("AALM020115"), encryptBD("AALM020115"), 4, 1
     //])

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

module.exports = router