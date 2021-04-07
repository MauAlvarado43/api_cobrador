import MySql  from 'sync-mysql'

var syncConnection = new MySql({
  user: process.env.BD_USER,
  password: process.env.BD_PASSWORD,
  database: process.env.BD_NAME,
  host: process.env.BD_HOST
})

export default syncConnection