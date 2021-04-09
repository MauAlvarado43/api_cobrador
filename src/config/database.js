import mysql from 'mysql'

let connection = mysql.createConnection({
    user: process.env.BD_USER,
    password: process.env.BD_PASSWORD,
    database: process.env.BD_NAME,
    host: process.env.BD_HOST
})

connection.connect((err,args)=>{
	if(err)
        console.log(err)
})

export default connection