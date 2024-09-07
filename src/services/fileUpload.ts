import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {DateTime} from 'luxon'

const generateFileName = (fileName) => {
    const timeNow = DateTime.now().toMillis();
    return timeNow+fileName
}
export const fileUpload = async (file, fileName): Promise<string> => {
    const s3 = new S3Client({
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
        },
        region: process.env.BUCKET_REIGON
    })

    const modifiedFileName = generateFileName(fileName)

    const uploadParams = {
        Bucket: process.env.BUCKET_NAME,
        Body: file,
        Key: modifiedFileName,
        ContentType: file.mimetype
    }

    await s3.send(new PutObjectCommand(uploadParams));

    return modifiedFileName;
    // TODO: returning the link part should implement. https://www.sammeechward.com/storing-images-in-s3-from-node-server
}