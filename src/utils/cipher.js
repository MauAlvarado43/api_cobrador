import crypto from 'crypto'
import CryptoJS from 'crypto-js'

import tokenGenerator from 'jsonwebtoken'

const ALGORITHM = 'aes-256-cbc'
const CIPHER_KEY = ""
const BLOCK_SIZE = 16

const PASSWORD_BD = ''
const IV = ''

const encryptBD = plainText => {

    try{

        let cipher = crypto.createCipheriv(ALGORITHM, PASSWORD_BD, IV)
        let encrypted = cipher.update(plainText, 'utf8', 'base64')
        encrypted += cipher.final('base64')
        return encrypted

    }catch(err){

        if(err) console.log(err)
		return null
		
	}
	
}

const decryptBD = cryptedText => {

    try{

        let decipher = crypto.createDecipheriv(ALGORITHM, PASSWORD_BD, IV)
        let decrypted = decipher.update(cryptedText, 'base64', 'utf8')
        return (decrypted + decipher.final('utf8'))

    }catch(err){

        if(err) console.log(err)
		return null 
		
	}
	
}

const encryptAPI = (plainText) => {
	var cipherText = CryptoJS.AES.encrypt(plainText, CIPHER_KEY).toString()
	
	return cipherText
}

const decryptAPI = (ciphertext) => {
	var bytes  = CryptoJS.AES.decrypt(ciphertext, CIPHER_KEY)
	var originalText = bytes.toString(CryptoJS.enc.Utf8)
	
	return originalText
}

const generateToken = (duration) => ( tokenGenerator.sign({ foo: crypto.randomBytes , iat: Math.floor(Date.now() / 1000) + duration}, '') )
const validateToken = token => ( tokenGenerator.decode(token, '', (err, decode) => (decode)) )


export { decryptAPI, encryptAPI, encryptBD, decryptBD, generateToken, validateToken }