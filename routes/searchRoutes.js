// routes/searchRoutes.js
const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { verifyToken } = require('../controllers/authController');
const { searchSchema } = require('../validation/search');

// Validation middleware
const validateSearch = (req, res, next) => {
    const { error } = searchSchema.validate(req.query);
    if (error) {
        return res.status(400).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: error.details[0].message
        });
    }
    next();
};

// Apply authentication middleware to all search routes
router.use(verifyToken);

// Advanced search endpoint with validation
router.get('/advanced', validateSearch, searchController.advancedSearch);

// Quick search for autocomplete
router.get('/quick', searchController.quickSearch);

// Get IOC by hash or ID
router.get('/ioc/:hash', searchController.getIocByHash);

// Get available search filters
router.get('/filters', searchController.getSearchFilters);

// Export search results with validation
router.get('/export', searchController.exportSearchResults);

module.exports = router;
