const express = require('express');
const authRoutes = require('./auth');
const workRoutes = require('./work');
const noteRoutes = require('./note');
const tagRoutes = require('./tag');
const statsRoutes = require('./stats');
const searchRoutes = require('./search');
const importRoutes = require('./import');
const kgRoutes = require('./kg');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/works', workRoutes);
router.use('/notes', noteRoutes);
router.use('/tags', tagRoutes);
router.use('/stats', statsRoutes);
router.use('/search', searchRoutes);
router.use('/import', importRoutes);
router.use('/kg', kgRoutes);

module.exports = router;
