/**
 * Send standardized API response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {Boolean} success - Success status
 * @param {String} message - Response message
 * @param {Object} data - Response data
 * @param {Object} meta - Additional metadata
 */
const sendResponse = (res, statusCode, success, message, data = null, meta = null) => {
    const response = {
        success,
        message,
        ...(data && { data }),
        ...(meta && { meta }),
        timestamp: new Date().toISOString()
    };

    return res.status(statusCode).json(response);
};

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {String} message - Success message
 * @param {Object} data - Response data
 * @param {Number} statusCode - HTTP status code (default: 200)
 */
const sendSuccess = (res, message, data = null, statusCode = 200) => {
    return sendResponse(res, statusCode, true, message, data);
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Number} statusCode - HTTP status code (default: 500)
 * @param {Object} error - Error details (only in development)
 */
const sendError = (res, message, statusCode = 500, error = null) => {
    const errorData = process.env.NODE_ENV === 'development' && error ? { error } : null;
    return sendResponse(res, statusCode, false, message, errorData);
};

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {String} message - Success message
 * @param {Array} items - Array of items
 * @param {Object} pagination - Pagination info
 */
const sendPaginatedResponse = (res, message, items, pagination) => {
    return sendResponse(res, 200, true, message, { items }, { pagination });
};

module.exports = {
    sendResponse,
    sendSuccess,
    sendError,
    sendPaginatedResponse
};