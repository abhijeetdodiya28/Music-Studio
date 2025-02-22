const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
})

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'musicstudio_dev',
        allowedFormats: ["png", "jpg", "jpeg"],
    },
});

const upload = multer({
    storage: storage, // Use the Cloudinary storage
    limits: { files: 5 }, // Limit the number of files to 5
});
module.exports = {
    cloudinary,
    storage,
    upload,
};