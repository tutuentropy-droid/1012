const express = require('express');
const { previewImport, confirmImport } = require('../controllers/importController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.post('/preview', previewImport);
router.post('/confirm', confirmImport);

module.exports = router;
