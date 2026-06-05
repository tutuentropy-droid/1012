const express = require('express');
const { getTags, createTag, updateTag, deleteTag } = require('../controllers/tagController');
const { validate } = require('../middleware/validate');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.route('/')
  .get(getTags)
  .post(validate('tag'), createTag);

router.route('/:id')
  .put(validate('tag'), updateTag)
  .delete(deleteTag);

module.exports = router;
