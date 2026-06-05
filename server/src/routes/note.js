const express = require('express');
const {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
} = require('../controllers/noteController');
const { validate } = require('../middleware/validate');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.route('/')
  .get(getNotes)
  .post(validate('note'), createNote);

router.route('/:id')
  .get(getNoteById)
  .put(validate('note'), updateNote)
  .delete(deleteNote);

module.exports = router;
