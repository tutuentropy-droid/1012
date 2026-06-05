const noteService = require('../services/noteService');
const { asyncHandler } = require('../utils');

const getNotes = asyncHandler(async (req, res) => {
  const result = await noteService.getNotes(req.user._id, req.query);
  res.json(result);
});

const getNoteById = asyncHandler(async (req, res) => {
  const note = await noteService.getNoteById(req.user._id, req.params.id);
  res.json(note);
});

const createNote = asyncHandler(async (req, res) => {
  const note = await noteService.createNote(req.user._id, req.body);
  res.status(201).json(note);
});

const updateNote = asyncHandler(async (req, res) => {
  const note = await noteService.updateNote(req.user._id, req.params.id, req.body);
  res.json(note);
});

const deleteNote = asyncHandler(async (req, res) => {
  const result = await noteService.deleteNote(req.user._id, req.params.id);
  res.json(result);
});

module.exports = { getNotes, getNoteById, createNote, updateNote, deleteNote };
