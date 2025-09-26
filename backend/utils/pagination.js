/**
 * Calculate pagination values
 * @param {Number} page - Current page number
 * @param {Number} limit - Items per page
 * @param {Number} total - Total number of items
 * @returns {Object} Pagination object
 */
const calculatePagination = (page = 1, limit = 10, total = 0) => {
    const currentPage = Math.max(1, parseInt(page));
    const itemsPerPage = Math.min(100, Math.max(1, parseInt(limit)));
    const totalPages = Math.ceil(total / itemsPerPage);
    const skip = (currentPage - 1) * itemsPerPage;

    return {
        current: currentPage,
        pages: totalPages,
        total,
        limit: itemsPerPage,
        skip,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1
    };
};

/**
 * Get pagination parameters from query
 * @param {Object} query - Express query object
 * @returns {Object} Pagination parameters
 */
const getPaginationFromQuery = (query) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    return { page, limit };
};

module.exports = {
    calculatePagination,
    getPaginationFromQuery
};