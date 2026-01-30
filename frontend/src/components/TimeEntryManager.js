import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Edit2, Download } from 'lucide-react';
import ManualEntryForm from './ManualEntryForm';
import './TimeEntryManager.css';

export default function TimeEntryManager() {
  const [entries, setEntries] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('http://localhost:5000/api/time/entries', config);
      setEntries(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching entries:', error);
      setLoading(false);
    }
  };

  const startEditing = (entry) => {
    setEditingId(entry.id);
    setEditData({
      clock_in: entry.clock_in.slice(0, 16),
      clock_out: entry.clock_out ? entry.clock_out.slice(0, 16) : '',
      notes: entry.notes || '',
      project: entry.project || ''
    });
  };

  const saveEdit = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`http://localhost:5000/api/entries/${editingId}`, editData, config);
      setEditingId(null);
      setMessage('Entry updated successfully');
      setTimeout(() => setMessage(''), 3000);
      fetchEntries();
    } catch (error) {
      setMessage('Error updating entry');
      console.error(error);
    }
  };

  const deleteEntry = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.delete(`http://localhost:5000/api/entries/${id}`, config);
        setMessage('Entry deleted successfully');
        setTimeout(() => setMessage(''), 3000);
        fetchEntries();
      } catch (error) {
        setMessage('Error deleting entry');
        console.error(error);
      }
    }
  };

  const exportCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      };
      const res = await axios.get('http://localhost:5000/api/entries/export/csv', config);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'time-entries.csv');
      document.body.appendChild(link);
      link.click();
      link.parentChild.removeChild(link);
    } catch (error) {
      setMessage('Error exporting CSV');
      console.error(error);
    }
  };

  if (loading) return <div className="entry-manager">Loading entries...</div>;

  return (
    <div className="entry-manager">
      <div className="manager-header">
        <h2>Time Entries</h2>
        <div className="header-actions">
          <ManualEntryForm onEntryAdded={fetchEntries} />
          <button className="export-btn" onClick={exportCSV}>
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      {message && <div className="message">{message}</div>}

      <div className="entries-table-wrapper">
        <table className="entries-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Duration</th>
              <th>Project</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => (
              <tr key={entry.id} className={editingId === entry.id ? 'editing' : ''}>
                <td>{new Date(entry.clock_in).toLocaleDateString()}</td>
                <td>
                  {editingId === entry.id ? (
                    <input
                      type="datetime-local"
                      value={editData.clock_in}
                      onChange={(e) => setEditData({ ...editData, clock_in: e.target.value })}
                    />
                  ) : (
                    new Date(entry.clock_in).toLocaleTimeString()
                  )}
                </td>
                <td>
                  {editingId === entry.id ? (
                    <input
                      type="datetime-local"
                      value={editData.clock_out}
                      onChange={(e) => setEditData({ ...editData, clock_out: e.target.value })}
                    />
                  ) : (
                    entry.clock_out ? new Date(entry.clock_out).toLocaleTimeString() : '-'
                  )}
                </td>
                <td>{entry.duration_minutes ? `${(entry.duration_minutes / 60).toFixed(2)}h` : '-'}</td>
                <td>
                  {editingId === entry.id ? (
                    <input
                      type="text"
                      value={editData.project}
                      onChange={(e) => setEditData({ ...editData, project: e.target.value })}
                      placeholder="Project name"
                    />
                  ) : (
                    entry.project || '-'
                  )}
                </td>
                <td>
                  {editingId === entry.id ? (
                    <input
                      type="text"
                      value={editData.notes}
                      onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                      placeholder="Notes"
                    />
                  ) : (
                    entry.notes || '-'
                  )}
                </td>
                <td>
                  {editingId === entry.id ? (
                    <>
                      <button className="save-btn" onClick={saveEdit}>Save</button>
                      <button className="cancel-btn" onClick={() => setEditingId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="edit-btn" onClick={() => startEditing(entry)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="delete-btn" onClick={() => deleteEntry(entry.id)}>
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {entries.length === 0 && <p className="no-entries">No time entries found</p>}
    </div>
  );
}
