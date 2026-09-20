const db = require('../config/db');

/* GET /api/events
 * Returns all events with a count of linked tasks */

const getAllEvents = async (req, res) => {
  try {
    const [events] = await db.query(`
      SELECT 
        e.id,
        e.name,
        e.description,
        e.location,
        e.event_time,
        e.event_date,
        e.status,
        e.created_at,
        creator.full_name AS created_by_name,
        COUNT(t.id) AS task_count
      FROM events e
      LEFT JOIN users creator ON e.created_by = creator.id
      LEFT JOIN tasks t ON t.event_id = e.id
      GROUP BY e.id
      ORDER BY e.event_date ASC
    `);
    res.status(200).json(events);
  } catch (err) {
    console.error('Get events error:', err);
    res.status(500).json({ message: 'Failed to retrieve events.' });
  }
};

/* GET /api/events/:id
 * Returns a single event with all its linked tasks */

const getEventById = async (req, res) => {
  const { id } = req.params;
  try {
    const [events] = await db.query(`
      SELECT 
        e.id,
        e.name,
        e.description,
        e.location,
        e.event_time,
        e.event_date,
        e.status,
        e.created_at,
        creator.full_name AS created_by_name
      FROM events e
      LEFT JOIN users creator ON e.created_by = creator.id
      WHERE e.id = ?
    `, [id]);

    if (events.length === 0) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const [tasks] = await db.query(`
      SELECT 
        t.id,
        t.title,
        t.status,
        t.priority,
        t.deadline,
        u.full_name AS assigned_to_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.event_id = ?
      ORDER BY t.created_at ASC
    `, [id]);

    res.status(200).json({ ...events[0], tasks });
  } catch (err) {
    console.error('Get event error:', err);
    res.status(500).json({ message: 'Failed to retrieve event.' });
  }
};

/* POST /api/events
 * Creates a new event (president and treasurer only) */

const createEvent = async (req, res) => {
  const { name, description, location, event_time, event_date, status } = req.body;

  if (!name || !event_date) {
    return res.status(400).json({ message: 'Event name and date are required.' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO events (name, description, location, event_time, event_date, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || null,
        location || null,
        event_time || null,
        event_date,
        status || 'upcoming',
        req.user.id,
      ]
    );
    res.status(201).json({ message: 'Event created successfully.', eventId: result.insertId });
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ message: 'Failed to create event.' });
  }
};

/* PUT /api/events/:id
 * Updates an event (president and treasurer only) */

const updateEvent = async (req, res) => {
  const { id } = req.params;
  const { name, description, location, event_time, event_date, status } = req.body;

  try {
    const [events] = await db.query('SELECT * FROM events WHERE id = ?', [id]);
    if (events.length === 0) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    await db.query(
      `UPDATE events SET name = ?, description = ?, location = ?, event_time = ?, event_date = ?, status = ? WHERE id = ?`,
      [name, description || null, location || null, event_time || null, event_date, status, id]
    );
    res.status(200).json({ message: 'Event updated successfully.' });
  } catch (err) {
    console.error('Update event error:', err);
    res.status(500).json({ message: 'Failed to update event.' });
  }
};

/* DELETE /api/events/:id
 * Deletes an event (president and treasurer only) */

const deleteEvent = async (req, res) => {
  const { id } = req.params;

  try {
    const [events] = await db.query('SELECT * FROM events WHERE id = ?', [id]);
    if (events.length === 0) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    await db.query('DELETE FROM events WHERE id = ?', [id]);
    res.status(200).json({ message: 'Event deleted successfully.' });
  } catch (err) {
    console.error('Delete event error:', err);
    res.status(500).json({ message: 'Failed to delete event.' });
  }
};

module.exports = { getAllEvents, getEventById, createEvent, updateEvent, deleteEvent };