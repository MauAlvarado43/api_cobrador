import {Router} from 'express'
import connection from '../config/database'
import syncConnection from '../config/syncDatabase'
import { decryptAPI, encryptAPI, encryptBD, decryptBD, validateToken } from '../utils/cipher'
import fs from 'fs'

import { uploadFile } from '../utils/cloud'

const router = Router()

router.post('/registerClient', async (req,res) => {
		
	let password = encryptBD(decryptAPI(req.headers.password))
	let rfc = encryptBD(decryptAPI(req.headers.rfc))
	let id = decryptAPI(req.headers.id)
	let type = decryptAPI(req.headers.type)
	let token = decryptAPI(req.headers.token)
	
	let name = decryptAPI(req.body.name)
	let apat = decryptAPI(req.body.apat)
	let amat = decryptAPI(req.body.amat)
	let curp = decryptAPI(req.body.curp)
	let tel = decryptAPI(req.body.tel)
	let cel = decryptAPI(req.body.cel)
	let est = decryptAPI(req.body.est)
	let mun = decryptAPI(req.body.mun)
	let col = decryptAPI(req.body.col)
	let st = decryptAPI(req.body.st)
	let cp = decryptAPI(req.body.cp)
	let ext = decryptAPI(req.body.ext)
	let _int = decryptAPI(req.body.int)
	let client = decryptAPI(req.body.client).replace(/^data:image\/png;base64,/, "")
	let cdom = decryptAPI(req.body.cdom).replace(/^data:image\/png;base64,/, "")
	let ine = decryptAPI(req.body.ine).replace(/^data:image\/png;base64,/, "")

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

    if(type != 3) {
        res.send({ code: 303, data: {} })
        return
    }

    connection.query('SELECT * FROM empleado WHERE id_emp = ? AND id_tip = ? AND rfc_emp = ? AND pwd_emp = ?', [id, type, rfc, password], async (err, results, field) => {
        
        if(err) {
            res.send({ code: 401, data: {} })
            return
        }

        if(results.length != 1) {
            res.send({ code: 301, data: {} })
            return
		}
		
		try {

			fs.writeFileSync(`src/files/client/${curp}_client.png`, client, 'base64')
			fs.writeFileSync(`src/files/document/${curp}_dom.png`, cdom, 'base64')
			fs.writeFileSync(`src/files/ine/${curp}_ine.png`, ine, 'base64')

			await uploadFile(`src/files/client/${curp}_client.png`)
			await uploadFile(`src/files/document/${curp}_dom.png`)
			await uploadFile(`src/files/ine/${curp}_ine.png`)

			connection.query('INSERT INTO cliente (nom_cli, app_cli, apm_cli, curp_cli, tel_cli, cel_cli, est_cli, mun_cli, col_cli, st_cli, cp_cli, ext_cli, int_cli, fot_cli, cdom_cli, ine_cli, id_tip) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 5)', [
			encryptBD(name), encryptBD(apat), encryptBD(amat), encryptBD(curp), encryptBD(tel), encryptBD(cel), encryptBD(est), encryptBD(mun), encryptBD(col),encryptBD(st), encryptBD(cp),
			encryptBD(ext), encryptBD(_int), encryptBD(`${process.env.BUCKET_URL}/${curp}_client.png`), encryptBD(`${process.env.BUCKET_URL}/${curp}_dom.png`), encryptBD(`${process.env.BUCKET_URL}/${curp}_ine.png`)], (err, results, field) => {
				
				if(err) {
					console.log(err)
					res.send({ code: 401, data: {} })
					return
				}
				
				res.send({ code: 201, data: {} })
				
			})

		} catch (err) {

			console.log(err)
			res.send({ code: 307, data: {} })
			return

		}

    })
	
})

router.post('/responseLending', (req, res) => {
	
	let id = decryptAPI(req.headers.id)
    let type = decryptAPI(req.headers.type)
    let token = decryptAPI(req.headers.token)
    let rfc = encryptBD(decryptAPI(req.headers.rfc))
    let password = encryptBD(decryptAPI(req.headers.password))

    let curp = encryptBD(decryptAPI(req.body.curp))
	let accept = req.body.accept
	
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
	
    if(!type || type == 4) {
        res.send({ code: 303, data: {} })
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
		
		connection.query('SELECT * FROM prestamo NATURAL JOIN cliente WHERE curp_cli = ? AND est_pre = 1', [curp], (err, results, fields) => {
	
			if(err) {
				res.send({ code: 401, data: {} })
				return
			}
			
			if(results.length == 1) {
				
				if(accept) {
					connection.query('UPDATE prestamo SET est_pre = 0, fec_pre = ?, tfec_pre = ? WHERE id_pre = ?', [new Date(), new Date(new Date().getTime() + (15 * 60 * 60 * 24 * 1000)), results[0].id_pre], (err, results, fields) => {
						
						if(err) {
							res.send({ code: 401, data: {} })
							return
						}
						
						res.send({ code: 201, data: {} })
						
					})
				}
				else {
					connection.query('UPDATE prestamo SET est_pre = 2 WHERE id_pre = ?', [results[0].id_pre], (err, results, fields) => {
						
						if(err) {
							res.send({ code: 401, data: {} })
							return
						}
						
						res.send({ code: 201, data: {} })
						
					})
				}				
			}
			else {
				
				connection.query('SELECT * FROM prestamo NATURAL JOIN cliente WHERE curp_cli = ? AND est_pre = 4', [curp], (err, results, fields) => {
					
					if(err) {
						res.send({ code: 401, data: {} })
						return
					}
					
					if(results.length == 1) {
										
						res.send({})
						
					}
					else {
						res.send({})
					}
					
				})
				
			}
			
		})
		
	})
	
})

router.post('/responseRennovation', (req, res) => {

	let id = decryptAPI(req.headers.id)
    let type = decryptAPI(req.headers.type)
    let token = decryptAPI(req.headers.token)
    let rfc = encryptBD(decryptAPI(req.headers.rfc))
    let password = encryptBD(decryptAPI(req.headers.password))

	let curp = encryptBD(decryptAPI(req.body.curp))
	let response = req.body.response

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
	
    if(type != 4 && type!=3) {
        res.send({ code: 303, data: {} })
        return
	}
	
	connection.query('SELECT * FROM empleado WHERE id_emp = ? AND id_tip = ? AND rfc_emp = ? AND pwd_emp = ?', [id, type, rfc, password], (err, results, field) => {
        		
        if(err) {
			console.log(err)
            res.send({ code: 401, data: {} })
            return
        }

        if(results.length != 1) {
            res.send({ code: 301, data: {} })
            return
		}
		
		connection.query('SELECT * FROM prestamo NATURAL JOIN cliente WHERE curp_cli = ? AND est_pre != 0  AND est_pre != 1 AND est_pre != 2 AND est_pre != 3', [curp], (err, results, fields) => {
			
			if(err) {
				console.log(err)
				res.send({ code: 401, data: {} })
				return
			}

			if(response) {

				connection.query('UPDATE prestamo SET tfec_pre = DATE_ADD(?, INTERVAL ? DAY), est_pre = 0, tre_pre = 0, mre_pre = "" WHERE id_pre = ?', [results[0].tfec_pre, results[0].tre_pre, results[0].id_pre], (err, results, fields) => {
					
					if(err) {
						console.log(err)
						res.send({ code: 401, data: {} })
						return
					}

					res.send({ code: 201, data: {} })

				})


			}
			else {

				connection.query('UPDATE prestamo SET est_pre = 0, tre_pre = 0, mre_pre = "" WHERE id_pre = ?',[results[0].id_pre], (err, results, fields) => {
					
					if(err) {
						console.log(err)
						res.send({ code: 401, data: {} })
						return
					}

					res.send({ code: 201, data: {} })

				})

			}

		})
		
	})

})

router.post('/getClientLendingRennovation', (req, res) => {

	let id = decryptAPI(req.headers.id)
    let type = decryptAPI(req.headers.type)
    let token = decryptAPI(req.headers.token)
    let rfc = encryptBD(decryptAPI(req.headers.rfc))
    let password = encryptBD(decryptAPI(req.headers.password))

    let curp = encryptBD(decryptAPI(req.body.curp))
		
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
	
    if(type != 4 && type!=3) {
        res.send({ code: 303, data: {} })
        return
    }

	connection.query('SELECT * FROM empleado WHERE id_emp = ? AND id_tip = ? AND rfc_emp = ? AND pwd_emp = ?', [id, type, rfc, password], (err, results, field) => {
        		
        if(err) {
			console.log(err)
            res.send({ code: 401, data: {} })
            return
        }

        if(results.length != 1) {
            res.send({ code: 301, data: {} })
            return
		}
		
		connection.query('SELECT * FROM prestamo NATURAL JOIN cliente WHERE curp_cli = ? AND est_pre != 0  AND est_pre != 1 AND est_pre != 2 AND est_pre != 3', [curp], (err, results, fields) => {
		
			if(err) {
				console.log(err)
				res.send({ code: 401, data: {} })
				return
			}
			
			if(results.length == 1) {
				
				connection.query('SELECT * FROM pago NATURAL JOIN prestamo WHERE id_pre = ?', [results[0].id_pre], (err, _results, fields) => {
										
					if(err) {
						console.log(err)
						res.send({ code: 401, data: {} })
						return
					}
										
					let payments = []
					
					_results.forEach(payment => {
						
						payments.push({
							can_pag: encryptAPI(payment.fec_pag.getDate().toString() + "/" + (payment.fec_pag.getMonth() + 1) + "/" + payment.fec_pag.getFullYear()),
							fec_pag: encryptAPI(payment.can_pag.toString())
						})	
						
					})
					
					res.send({
						code: 201,
						data: {
							name: encryptAPI(decryptBD(results[0].nom_cli)),
							apat: encryptAPI(decryptBD(results[0].app_cli)),
							amat: encryptAPI(decryptBD(results[0].apm_cli)),
							curp: encryptAPI(decryptBD(results[0].curp_cli)),
							tel: encryptAPI(decryptBD(results[0].tel_cli)),
							cel: encryptAPI(decryptBD(results[0].cel_cli)),
							est: encryptAPI(decryptBD(results[0].est_cli)),
							mun: encryptAPI(decryptBD(results[0].mun_cli)),
							col: encryptAPI(decryptBD(results[0].col_cli)),
							cp: encryptAPI(decryptBD(results[0].cp_cli)),
							st: encryptAPI(decryptBD(results[0].st_cli)),
							ext: encryptAPI(decryptBD(results[0].ext_cli)),
							_int: encryptAPI(decryptBD(results[0].int_cli)),
							ine: encryptAPI(decryptBD(results[0].ine_cli)),
							fot: encryptAPI(decryptBD(results[0].fot_cli)),
							cdom: encryptAPI(decryptBD(results[0].cdom_cli)),
							amount: encryptAPI(results[0].can_pre.toString()),
							date: encryptAPI(results[0].fec_pre.getDate().toString() + "/" + (results[0].fec_pre.getMonth() + 1) + "/" + results[0].fec_pre.getFullYear()),
							tdate: encryptAPI(results[0].tfec_pre.getDate().toString() + "/" + (results[0].tfec_pre.getMonth() + 1) + "/" + results[0].tfec_pre.getFullYear()),
							comments: encryptAPI(results[0].com_pre),
							tre_pre: encryptAPI(results[0].tre_pre.toString()),
							mre_pre: encryptAPI(results[0].mre_pre),
							est_pre: results[0].est_pre,
							payments: payments
						}
					})
							
				})

			}
			else {
				res.send({ code: 401, data: {} })
				return
			}
			
		})
		
	})

})

router.post('/getClientLending', (req, res) => {
	
	let id = decryptAPI(req.headers.id)
    let type = decryptAPI(req.headers.type)
    let token = decryptAPI(req.headers.token)
    let rfc = encryptBD(decryptAPI(req.headers.rfc))
    let password = encryptBD(decryptAPI(req.headers.password))

    let curp = encryptBD(decryptAPI(req.body.curp))
		
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
	
    if(type != 4 && type!=3) {
        res.send({ code: 303, data: {} })
        return
    }

	connection.query('SELECT * FROM empleado WHERE id_emp = ? AND id_tip = ? AND rfc_emp = ? AND pwd_emp = ?', [id, type, rfc, password], (err, results, field) => {
        		
        if(err) {
			console.log(err)
            res.send({ code: 401, data: {} })
            return
        }

        if(results.length != 1) {
            res.send({ code: 301, data: {} })
            return
		}
		
		connection.query('SELECT * FROM prestamo NATURAL JOIN cliente WHERE curp_cli = ? AND est_pre = 0', [curp], (err, results, fields) => {
		
			if(err) {
				console.log(err)
				res.send({ code: 401, data: {} })
				return
			}
			
			if(results.length == 1) {
				
				connection.query('SELECT * FROM pago NATURAL JOIN prestamo WHERE id_pre = ?', [results[0].id_pre], (err, _results, fields) => {
										
					if(err) {
						console.log(err)
						res.send({ code: 401, data: {} })
						return
					}
										
					let payments = []
					
					_results.forEach(payment => {
						
						payments.push({
							can_pag: encryptAPI(payment.fec_pag.getDate().toString() + "/" + (payment.fec_pag.getMonth() + 1) + "/" + payment.fec_pag.getFullYear()),
							fec_pag: encryptAPI(payment.can_pag.toString())
						})	
						
					})
					
					res.send({
						code: 201,
						data: {
							name: encryptAPI(decryptBD(results[0].nom_cli)),
							apat: encryptAPI(decryptBD(results[0].app_cli)),
							amat: encryptAPI(decryptBD(results[0].apm_cli)),
							curp: encryptAPI(decryptBD(results[0].curp_cli)),
							tel: encryptAPI(decryptBD(results[0].tel_cli)),
							cel: encryptAPI(decryptBD(results[0].cel_cli)),
							est: encryptAPI(decryptBD(results[0].est_cli)),
							mun: encryptAPI(decryptBD(results[0].mun_cli)),
							col: encryptAPI(decryptBD(results[0].col_cli)),
							cp: encryptAPI(decryptBD(results[0].cp_cli)),
							st: encryptAPI(decryptBD(results[0].st_cli)),
							ext: encryptAPI(decryptBD(results[0].ext_cli)),
							_int: encryptAPI(decryptBD(results[0].int_cli)),
							ine: encryptAPI(decryptBD(results[0].ine_cli)),
							fot: encryptAPI(decryptBD(results[0].fot_cli)),
							cdom: encryptAPI(decryptBD(results[0].cdom_cli)),
							amount: encryptAPI(results[0].can_pre.toString()),
							date: encryptAPI(results[0].fec_pre.getDate().toString() + "/" + (results[0].fec_pre.getMonth() + 1) + "/" + results[0].fec_pre.getFullYear()),
							tdate: encryptAPI(results[0].tfec_pre.getDate().toString() + "/" + (results[0].tfec_pre.getMonth() + 1) + "/" + results[0].tfec_pre.getFullYear()),
							comments: encryptAPI(results[0].com_pre),
							tre_pre: encryptAPI((results[0].tre_pre != null) ? results[0].tre_pre.toString() : results[0].tre_pre),
							mre_pre: encryptAPI(results[0].mre_pre),
							est_pre: results[0].est_pre,
							payments: payments
						}
					})
							
				})

			}
			
		})
		
	})
	
})

router.post('/getClientRevision', (req, res) => {
	
	let id = decryptAPI(req.headers.id)
    let type = decryptAPI(req.headers.type)
    let token = decryptAPI(req.headers.token)
    let rfc = encryptBD(decryptAPI(req.headers.rfc))
    let password = encryptBD(decryptAPI(req.headers.password))

    let curp = encryptBD(decryptAPI(req.body.curp))
	
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
		
		connection.query('SELECT * FROM prestamo NATURAL JOIN cliente WHERE curp_cli = ? AND est_pre = 1', [curp], (err, results, fields) => {
	
			if(err) {
				res.send({ code: 401, data: {} })
				return
			}
			
			if(results.length == 1) {
								
				res.send({
					code: 201,
					data: {
						name: encryptAPI(decryptBD(results[0].nom_cli)),
						apat: encryptAPI(decryptBD(results[0].app_cli)),
						amat: encryptAPI(decryptBD(results[0].apm_cli)),
						curp: encryptAPI(decryptBD(results[0].curp_cli)),
						tel: encryptAPI(decryptBD(results[0].tel_cli)),
						cel: encryptAPI(decryptBD(results[0].cel_cli)),
						est: encryptAPI(decryptBD(results[0].est_cli)),
						mun: encryptAPI(decryptBD(results[0].mun_cli)),
						col: encryptAPI(decryptBD(results[0].col_cli)),
						cp: encryptAPI(decryptBD(results[0].cp_cli)),
						st: encryptAPI(decryptBD(results[0].st_cli)),
						ext: encryptAPI(decryptBD(results[0].ext_cli)),
						_int: encryptAPI(decryptBD(results[0].int_cli)),
						ine: encryptAPI(decryptBD(results[0].ine_cli)),
						fot: encryptAPI(decryptBD(results[0].fot_cli)),
						cdom: encryptAPI(decryptBD(results[0].cdom_cli)),
						amount: encryptAPI(results[0].can_pre.toString()),
						date: encryptAPI(results[0].fec_pre.getDate().toString() + "/" + (results[0].fec_pre.getMonth() + 1) + "/" + results[0].fec_pre.getFullYear()),
						comments: encryptAPI(results[0].com_pre),
						est_pre: results[0].est_pre
					}
				})
			}
			
		})
		
	})
	
})

router.post('/registerEntry', (req, res) => {

	let id = decryptAPI(req.headers.id)
    let type = decryptAPI(req.headers.type)
    let token = decryptAPI(req.headers.token)
    let rfc = encryptBD(decryptAPI(req.headers.rfc))
    let password = encryptBD(decryptAPI(req.headers.password))

    let amount = decryptAPI(req.body.amount)
	
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
	
    if(type != 4 && type!=3) {
        res.send({ code: 303, data: {} })
        return
	}
	
	connection.query('SELECT * FROM empleado WHERE id_emp = ? AND id_tip = ? AND rfc_emp = ? AND pwd_emp = ?', [id, type, rfc, password], (err, results, fields) => {
        
        if(err) {
			console.log(err)
            res.send({ code: 401, data: {} })
            return
        }

        if(results.length != 1) {
            res.send({ code: 301, data: {} })
            return
        }
		
		connection.query("INSERT INTO ingreso (can_ing,fec_ing,id_suc) VALUES (?,?,?)",[parseFloat(amount), new Date(), results[0].id_suc], (err, results, fields) => {

			if(err) {
				console.log(err)
				res.send({ code: 401, data: {} })
				return
			}

			res.send({ code: 201, data: {} })
			return

		})
		
	})

})

router.post('/registerEgress', (req, res) => {

	let id = decryptAPI(req.headers.id)
    let type = decryptAPI(req.headers.type)
    let token = decryptAPI(req.headers.token)
    let rfc = encryptBD(decryptAPI(req.headers.rfc))
    let password = encryptBD(decryptAPI(req.headers.password))

    let amount = decryptAPI(req.body.amount)
	
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
	
    if(type != 4 && type!=3) {
        res.send({ code: 303, data: {} })
        return
	}
	
	connection.query('SELECT * FROM empleado WHERE id_emp = ? AND id_tip = ? AND rfc_emp = ? AND pwd_emp = ?', [id, type, rfc, password], (err, results, fields) => {
        
        if(err) {
			console.log(err)
            res.send({ code: 401, data: {} })
            return
        }

        if(results.length != 1) {
            res.send({ code: 301, data: {} })
            return
        }
		
		connection.query("INSERT INTO egreso (can_egr,fec_egr,id_suc) VALUES (?,?,?)",[parseFloat(amount), new Date(), results[0].id_suc], (err, results, fields) => {

			if(err) {
				console.log(err)
				res.send({ code: 401, data: {} })
				return
			}

			res.send({ code: 201, data: {} })
			return

		})
		
	})

})

router.post('/getSucursalTotal', (req, res) => {

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
	
    if(type != 4 && type!=3) {
        res.send({ code: 303, data: {} })
        return
	}
	
	connection.query('SELECT * FROM empleado NATURAL JOIN sucursal WHERE id_emp = ? AND id_tip = ? AND rfc_emp = ? AND pwd_emp = ?', [id, type, rfc, password], (err, results, fields) => {
        
        if(err) {
			console.log(err)
            res.send({ code: 401, data: {} })
            return
        }

        if(results.length != 1) {
            res.send({ code: 301, data: {} })
            return
        }

		connection.query('SELECT * FROM ingreso WHERE id_suc = ?', [results[0].id_suc], (err, entries, fields) => {

			if(err) {
				console.log(err)
				res.send({ code: 401, data: {} })
				return
			}

			connection.query('SELECT * FROM egreso WHERE id_suc = ?', [results[0].id_suc], (err, egress, fields) => {
				
				if(err) {
					console.log(err)
					res.send({ code: 401, data: {} })
					return
				}

				let total = 0

				entries.forEach(entry => {
					total += entry.can_ing
				})

				egress.forEach(egres => {
					total -= egres.can_egr
				})

				res.send({ code: 201, data: { amount: total } })

			})

		})
		
	})

})

router.post('/editClient', async (req, res) => {

	let password = encryptBD(decryptAPI(req.headers.password))
	let rfc = encryptBD(decryptAPI(req.headers.rfc))
	let id = decryptAPI(req.headers.id)
	let type = decryptAPI(req.headers.type)
	let token = decryptAPI(req.headers.token)
	
	let name = decryptAPI(req.body.name)
	let apat = decryptAPI(req.body.apat)
	let amat = decryptAPI(req.body.amat)
	let curp = decryptAPI(req.body.curp)
	let tel = decryptAPI(req.body.tel)
	let cel = decryptAPI(req.body.cel)
	let est = decryptAPI(req.body.est)
	let mun = decryptAPI(req.body.mun)
	let col = decryptAPI(req.body.col)
	let st = decryptAPI(req.body.st)
	let cp = decryptAPI(req.body.cp)
	let ext = decryptAPI(req.body.ext)
	let _int = decryptAPI(req.body.int)
	let client = decryptAPI(req.body.client).replace(/^data:image\/png;base64,/, "")
	let cdom = decryptAPI(req.body.cdom).replace(/^data:image\/png;base64,/, "")
	let ine = decryptAPI(req.body.ine).replace(/^data:image\/png;base64,/, "")
	let _id = decryptAPI(req.body._id)

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

    if(type != 3) {
        res.send({ code: 303, data: {} })
        return
    }

    connection.query('SELECT * FROM empleado WHERE id_emp = ? AND id_tip = ? AND rfc_emp = ? AND pwd_emp = ?', [id, type, rfc, password], async (err, results, field) => {
        
        if(err) {
            res.send({ code: 401, data: {} })
            return
        }

        if(results.length != 1) {
            res.send({ code: 301, data: {} })
            return
		}
		
		try {

			fs.writeFileSync(`src/files/client/${curp}_client.png`, client, 'base64')
			fs.writeFileSync(`src/files/document/${curp}_dom.png`, cdom, 'base64')
			fs.writeFileSync(`src/files/ine/${curp}_ine.png`, ine, 'base64')

			await uploadFile(`src/files/client/${curp}_client.png`)
			await uploadFile(`src/files/document/${curp}_dom.png`)
			await uploadFile(`src/files/ine/${curp}_ine.png`)

			connection.query('UPDATE cliente SET nom_cli = ?, app_cli = ?, apm_cli = ?, curp_cli = ?, tel_cli = ?, cel_cli = ?, est_cli = ?, mun_cli = ?, col_cli = ?, st_cli = ?, cp_cli = ?, ext_cli = ?, int_cli = ? WHERE id_cli = ?', [
			encryptBD(name), encryptBD(apat), encryptBD(amat), encryptBD(curp), encryptBD(tel), encryptBD(cel), encryptBD(est), encryptBD(mun), encryptBD(col),encryptBD(st), encryptBD(cp),
			encryptBD(ext), encryptBD(_int), _id], (err, results, field) => {
				
				if(err) {
					console.log(err)
					res.send({ code: 401, data: {} })
					return
				}
				
				res.send({ code: 201, data: {} })
				
			})

		} catch (err) {

			console.log(err)
			res.send({ code: 307, data: {} })
			return

		}

    })

})

router.post('/randomAssigned', (req, res) => {

	let password = encryptBD(decryptAPI(req.headers.password))
	let rfc = encryptBD(decryptAPI(req.headers.rfc))
	let id = decryptAPI(req.headers.id)
	let type = decryptAPI(req.headers.type)
	let token = decryptAPI(req.headers.token)

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

    if(type != 3) {
        res.send({ code: 303, data: {} })
        return
    }

    connection.query('SELECT * FROM empleado WHERE id_emp = ? AND id_tip = ? AND rfc_emp = ? AND pwd_emp = ?', [id, type, rfc, password], (err, results, field) => {
        
        if(err) {
			console.log(err)
            res.send({ code: 401, data: {} })
            return
        }

        if(results.length != 1) {
            res.send({ code: 301, data: {} })
            return
		}
		
		connection.query('SELECT * FROM prestamo WHERE est_pre = 0 AND id_suc = ?', [results[0].id_suc], (err, lendings, fields) => {

			if(err) {
				console.log(err)
				res.send({ code: 401, data: {} })
				return
			}

			connection.query('SELECT * FROM empleado WHERE id_tip = 4 AND id_suc = ?', [results[0].id_suc], (err, collectors, fields) => {

				if(err) {
					console.log(err)
					res.send({ code: 401, data: {} })
					return
				}

				let queries = []

				for(let i = 0; i < lendings.length; i++) {

					let n = Math.round((Math.random() * 100000)) % lendings.length
					
					let temp = lendings[i]
					lendings[i] = lendings[n]
					lendings[n] = temp

				}

				for(let i = 0, j = 0; i < lendings.length; i++, j++) {

					if(j == collectors.length)
						j = 0;

					queries.push({
						client: lendings[i],
						collector: collectors[j]
					})

				}

				queries.forEach(query => {

					syncConnection.query('INSERT INTO asignacion (id_cli, id_emp,fec_asi, est_asi) VALUES (?,?,NOW(), 0)', [query.client.id_cli, query.collector.id_emp])
					
				})

				res.send({ code: 201, data: {} })
				
			})

		})

    })

})

module.exports = router