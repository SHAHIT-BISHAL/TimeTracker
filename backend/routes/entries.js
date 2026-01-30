import express from 'express';
import { dbRun, dbGet, dbAll } from '../server.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Edit a time entry
router.put('/:entryId', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const entryId = req.params.entryId;
  const { clock_in, clock_out, notes } = req.body;

  try {
    const entry = await dbGet(
      'SELECT * FROM time_entries WHERE id = ? AND user_id = ?',
      [entryId, userId]
    );

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    let durationMinutes = entry.duration_minutes;
    if (clock_in && clock_out) {
      const start = new Date(clock_in);
      const end = new Date(clock_out);
      durationMinutes = Math.floor((end - start) / 60000);
    }

    await dbRun(
      'UPDATE time_entries SET clock_in = ?, clock_out = ?, duration_minutes = ?, notes = ?, updated_at = now() WHERE id = ?',
      [clock_in || entry.clock_in, clock_out || entry.clock_out, durationMinutes, notes || null, entryId]
    );

    const updated = await dbGet('SELECT * FROM time_entries WHERE id = ?', [entryId]);
    res.json({ message: 'Entry updated', entry: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a time entry
router.delete('/:entryId', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const entryId = req.params.entryId;

  try {
    const entry = await dbGet(
      'SELECT * FROM time_entries WHERE id = ? AND user_id = ?',
      [entryId, userId]
    );

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    await dbRun('DELETE FROM time_entries WHERE id = ?', [entryId]);
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export entries as CSV
router.get('/export/csv', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate } = req.query;

  try {
    let sql = 'SELECT * FROM time_entries WHERE user_id = ?';
    let params = [userId];

    if (startDate && endDate) {
      sql += ' AND clock_in >= ? AND clock_in <= ?';
      params.push(startDate, endDate);
    }

    sql += ' ORDER BY clock_in ASC';
    const entries = await dbAll(sql, params);

    // Generate CSV
    const headers = ['Date', 'Clock In', 'Clock Out', 'Duration (hours)', 'Notes'];
    const rows = entries.map(e => [
      new Date(e.clock_in).toLocaleDateString(),
      new Date(e.clock_in).toLocaleTimeString(),
      e.clock_out ? new Date(e.clock_out).toLocaleTimeString() : 'N/A',
      (e.duration_minutes / 60).toFixed(2),
      e.notes || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="timetracker-export.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
