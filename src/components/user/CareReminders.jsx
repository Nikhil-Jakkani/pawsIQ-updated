import React from 'react';
import { FaCut, FaSyringe, FaStethoscope, FaBone, FaBath, FaCalendarCheck, FaPlus, FaTrash } from 'react-icons/fa';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

const CareReminders = ({ pets }) => {
  const { currentUser } = useAuth();
  const accessToken = currentUser?.tokens?.access?.token;
  const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

  const [reminders, setReminders] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState({
    pet_id: '',
    title: '',
    reminder_type: 'grooming',
    due_date: '',
    priority: 'normal',
    notes: '',
  });

  const resetForm = () => setForm({ pet_id: '', title: '', reminder_type: 'grooming', due_date: '', priority: 'normal', notes: '' });

  const getTypeMeta = (type) => {
    const t = (type || '').toLowerCase();
    switch (t) {
      case 'grooming':
        return { icon: FaCut, color: 'from-pink-500 to-pink-600', bgColor: 'bg-pink-50', textColor: 'text-pink-600' };
      case 'vaccination':
        return { icon: FaSyringe, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50', textColor: 'text-blue-600' };
      case 'checkup':
      case 'health_checkup':
      case 'health':
        return { icon: FaStethoscope, color: 'from-green-500 to-green-600', bgColor: 'bg-green-50', textColor: 'text-green-600' };
      case 'dental':
      case 'dental_care':
        return { icon: FaBone, color: 'from-yellow-500 to-yellow-600', bgColor: 'bg-yellow-50', textColor: 'text-yellow-600' };
      case 'flea':
      case 'flea_prevention':
        return { icon: FaBath, color: 'from-blue-500 to-[#145ae6]', bgColor: 'bg-blue-50', textColor: 'text-blue-600' };
      case 'appointment':
        return { icon: FaCalendarCheck, color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50', textColor: 'text-purple-600' };
      default:
        return { icon: FaCalendarCheck, color: 'from-blue-500 to-[#145ae6]', bgColor: 'bg-blue-50', textColor: 'text-blue-600' };
    }
  };

  const handleDeleteReminder = async (id) => {
    if (!id || !accessToken) return;
    if (!window.confirm('Delete this reminder?')) return;
    try {
      setDeletingId(id);
      const res = await fetch(`${API_URL}/reminders/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to delete reminder');
      await loadReminders();
    } catch (_err) {
      // Optionally show toast
    } finally {
      setDeletingId(null);
    }
  };

  const loadReminders = useCallback(async () => {
    const res = await fetch(`${API_URL}/reminders`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Failed to load reminders');

    const list = Array.isArray(data) ? data : (data?.items || []);
    const mapped = list
      .map((r) => {
        const petIdNum = Number(r.pet_id);
        const pet = (pets || []).find((p) => Number(p.id) === petIdNum);
        const dueInDays = typeof r.due_in_days === 'number'
          ? r.due_in_days
          : (r.due_date ? Math.ceil((new Date(r.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null);
        const type = r.reminder_type || r.source || 'care';
        const meta = getTypeMeta(type);
        const src = r.source || (r.reminder_type === 'custom' ? 'custom' : null);
        let delId = null;
        if (src === 'custom') {
          if (typeof r.id === 'string' && r.id.startsWith('custom-')) {
            const parts = r.id.split('-');
            delId = parts.length > 1 ? parseInt(parts[1], 10) : null;
          } else if (r.reminder_id != null) {
            delId = Number(r.reminder_id);
          }
        }
        return {
          id: r.id ?? r.reminder_id ?? `${petIdNum}-${r.title}-${r.due_date || ''}`,
          title: r.title || 'Care Reminder',
          value: dueInDays != null ? String(dueInDays) : '',
          subtitle: dueInDays != null ? 'days left' : (r.due_date ? new Date(r.due_date).toLocaleDateString() : ''),
          petName: pet?.name || 'Pet',
          icon: meta.icon,
          color: meta.color,
          bgColor: meta.bgColor,
          textColor: meta.textColor,
          priority: ((r.priority || 'normal').toLowerCase() === 'high' || (typeof dueInDays === 'number' && dueInDays <= 3)) ? 'high' : 'normal',
          source: src,
          canDelete: !!delId,
          deleteId: delId,
        };
      })
      .sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (b.priority === 'high' && a.priority !== 'high') return 1;
        const av = parseInt(a.value || '9999', 10);
        const bv = parseInt(b.value || '9999', 10);
        return av - bv;
      })
      .slice(0, 6);

    setReminders(mapped);
  }, [accessToken, API_URL, pets]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!accessToken) {
          if (!cancelled) setReminders([]);
          return;
        }
        await loadReminders();
      } catch (_e) {
        if (!cancelled) setReminders([]);
      }
    })();
    return () => { cancelled = true; };
  }, [accessToken, loadReminders]);

  const submitNewReminder = async (e) => {
    e?.preventDefault?.();
    if (!accessToken) return;
    try {
      setSaving(true);
      const payload = {
        pet_id: form.pet_id,
        title: form.title,
        reminder_type: form.reminder_type,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : undefined,
        priority: form.priority,
        notes: form.notes || undefined,
      };
      const res = await fetch(`${API_URL}/reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to create reminder');
      setIsOpen(false);
      resetForm();
      await loadReminders();
    } catch (_err) {
      // Optionally show toast
    } finally {
      setSaving(false);
    }
  };

  // Note: We always render the Upcoming Care header so the '+' button is visible even with no reminders

  return (
    <div className="space-y-4">
      {/* Priority Reminders */}
      {reminders.filter(r => r.priority === 'high').length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border border-red-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <h3 className="text-sm font-bold text-red-800">Urgent Care Needed</h3>
          </div>
          <div className="space-y-3">
            {reminders.filter(r => r.priority === 'high').map((reminder) => {
              const IconComponent = reminder.icon;
              return (
                <div 
                  key={reminder.id}
                  className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-red-100 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`${reminder.bgColor} rounded-lg p-2.5 group-hover:scale-105 transition-transform duration-200 flex-shrink-0`}>
                      <IconComponent className={`text-base ${reminder.textColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-baseline gap-2">
                          <span className={`text-lg font-bold bg-gradient-to-r ${reminder.color} bg-clip-text text-transparent`}>
                            {reminder.value}
                          </span>
                          <span className="text-xs text-gray-500">{reminder.subtitle}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {reminder.canDelete && (
                            <button
                              onClick={() => handleDeleteReminder(reminder.deleteId)}
                              disabled={deletingId === reminder.deleteId}
                              className="p-1.5 rounded-md text-red-600 hover:bg-red-50 disabled:opacity-60"
                              title="Delete reminder"
                            >
                              <FaTrash className="text-xs" />
                            </button>
                          )}
                          <div className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium flex-shrink-0">
                            Urgent
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-gray-800 mb-2">
                        {reminder.title}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                          <img 
                            src={`https://images.unsplash.com/photo-${reminder.petName === 'Max' ? '1552053831-71594a27632d' : '1592194996308-7b43878e84a6'}?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=60`} 
                            alt={reminder.petName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-xs text-gray-600 font-medium">{reminder.petName}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Regular Reminders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <h3 className="text-sm font-semibold text-gray-700">Upcoming Care</h3>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            title="Add reminder"
          >
            <FaPlus className="text-sm" />
          </button>
        </div>
        {reminders.filter(r => r.priority !== 'high').length > 0 ? (
          <div className="space-y-3">
            {reminders.filter(r => r.priority !== 'high').map((reminder) => {
              const IconComponent = reminder.icon;
              return (
                <div 
                  key={reminder.id}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-4 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-300 group"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`${reminder.bgColor} rounded-lg p-2.5 group-hover:scale-105 transition-transform duration-200 shadow-sm flex-shrink-0`}>
                      <IconComponent className={`text-base ${reminder.textColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className={`text-xl font-bold bg-gradient-to-r ${reminder.color} bg-clip-text text-transparent`}>
                          {reminder.value}
                        </span>
                        <span className="text-xs text-gray-500">{reminder.subtitle}</span>
                      </div>
                      <div className="text-sm font-semibold text-gray-800">
                        {reminder.title}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                        <img 
                          src={`https://images.unsplash.com/photo-${reminder.petName === 'Max' ? '1552053831-71594a27632d' : '1592194996308-7b43878e84a6'}?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=60`} 
                          alt={reminder.petName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-xs text-gray-600 font-medium">{reminder.petName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {reminder.canDelete && (
                        <button
                          onClick={() => handleDeleteReminder(reminder.deleteId)}
                          disabled={deletingId === reminder.deleteId}
                          className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-full font-medium transition-colors flex-shrink-0 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      )}
                      <button className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full font-medium transition-colors flex-shrink-0">
                        Schedule
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No upcoming care reminders.</div>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-800">Add Reminder</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={submitNewReminder} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Pet</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={form.pet_id}
                onChange={(e) => setForm((f) => ({ ...f, pet_id: e.target.value }))}
                required
              >
                <option value="" disabled>Select a pet</option>
                {(pets || []).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Title</label>
              <input className="w-full border rounded-md px-3 py-2 text-sm" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Type</label>
                <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.reminder_type} onChange={(e) => setForm((f) => ({ ...f, reminder_type: e.target.value }))}>
                  <option value="grooming">Grooming</option>
                  <option value="vaccination">Vaccination</option>
                  <option value="checkup">Checkup</option>
                  <option value="dental">Dental</option>
                  <option value="flea">Flea Prevention</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Due date</label>
                <input type="date" className="w-full border rounded-md px-3 py-2 text-sm" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Priority</label>
                <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Notes</label>
              <textarea className="w-full border rounded-md px-3 py-2 text-sm" rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" className="px-3 py-2 text-sm rounded-md bg-gray-100 hover:bg-gray-200" onClick={() => setIsOpen(false)} disabled={saving}>Cancel</button>
              <button type="submit" className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
);
};

export default CareReminders;