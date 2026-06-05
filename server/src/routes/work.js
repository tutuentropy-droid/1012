const express = require('express');
const {
  getWorks,
  getWorkById,
  createWork,
  updateWork,
  deleteWork,
  updateProgress,
  updateRating,
} = require('../controllers/workController');
const { validate } = require('../middleware/validate');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.route('/')
  .get(getWorks)
  .post(validate('work'), createWork);

router.route('/:id')
  .get(getWorkById)
  .put(validate('work'), updateWork)
  .delete(deleteWork);

router.put('/:id/progress', validate('workProgress'), updateProgress);
router.put('/:id/rating', validate('workRating'), updateRating);

module.exports = router;
