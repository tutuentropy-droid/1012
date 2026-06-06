const express = require('express');
const { register, login, getMe, updatePreferences, addTasteSeal, removeTasteSeal } = require('../controllers/authController');
const { validate } = require('../middleware/validate');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/register', validate('register'), register);
router.post('/login', validate('login'), login);
router.get('/me', auth, getMe);
router.put('/preferences', auth, updatePreferences);
router.post('/taste-seal', auth, addTasteSeal);
router.delete('/taste-seal/:category/:name', auth, removeTasteSeal);

module.exports = router;
