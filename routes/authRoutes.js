// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/check-email', authController.checkEmail);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Protected routes (require token)
router.get('/me', authController.verifyToken, authController.getCurrentUser);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.verifyToken, authController.logout);

module.exports = router;
