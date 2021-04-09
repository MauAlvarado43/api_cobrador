require('dotenv').config()

import mysql from 'mysql'
import { decryptAPI, encryptAPI, encryptBD, decryptBD, validateToken } from './utils/cipher'
import fs from 'fs'
import readline from 'readline'

let connection = mysql.createConnection({
    user: process.env.BD_USER,
    password: process.env.BD_PASSWORD,
    database: process.env.BD_NAME,
    host: process.env.BD_HOST
})

const getType = (type) => {

    if(type == "cobrador") return 4
    if(type == "responsable de cuenta") return 3
    if(type == "contador") return 2
    if(type == "director") return 1

}

const loadData = async () => {

    let sucursal = fs.readFileSync(__dirname + '\\files\\backup\\sucursal.csv', 'utf-8').split(/\r?\n/)[1].split(',')

    // for(let i = 1; i < sucursal.length; i++) 
    //     console.log(sucursal[i])

    let sucursalData = {
        name: sucursal[0],
        dom: sucursal[1]
    }

    connection.query('INSERT INTO sucursal (nom_suc, dom_suc) VALUEs (?,?)', [sucursalData.name, sucursalData.dom], (err, suc, fields) => {
   
        let empleados = fs.readFileSync(__dirname + '\\files\\backup\\empleados.csv', 'utf-8').split(/\r?\n/)

        for(let i = 1; i < empleados.length; i++) {

            let empleado = empleados[i].split(',')

            let empleadoData = {
                name: empleado[0],
                apat: empleado[1],
                amat: empleado[2],
                rfc: empleado[3],
                type: getType(empleado[4])
            }

            connection.query('INSERT INTO empleado (nom_emp, app_emp, apm_emp, rfc_emp, pwd_emp, id_tip, id_suc) VALUES (?,?,?,?,?,?,?)', [encryptBD(empleadoData.name), encryptBD(empleadoData.apat), encryptBD(empleadoData.amat), encryptBD(empleadoData.rfc), encryptBD(empleadoData.rfc), empleadoData.type, suc.insertId], (err, res, fields) => {})

        }
            

    })

    let clientes = fs.readFileSync(__dirname + '\\files\\backup\\clientes.csv', 'utf-8').split(/\r?\n/)

    for(let i = 1; i < clientes.length; i++) {

        let cliente = clientes[i].split(',')

        let clienteData = {
            name: cliente[0],
            apat: cliente[1],
            amat: cliente[2],
            curp: cliente[3],
            cp: cliente[4],
            est: cliente[5],
            mun: cliente[6],
            col: cliente[7],
            st: cliente[8],
            ext: (cliente[9] == '') ? 's/n' : cliente[9],
            _int: (cliente[11] == '') ? '0' : cliente[11],
            tel: (cliente[12] == '') ? 'Sin registro' : cliente[12],
            cel: (cliente[13] == '') ? 'Sin registro' : cliente[13]
        }

        connection.query('INSERT INTO cliente (nom_cli, app_cli, apm_cli, curp_cli, tel_cli, cel_cli, est_cli, mun_cli, col_cli, st_cli, cp_cli, ext_cli, int_cli, cdom_cli, ine_cli, fot_cli, id_tip) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,5)', [
            encryptBD(clienteData.name), encryptBD(clienteData.apat), encryptBD(clienteData.amat), encryptBD(clienteData.curp), encryptBD(clienteData.tel),
            encryptBD(clienteData.cel), encryptBD(clienteData.est), encryptBD(clienteData.mun), encryptBD(clienteData.col), encryptBD(clienteData.st),
            encryptBD(clienteData.cp), encryptBD(clienteData.ext), encryptBD(clienteData._int), encryptBD("https://storage.googleapis.com/cobrador_bucket/descarga.png"),
            encryptBD("https://storage.googleapis.com/cobrador_bucket/descarga.png"), encryptBD("https://storage.googleapis.com/cobrador_bucket/descarga.png")
        ], (err, res, fields) => {})

    }
    
}

loadData()