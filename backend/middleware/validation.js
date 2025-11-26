const { body, param, query, validationResult } = require("express-validator");

// Helper function to handle validation results
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array(),
        });
    }
    next();
};

// User validation rules
const validateUserRegistration = [
    body("username").trim().isLength({ min: 3, max: 100 }).withMessage("Username must be between 3-100 characters"),

    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),

    body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Name must be between 2-100 characters"),

    body("birthday").optional().isISO8601().withMessage("Please provide a valid date in YYYY-MM-DD format"),

    body("adaUsername")
        .trim()
        .notEmpty()
        .withMessage("Adafruit IO username is required")
        .isLength({ min: 3, max: 100 })
        .withMessage("Adafruit IO username must be between 3-100 characters"),

    body("adakey")
        .trim()
        .notEmpty()
        .withMessage("Adafruit IO key is required")
        .isLength({ min: 10, max: 100 })
        .withMessage("Adafruit IO key must be between 10-100 characters"),

    handleValidationErrors,
];

const validateUserLogin = [
    body("username").trim().notEmpty().withMessage("Username is required"),

    body("password").notEmpty().withMessage("Password is required"),

    handleValidationErrors,
];

// Room validation rules
const validateRoomCreation = [
    body("name").trim().isLength({ min: 1, max: 100 }).withMessage("Room name must be between 1-100 characters"),

    body("adaUsername")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Ada username cannot exceed 100 characters"),

    body("adakey").optional().trim().isLength({ max: 100 }).withMessage("Ada key cannot exceed 100 characters"),

    handleValidationErrors,
];

const validateRoomUpdate = [
    param("id").isInt({ min: 1 }).withMessage("Invalid room ID"),

    body("name")
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage("Room name must be between 1-100 characters"),

    body("isOccupied").optional().isBoolean().withMessage("isOccupied must be a boolean"),

    body("adaUsername")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Ada username cannot exceed 100 characters"),

    body("adakey").optional().trim().isLength({ max: 100 }).withMessage("Ada key cannot exceed 100 characters"),

    body("humidity.target")
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage("Target humidity must be between 0 and 100"),

    body("lighting.brightness")
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage("Brightness must be between 0 and 100"),

    handleValidationErrors,
];

// Device validation rules
const validateDeviceCreation = [
    body("name").trim().isLength({ min: 1, max: 100 }).withMessage("Device name must be between 1-100 characters"),

    body("type").trim().isLength({ min: 1, max: 100 }).withMessage("Device type must be between 1-100 characters"),

    body("room_id").isInt({ min: 1 }).withMessage("Invalid room ID"),

    handleValidationErrors,
];

// Generic ID validation
const validateId = [param("id").isInt({ min: 1 }).withMessage("Invalid ID format"), handleValidationErrors];

// Room ID validation (for routes using :roomId parameter)
const validateRoomId = [
    param("roomId").isInt({ min: 1 }).withMessage("Invalid room ID format"),

    handleValidationErrors,
];

// Query validation for pagination
const validatePagination = [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),

    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),

    handleValidationErrors,
];

module.exports = {
    validateUserRegistration,
    validateUserLogin,
    validateRoomCreation,
    validateRoomUpdate,
    validateDeviceCreation,
    validateId,
    validateRoomId,
    validatePagination,
    handleValidationErrors,
};
