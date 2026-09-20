const db = require('../config/db');

/* GET /api/notes
 * Returns all notes with author name */

const getAllNotes = async (req, res) => {
  try {
    const [notes] = await db.query(`
      SELECT 
        n.id,
        n.title,
        n.content,
        n.created_at,
        n.updated_at,
        u.full_name AS created_by_name
      FROM notes n
      LEFT JOIN users u ON n.created_by = u.id
      ORDER BY n.updated_at DESC
    `);
    res.status(200).json(notes);
  } catch (err) {
    console.error('Get notes error:', err);
    res.status(500).json({ message: 'Failed to retrieve notes.' });
  }
};

/* POST /api/notes
 * Creates a new note
 * Any logged in user can create a note */

const createNote = async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO notes (title, content, created_by) VALUES (?, ?, ?)',
      [title, content, req.user.id]
    );
    res.status(201).json({ message: 'Note created successfully.', noteId: result.insertId });
  } catch (err) {
    console.error('Create note error:', err);
    res.status(500).json({ message: 'Failed to create note.' });
  }
};

/* PUT /api/notes/:id
 * Updates a note
 * Any logged in user can edit any note (collaborative handover document) */

const updateNote = async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }

  try {
    const [notes] = await db.query('SELECT * FROM notes WHERE id = ?', [id]);
    if (notes.length === 0) {
      return res.status(404).json({ message: 'Note not found.' });
    }

    await db.query(
      'UPDATE notes SET title = ?, content = ? WHERE id = ?',
      [title, content, id]
    );
    res.status(200).json({ message: 'Note updated successfully.' });
  } catch (err) {
    console.error('Update note error:', err);
    res.status(500).json({ message: 'Failed to update note.' });
  }
};

/* DELETE /api/notes/:id
 * Deletes a note
 * Only the author or a president can delete */

const deleteNote = async (req, res) => {
  const { id } = req.params;

  try {
    const [notes] = await db.query('SELECT * FROM notes WHERE id = ?', [id]);
    if (notes.length === 0) {
      return res.status(404).json({ message: 'Note not found.' });
    }

    const note = notes[0];
    const isAuthor = note.created_by === req.user.id;
    const isPresident = req.user.role === 'president';

    if (!isAuthor && !isPresident) {
      return res.status(403).json({ message: 'You can only delete your own notes.' });
    }

    await db.query('DELETE FROM notes WHERE id = ?', [id]);
    res.status(200).json({ message: 'Note deleted successfully.' });
  } catch (err) {
    console.error('Delete note error:', err);
    res.status(500).json({ message: 'Failed to delete note.' });
  }
};

module.exports = { getAllNotes, createNote, updateNote, deleteNote };