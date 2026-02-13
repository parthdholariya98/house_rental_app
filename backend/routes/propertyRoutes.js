const express = require('express');
const router = express.Router();
const {
    getProperties,
    getPropertyById,
    createProperty,
    deleteProperty,
    verifyProperty,
    getUnverifiedProperties,
    getMyProperties
} = require('../controllers/propertyController');
const { protect, verifyRole } = require('../middleware/authMiddleware');
const { validateProperty } = require('../middleware/validationMiddleware');
const { propertyParser } = require('../config/cloudinary');

// Public routes
router.get('/unverified', protect, verifyRole(['broker', 'admin']), getUnverifiedProperties);
router.get('/my-properties', protect, getMyProperties);
router.get('/', getProperties);
router.get('/:id', getPropertyById);

// Protected routes
// Only Owner and Admin can create properties
// We expect 'images' field in form-data for file upload
router.post(
    '/',
    protect,
    verifyRole(['owner', 'broker', 'admin']),
    (req, res, next) => {
        propertyParser.array('images', 5)(req, res, (err) => {
            if (err) {
                console.error('Multer/Cloudinary Error:', err);
                if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    return res.status(400).json({ message: 'Too many files uploaded.' });
                }
                return res.status(500).json({ message: 'Image upload failed: ' + err.message });
            }
            next();
        });
    },
    validateProperty,
    createProperty
);

// Only Owner, Broker (poster), and Admin can delete
router.delete(
    '/:id',
    protect,
    verifyRole(['owner', 'broker', 'admin']),
    deleteProperty
);

// Only Broker and Admin can verify
router.put(
    '/:id/verify',
    protect,
    verifyRole(['broker', 'admin']),
    verifyProperty
);

module.exports = router;
