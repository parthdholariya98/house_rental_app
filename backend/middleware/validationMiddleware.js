const { check, validationResult } = require('express-validator');

const validateRegister = [
    check('name', 'Name is required').not().isEmpty().trim(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
    check('role', 'Invalid role').optional().isIn(['user', 'owner', 'broker']),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

const validateLogin = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('password', 'Password is required').exists(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

const validateProperty = [
    check('title', 'Title should be at least 5 characters').trim().isLength({ min: 5 }),
    check('description', 'Description should be at least 10 characters').trim().isLength({ min: 10 }),
    check('location', 'Location is required').trim().not().isEmpty(),
    check('price', 'Price must be a positive number').isFloat({ min: 1 }),
    check('deposit', 'Deposit must be a positive number or zero').optional({ checkFalsy: true }).isFloat({ min: 0 }),
    check('type', 'Property type is required').isIn(['Apartment', 'House', 'Villa', 'Tenament']),
    check('bhk', 'BHK must be a valid number between 1 and 10').isInt({ min: 1, max: 10 }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation Errors:', errors.array());
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array().map(err => err.msg)
            });
        }
        next();
    }
];

module.exports = { validateRegister, validateLogin, validateProperty };
