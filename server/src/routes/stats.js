const express = require('express');
const {
  getOverview,
  getWeeklyHeatmap,
  getMonthlyStats,
  getAnnualReport,
} = require('../controllers/statsController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/overview', getOverview);
router.get('/weekly-heatmap', getWeeklyHeatmap);
router.get('/monthly', getMonthlyStats);
router.get('/annual-report/:year', getAnnualReport);

module.exports = router;
