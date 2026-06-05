const express = require('express');
const { globalSearch, getChineseColors } = require('../controllers/searchController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/colors', getChineseColors);
router.get('/', auth, globalSearch);

module.exports = router;
