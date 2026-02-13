const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for Profile Images (Completely separate folder)
const profileStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'User_Profiles_Images', // Root level folder
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'avif'],
        transformation: [{ width: 500, height: 500, crop: 'limit' }]
    },
});

// Storage for Property/House Images (Completely separate folder)
const propertyStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'House_Listing_Images', // Root level folder
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'avif'],
        transformation: [{ width: 1200, height: 800, crop: 'limit' }]
    },
});

const profileParser = multer({ storage: profileStorage });
const propertyParser = multer({ storage: propertyStorage });

module.exports = { cloudinary, profileParser, propertyParser };
