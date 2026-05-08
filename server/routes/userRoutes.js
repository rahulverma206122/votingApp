const express = require('express');
const router = express.Router();
const { jwtAuthMiddleware } = require('../middleware/auth'); // ✅ fixed
const { signup, login, getProfile, updatePassword } = require('../controllers/userController');

router.post('/signup',            signup);
router.post('/login',             login);
router.get('/profile',            jwtAuthMiddleware, getProfile);
router.put('/profile/password',   jwtAuthMiddleware, updatePassword);

module.exports = router;