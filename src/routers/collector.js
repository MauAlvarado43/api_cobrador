import {Router} from 'express'
import connection from '../config/database'
import { decryptAPI, encryptAPI, encryptBD, decryptBD, validateToken } from '../utils/cipher'
import fs from 'fs'

const router = Router()

router.post('/getClient', (req, res) => {
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
		
		connection.query('SELECT * FROM cliente WHERE curp_cli = ?', [curp], (err, results, fields) => {
	
			if(err) {
				res.send({ code: 401, data: {} })
				return
			}
			
			if(results.length == 1) {
				
				res.send({
					code: 201,
					data: {
                        id:  encryptAPI(results[0].id_cli.toString()),
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
						cdom: encryptAPI(decryptBD(results[0].cdom_cli))
					}
				})
			}
			
		})
		
	})
	
})

router.post('/getClients', (req, res) => {
	
    let id = decryptAPI(req.headers.id)
    let type = decryptAPI(req.headers.type)
    let token = decryptAPI(req.headers.token)
    let rfc = encryptBD(decryptAPI(req.headers.rfc))
    let password = encryptBD(decryptAPI(req.headers.password))

    let typeRequest = decryptAPI(req.body.typeRequest)

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

    if(!typeRequest) {
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
		
		let query
		
		if(typeRequest == 0)
			query = 'SELECT * from cliente'
		if(typeRequest == 1)
			query = '(SELECT DISTINCT nom_cli, app_cli, apm_cli, curp_cli FROM cliente NATURAL JOIN prestamo WHERE id_cli NOT IN (SELECT id_cli FROM prestamo WHERE est_pre = 4 OR est_pre = 0 OR est_pre = 1  OR est_pre = 5)) UNION (SELECT nom_cli, app_cli, apm_cli, curp_cli from cliente LEFT JOIN prestamo ON cliente.id_cli = prestamo.id_cli WHERE prestamo.id_cli IS NULL)'
		if(typeRequest == 2)
			query = 'SELECT * from cliente LEFT JOIN prestamo ON cliente.id_cli = prestamo.id_cli WHERE prestamo.est_pre = 0'
		if(typeRequest == 3) {
			if(results[0].id_tip == 3) {
				query = 'SELECT * from cliente LEFT JOIN prestamo ON cliente.id_cli = prestamo.id_cli WHERE prestamo.est_pre = 1 AND prestamo.can_pre <= 5000'
			}
			else if(results[0].id_tip == 2 || results[0].id_tip == 1) {
				query = '(SELECT * from cliente LEFT JOIN prestamo ON cliente.id_cli = prestamo.id_cli WHERE prestamo.est_pre = 1 AND prestamo.can_pre <= 5000)'
			}
			else {
				res.send({ code: 303, data: {} })
				return
			}
        }
        if(typeRequest == 4)
            query = 'SELECT * FROM cliente LEFT JOIN prestamo ON cliente.id_cli = prestamo.id_cli WHERE prestamo.est_pre = 4 OR prestamo.est_pre = 5'
			
		
        connection.query(query, [], (err, _results, field) => {
			
            if(err) {
				console.log(err)
                res.send({ code: 401, data: {} })
                return
            }

            let data = []

            _results.forEach(client => {
                data.push({
                    name: encryptAPI(decryptBD(client.nom_cli)),
                    apat: encryptAPI(decryptBD(client.app_cli)),
                    amat: encryptAPI(decryptBD(client.apm_cli)),
					curp: encryptAPI(decryptBD(client.curp_cli))
				})
            })

            res.send({
                code: 201,
                data: data
            })

        })

    })

})

router.post('/requestLending', (req, res) => {
	
	let id = decryptAPI(req.headers.id)
    let type = decryptAPI(req.headers.type)
    let token = decryptAPI(req.headers.token)
    let rfc = encryptBD(decryptAPI(req.headers.rfc))
    let password = encryptBD(decryptAPI(req.headers.password))
	
	let curp = encryptBD(decryptAPI(req.body.curp))
	let amount = decryptAPI(req.body.amount)
    let comments = decryptAPI(req.body.comments)
    let lapse = decryptAPI(req.body.lapse)

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
            res.send({ code: 401, data: {} })
            return
        }

        if(results.length != 1) {
            res.send({ code: 301, data: {} })
            return
        }
        
        let state = 2
        
        if(type == 4 && amount <= 2000) {
            state = 0
        }
        else if(type == 4 && amount > 2000) {
            state = 1
        }
        else if(type == 3 && amount <= 5000) {
            state = 0
        }
        else if(type == 3 && amount > 5000) {
            state = 1
        }
        else if(type == 2) {
            state = 0
        }
        
        connection.query("SELECT * FROM prestamo NATURAL JOIN cliente WHERE curp_cli = ? AND est_pre = 0", [curp], (err, results, fields) => {
            
            if(err) {
                console.log(err)
                res.send({ code: 401, data: {} })
                return
            }
            
            if(results.length == 0) {

                connection.query('SELECT * FROM cliente WHERE curp_cli = ?', [curp], (err, client, fields) => {

                    if(err) {
                        console.log(err)
                        res.send({ code: 401, data: {} })
                        return
                    }

                    if(client[0].sta_cli == 1) {
                        state = 1
                        comments += '\n' + 'Cliente registrado por cobrador'
                    }

                    connection.query('UPDATE cliente SET sta_cli = 0 WHERE curp_cli = ?', [curp], (err, results, fields) => {
                        
                        if(err) {
                            console.log(err)
                            res.send({ code: 401, data: {} })
                            return
                        }

                        connection.query('INSERT INTO prestamo (can_pre,fec_pre, tfec_pre,est_pre,com_pre,id_cli,id_suc) VALUES (?,?,DATE_ADD(?, INTERVAL ? DAY),?,?, (SELECT id_cli FROM cliente WHERE curp_cli = ?), (SELECT id_suc FROM empleado WHERE rfc_emp = ? AND pwd_emp = ?))', [amount, new Date(), new Date(), parseInt(lapse) + 1, state, comments, curp, rfc, password], (err, results, fields) => {
                            if(err) {
                                console.log(err)
                                res.send({ code: 401, data: {} })
                                return
                            }
                            
                            res.send({ code: 201, data: {} })
                                
                        })

                    })

                })

            }
            else {
                res.send({ code: 304, data: {} })
                return
            }
            
        })

    })
	
})

router.post('/realizePayment', (req, res) => {
	
	let id = decryptAPI(req.headers.id)
    let type = decryptAPI(req.headers.type)
    let token = decryptAPI(req.headers.token)
    let rfc = encryptBD(decryptAPI(req.headers.rfc))
    let password = encryptBD(decryptAPI(req.headers.password))
	
	let curp = encryptBD(decryptAPI(req.body.curp))
	let date = decryptAPI(req.body.date)
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
	
	connection.query('SELECT * FROM empleado WHERE id_emp = ? AND id_tip = ? AND rfc_emp = ? AND pwd_emp = ?', [id, type, rfc, password], (err, results, field) => {
		
		if(err) {
			res.send({ code: 401, data: {} })
			return
		}

		if(results.length != 1) {
			res.send({ code: 301, data: {} })
			return
		}
		
		connection.query("SELECT * FROM prestamo NATURAL JOIN cliente WHERE curp_cli = ? AND est_pre = 0", [curp], (err, results, fields) => {
			
			if(err) {
				console.log(err)
				res.send({ code: 401, data: {} })
				return
			}
			
			if(results.length == 1) {
				
				let _date = new Date()
				
				if((_date.getDate().toString() + "/" + (_date.getMonth() + 1) + "/" + _date.getFullYear()) == date) {
					
					connection.query('SELECT * from pago WHERE id_pre = ? AND fec_pag = ?', [results[0].id_pre, date], (err, _results, fields) => {
						
						if(err) {
							console.log(err)
							res.send({ code: 401, data: {} })
							return
						}
							
						if(_results.length == 0) {
							
							connection.query('INSERT INTO pago (can_pag,fec_pag,id_pre) VALUES (?,?,?)', [amount, new Date(), results[0].id_pre], (err, results, fields) => {
							
								if(err) {
									console.log(err)
									res.send({ code: 401, data: {} })
									return
								}
								
								res.send({ code: 201, data: {} })
								return
								
							})
							
						}
						else {
							res.send({ code: 306, data: {} })
							return
						}
							
					})

				}
				else {
					res.send({ code: 305, data: {} })
					return
				}
				
			}
			
		})

	})

	
})

router.post('/getClientPayment', (req, res) => {
	
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
	
	connection.query('SELECT * from empleado WHERE id_emp = ? AND id_tip = ? AND rfc_emp = ? AND pwd_emp = ?', [id, type, rfc, password], (err, results, field) => {
        
        if(err) {
            res.send({ code: 401, data: {} })
            return
        }

        if(results.length != 1) {
            res.send({ code: 301, data: {} })
            return
        }

		connection.query('SELECT * FROM prestamo NATURAL JOIN cliente WHERE est_pre = 0 AND curp_cli = ?', [curp], (err, results, field) => {
			
			if(err) {
                res.send({ code: 401, data: {} })
                return
            }
			
			connection.query(`SELECT IFNULL(DATE(fec_pag), DATE(cal.date)) AS fec_pag, IFNULL(can_pag,0) AS can_pag
				FROM (
					  SELECT ? + INTERVAL xc DAY AS date
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
				WHERE cal.date >= SUBDATE(?, INTERVAL 1 DAY) AND cal.date <= ?
				ORDER BY cal.date ASC;`, [results[0].fec_pre, results[0].id_pre, results[0].fec_pre, results[0].tfec_pre], (err, _results, field) => {
		
            if(err) {
				console.log(err)
                res.send({ code: 401, data: {} })
                return
            }

            let data = []
			let payed = 0

            _results.forEach(lending => {
				
				payed += lending.can_pag
				
				data.push({
					fec_pag: encryptAPI(lending.fec_pag.getDate().toString() + "/" + (lending.fec_pag.getMonth() + 1) + "/" + lending.fec_pag.getFullYear()),
					can_pag: encryptAPI(lending.can_pag.toString())
				})
            })

            res.send({
                code: 201,
                data: {
					tot_pay: encryptAPI(payed.toString()),
					can_pre: encryptAPI(results[0].can_pre.toString()),
                    lendings: data
                }
            })

        })
			
		})

    })
	
})

router.post('/requestIncreaseDate', (req, res) => {

	let id = decryptAPI(req.headers.id)
    let type = decryptAPI(req.headers.type)
    let token = decryptAPI(req.headers.token)
    let rfc = encryptBD(decryptAPI(req.headers.rfc))
    let password = encryptBD(decryptAPI(req.headers.password))

	let curp = encryptBD(decryptAPI(req.body.curp))
	let days = decryptAPI(req.body.days)
	let reason = decryptAPI(req.body.reason)

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
		
		connection.query('SELECT id_pre FROM prestamo NATURAL JOIN cliente WHERE curp_cli = ? AND est_pre = 0', [curp], (err, results, fields) => {
			
			if(err) {
				console.log(err)
				res.send({ code: 401, data: {} })
				return
			}

			connection.query('UPDATE prestamo SET est_pre = 5, tre_pre = ?, mre_pre = ? WHERE id_pre = ?', [days, reason, results[0].id_pre], (err, results, fields) => {

				if(err) {
					console.log(err)
					res.send({ code: 401, data: {} })
					return
				}
	
				res.send({ code: 201, data: {} })
				
			})

		})
		
	})

})

router.post('/requestRennovation', (req, res) => {

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
		
		connection.query('SELECT * FROM prestamo NATURAL JOIN cliente  WHERE curp_cli = ?', [curp], (err, results, fields) => {
			
			if(err) {
				console.log(err)
				res.send({ code: 401, data: {} })
				return
            }
            
            connection.query('INSERT INTO prestamo (can_pre,fec_pre, tfec_pre,est_pre,com_pre,id_cli,id_suc, tre_pre, mre_pre) VALUES (?,?,DATE_ADD(?, INTERVAL DATEDIFF(?, ?) DAY),?,?, (SELECT id_cli FROM cliente WHERE curp_cli = ?), (SELECT id_suc FROM empleado WHERE rfc_emp = ? AND pwd_emp = ?), 0, "Rennovación por préstamo caducado")', [results[0].can_pre, new Date(), new Date(), results[0].fec_pre, results[0].tfec_pre, 4, 'Ninguno', curp, rfc, password], (err, _results, fields) => {

                if(err) {
                    console.log(err)
                    res.send({ code: 401, data: {} })
                    return
                }

                connection.query('UPDATE prestamo SET est_pre = 3 WHERE id_pre = ?', [results[0].id_pre], (err, results, fields) => {

                    if(err) {
                        console.log(err)
                        res.send({ code: 401, data: {} })
                        return
                    }

                    res.send({ code: 201, data: {} })

                })

            })

		})
		
		
	})

})

router.post('/getAssigned', (req, res) => {

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
        
        connection.query('SELECT * FROM asignacion NATURAL JOIN cliente WHERE id_emp = ? AND fec_asi = DATE(NOW()) AND est_asi = 0', [results[0].id_emp], (err, assigned, fields) => {

            if(err) {
                console.log(err)
                res.send({ code: 401, data: {} })
                return
            }

            let response = []

            assigned.forEach(element => {
                response.push({
                    id: element.id_asi.toString(),
                    name: encryptAPI(decryptBD(element.nom_cli) + " " + decryptBD(element.app_cli) + " " + decryptBD(element.apm_cli)),
                    cel: encryptAPI(decryptBD(element.cel_cli)),
                    tel: encryptAPI(decryptBD(element.tel_cli)),
                    dom: encryptAPI( decryptBD(element.st_cli) + " " +decryptBD(element.ext_cli) + ((decryptBD(element.int_cli) == 0) ? '' : ' int. ') + ((decryptBD(element.int_cli) == 0) ? '' : decryptBD(element.int_cli)) + " Col. " + decryptBD(element.col_cli) + " C.P. " + decryptBD(element.cp_cli) + " " + decryptBD(element.mun_cli))
                })
            })

            res.send({code: 201, data: response})

        })
	
	})

})

router.post('/checkAssigned', (req, res) => {

    let id = decryptAPI(req.headers.id)
    let type = decryptAPI(req.headers.type)
    let token = decryptAPI(req.headers.token)
    let rfc = encryptBD(decryptAPI(req.headers.rfc))
    let password = encryptBD(decryptAPI(req.headers.password))

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

        console.log(_id)
        
        connection.query('UPDATE asignacion SET est_asi = 1 WHERE id_asi = ?', [_id], (err, results, field) => {

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