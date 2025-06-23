const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const {
  register, // <-- ДОБАВЕНО ТУК
  login,
  getMe,
  updateProfile,
  changePassword
} = require('../controllers/auth');

const router = express.Router();

// NEW: Register route for pending users
// @route   POST /api/auth/register
// @desc    Register a new user with 'pending' status
// @access  Public
router.post('/register', [
  body('fullName')
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('email')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail()
    .withMessage('Email is required'),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .exists().withMessage('Password is required')
], register); // <-- Използваме импортираната функция 'register'

// @route   POST /api/auth/login
// @desc    Login user & get token
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please include a valid email'),
  body('password')
    .exists()
    .withMessage('Password is required')
], login);

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, getMe);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  protect,
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Full name must be at least 2 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please include a valid email')
], updateProfile);

// @route   PUT /api/auth/password
// @desc    Change password
// @access  Private
router.put('/password', [
  protect,
  body('currentPassword')
    .exists()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
], changePassword);

module.exports = router;