const { body, param, query, validationResult } = require('express-validator');

// Helper function to handle validation results
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

// User validation rules
const validateUserRegistration = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 20 })
        .withMessage('Username must be between 3-20 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),

    body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),

    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2-50 characters'),

    body('birthday')
        .isISO8601()
        .withMessage('Please provide a valid date in YYYY-MM-DD format'),

    handleValidationErrors
];

const validateUserLogin = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Username is required'),

    body('password')
        .notEmpty()
        .withMessage('Password is required'),

    handleValidationErrors
];

// Room validation rules
const validateRoomCreation = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Room name must be between 1-50 characters'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Description cannot exceed 200 characters'),

    body('adaUsername')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Ada username cannot exceed 50 characters'),

    handleValidationErrors
];

const validateRoomUpdate = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid room ID'),

    body('name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Room name must be between 1-50 characters'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Description cannot exceed 200 characters'),

    body('isOccupied')
        .optional()
        .isBoolean()
        .withMessage('isOccupied must be a boolean'),

    body('temperature.target')
        .optional()
        .isFloat({ min: -50, max: 100 })
        .withMessage('Target temperature must be between -50 and 100'),

    body('humidity.target')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Target humidity must be between 0 and 100'),

    body('lighting.brightness')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Brightness must be between 0 and 100'),

    handleValidationErrors
];

// Device validation rules
const validateDeviceCreation = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Device name must be between 1-50 characters'),

    body('type')
        .isIn(['light', 'fan', 'air_conditioner', 'heater', 'speaker', 'tv', 'camera', 'sensor', 'switch', 'thermostat', 'humidifier', 'dehumidifier', 'other'])
        .withMessage('Invalid device type'),

    body('room')
        .isInt({ min: 1 })
        .withMessage('Invalid room ID'),

    body('brand')
        .optional()
        .trim()
        .isLength({ max: 30 })
        .withMessage('Brand name cannot exceed 30 characters'),

    body('model')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Model name cannot exceed 50 characters'),

    handleValidationErrors
];

// Generic ID validation
const validateId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid ID format'),

    handleValidationErrors
];

// Query validation for pagination
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),

    handleValidationErrors
];

module.exports = {
    validateUserRegistration,
    validateUserLogin,
    validateRoomCreation,
    validateRoomUpdate,
    validateDeviceCreation,
    validateId,
    validatePagination,
    handleValidationErrors
};