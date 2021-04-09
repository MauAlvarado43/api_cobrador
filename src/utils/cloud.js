import {Storage} from '@google-cloud/storage'

const storage = new Storage({
    keyFilename: "src/config/key.json"
});

let bucketName = "cobrador_bucket"

const listFiles = async () => {

    const [files] = await storage.bucket(bucketName).getFiles()

    return files

}

const deleteFile = async (fileName) => {

    await storage.bucket(bucketName).file(fileName).delete()

    console.log(`gs://${bucketName}/${fileName} deleted`)

    return true

}

const getMetadata = async (fileName) => {

    const [metadata] = await storage.bucket(bucketName).file(fileName).getMetadata()

    return metadata.mediaLink

}


const uploadFile = async(fileName) => {

    await storage.bucket(bucketName).upload(fileName, {
        gzip: true,
        metadata: {
            cacheControl: 'public, max-age=31536000',
        }
    })

    console.log(`${fileName} uploaded to ${bucketName}.`)

    return true

}

export { getMetadata, uploadFile, deleteFile, listFiles }