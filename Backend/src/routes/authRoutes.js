const express = require('express');
const AuthController = require('../controllers/authController');

const router = express.Router();

router.post('/login', AuthController.login);
router.get('/google', AuthController.googleLogin);
router.get('/google/callback', AuthController.googleCallback);

module.exports = router;
