import React, { useEffect, useState, useCallback, useImperativeHandle } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaCut, FaSyringe, FaStethoscope, FaBone, FaBath, FaCalendarCheck, FaTrash } from 'react-icons/fa';

const CareReminders = React.forwardRef(({ pets, initialItems = null }, ref) => {
  const { authFetch, loading, currentUser } = useAuth();
  const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

  const [reminders, setReminders] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const initialFormState = {
    reminder_id: null,
    pet_id: '',
    title: '',
    reminder_type: 'grooming',
    due_date: '',
    priority: 'normal',
    notes: '',
  };

  // Map raw reminders to UI format
  const mapToUI = (list = []) => {
    return list
      .filter(r => (r.source === 'custom' || r.reminder_type === 'custom'))
      .map((r) => {
        const petIdNum = Number(r.pet_id);
        const pet = (pets || []).find((p) => Number(p.id) === petIdNum) || {};
        const dueInDays = r?.due_in_days != null
          ? Number(r.due_in_days)
          : (r.due_date ? Math.ceil((new Date(r.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null);
        const type = r.reminder_type || r.source || 'custom';
        const meta = getTypeMeta(type);
        const idStr = r.id || r.reminder_id || `custom-${r.pet_id || 'na'}-${r.title || 'untitled'}-${r.due_date || 'na'}`;
        const delId = (r.source === 'custom')
          ? String((idStr && String(idStr).startsWith('custom-')) ? String(idStr).slice(7) : (r.reminder_id || ''))
          : '';
        return {
          id: idStr,
          title: r.title || 'Reminder',
          value: dueInDays != null ? String(dueInDays) : '',
          subtitle: r.subtitle || (dueInDays != null ? 'days left' : (r.due_date ? new Date(r.due_date).toLocaleDateString() : '')),
          pet: {
            id: pet.id,
            name: pet.name || 'Pet',
            image: pet.image,
            imagePath: pet.imagePath,
          },
          icon: meta.icon,
          color: meta.color,
          bgColor: meta.bgColor,
          textColor: meta.textColor,
          priority: (r.priority || 'normal').toLowerCase() === 'high' ? 'high' : 'normal',
          source: 'custom',
          canDelete: !!delId,
          deleteId: delId,
          originalData: r
        };
      })
      .sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (b.priority === 'high' && a.priority !== 'high') return 1;
        const av = parseInt(a.value || '9999', 10);
        const bv = parseInt(b.value || '9999', 10);
        return av - bv;
      });
  };

  const [form, setForm] = useState(initialFormState);

  const resetForm = () => setForm(initialFormState);

  const closeModal = () => {
    setIsOpen(false);
    resetForm();
    setError('');
  };

  // Expose imperative handle for parent component
  useImperativeHandle(ref, () => ({
    openAddModal: () => {
      resetForm();
      setError('');
      const firstPetId = (pets && pets.length > 0) ? pets[0].id : '';
      setForm(f => ({
        ...f,
        pet_id: firstPetId,
        reminder_type: 'custom',
      }));
      setIsOpen(true);
    },
  }));

  const getTypeMeta = (type) => {
    const typeMap = {
      grooming: { icon: FaCut, color: 'from-blue-500 to-[#145ae6]', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
      vaccination: { icon: FaSyringe, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
      checkup: { icon: FaStethoscope, color: 'from-green-500 to-green-600', bgColor: 'bg-green-50', textColor: 'text-green-600' },
      health_checkup: { icon: FaStethoscope, color: 'from-green-500 to-green-600', bgColor: 'bg-green-50', textColor: 'text-green-600' },
      health: { icon: FaStethoscope, color: 'from-green-500 to-green-600', bgColor: 'bg-green-50', textColor: 'text-green-600' },
      dental: { icon: FaBone, color: 'from-yellow-500 to-yellow-600', bgColor: 'bg-yellow-50', textColor: 'text-yellow-600' },
      dental_care: { icon: FaBone, color: 'from-yellow-500 to-yellow-600', bgColor: 'bg-yellow-50', textColor: 'text-yellow-600' },
      flea: { icon: FaBath, color: 'from-blue-500 to-[#145ae6]', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
      flea_prevention: { icon: FaBath, color: 'from-blue-500 to-[#145ae6]', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
      appointment: { icon: FaCalendarCheck, color: 'from-blue-500 to-[#145ae6]', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
    };

    return typeMap[type?.toLowerCase()] || {
      icon: FaCalendarCheck,
      color: 'from-blue-500 to-[#145ae6]',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    };
  };

  const handleEditReminder = (reminder) => {
    setForm({
      reminder_id: reminder.deleteId,
      pet_id: reminder.pet?.id || '',
      title: reminder.title,
      reminder_type: reminder.originalData?.reminder_type || 'custom',
      due_date: reminder.originalData?.due_date?.split('T')[0] || '',
      priority: reminder.priority,
      notes: reminder.originalData?.notes || ''
    });
    setIsOpen(true);
  };

  const handleDeleteReminder = async (id) => {
    if (id == null || id === '') return;
    if (!window.confirm('Delete this reminder?')) return;
    
    try {
      setDeletingId(String(id));
      const res = await authFetch(`${API_URL}/reminders/${id}`, {
        method: 'DELETE',
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
    if (loading || !currentUser) return { items: [] };
    const res = await authFetch(`${API_URL}/reminders`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Failed to load reminders');
    const list = Array.isArray(data) ? data : (data?.items || []);
    const mapped = mapToUI(list);
    setReminders(mapped);
  }, [authFetch, API_URL, pets, loading, currentUser]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!loading && currentUser) {
          if (initialItems && Array.isArray(initialItems) && initialItems.length) {
            const mapped = mapToUI(initialItems);
            if (!cancelled) setReminders(mapped);
          } else {
            await loadReminders();
          }
        } else if (!cancelled) {
          setReminders([]);
        }
      } catch (_e) {
        if (!cancelled) setReminders([]);
      }
    })();
    return () => { cancelled = true; };
  }, [loadReminders, loading, currentUser, initialItems]);

  const submitNewReminder = async (e) => {
    e?.preventDefault?.();
    try {
      setSaving(true);
      setError('');
      
      if (!form.pet_id) {
        setError('Please select a pet');
        return;
      }
      if (!form.title?.trim()) {
        setError('Title is required');
        return;
      }
      
      const payload = {
        pet_id: form.pet_id,
        title: form.title,
        reminder_type: form.reminder_type,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : undefined,
        priority: form.priority,
        notes: form.notes || undefined,
      };
      
      const url = form.reminder_id 
        ? `${API_URL}/reminders/${form.reminder_id}`
        : `${API_URL}/reminders`;
        
      const res = await authFetch(url, {
        method: form.reminder_id ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `Failed to ${form.reminder_id ? 'update' : 'create'} reminder`);
      
      closeModal();
      await loadReminders();
    } catch (err) {
      console.error('Error saving reminder:', err);
      setError(err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // Extracted component for reminder card
  const ReminderCard = ({ reminder, isUrgent = false }) => {
    const IconComponent = reminder.icon;
    const cardClasses = isUrgent 
      ? "bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-red-100 hover:shadow-md transition-all duration-200 group"
      : "bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-gray-100 hover:shadow-md transition-all duration-200 group";

    return (
      <div className={cardClasses}>
        <div className="flex items-start gap-4">
          {/* Pet Photo */}
          <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
            {reminder.pet?.image ? (
              <img 
                src={reminder.pet.image} 
                alt={reminder.pet.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300" 
                 style={{ display: reminder.pet?.image ? 'none' : 'flex' }}>
              <span className="text-2xl text-gray-500">
                {reminder.pet?.name?.charAt(0) || 'P'}
              </span>
            </div>
          </div>
          
          {/* Reminder Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">{reminder.title}</h4>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{reminder.value}</span> {reminder.subtitle}
                </p>
              </div>
              {reminder.canDelete && (
                <button
                  onClick={() => handleDeleteReminder(reminder.deleteId)}
                  disabled={deletingId === reminder.deleteId}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1 -mr-1.5"
                  title="Delete reminder"
                >
                  <FaTrash className="text-sm" />
                </button>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`${reminder.bgColor} rounded-lg p-1.5`}>
                  <IconComponent className={`text-sm ${reminder.textColor}`} />
                </div>
                <span className="text-xs text-gray-500">{reminder.pet?.name}</span>
              </div>
              <button 
                onClick={() => handleEditReminder(reminder)}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const urgentReminders = reminders.filter(r => r.priority === 'high');
  const regularReminders = reminders.filter(r => r.priority !== 'high');

  return (
    <div className="relative space-y-4">
      {/* Priority Reminders */}
      {urgentReminders.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-blue-50 rounded-xl p-4 border border-red-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <h3 className="text-sm font-bold text-red-800">Urgent Care Needed</h3>
          </div>
          <div className="space-y-3">
            {urgentReminders.map((reminder) => (
              <ReminderCard key={reminder.id} reminder={reminder} isUrgent={true} />
            ))}
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
        </div>
        {regularReminders.length > 0 ? (
          <div className="space-y-3">
            {regularReminders.map((reminder) => (
              <ReminderCard key={reminder.id} reminder={reminder} />
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No upcoming care reminders.</div>
        )}
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-800">
                {form.reminder_id ? 'Edit Reminder' : 'Add Reminder'}
              </h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={submitNewReminder} className="space-y-3">
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs text-gray-600 mb-1">Pet</label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={form.pet_id}
                  onChange={(e) => setForm(f => ({ ...f, pet_id: e.target.value }))}
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
                <input 
                  className="w-full border rounded-md px-3 py-2 text-sm" 
                  value={form.title} 
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} 
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Type</label>
                  <select 
                    className="w-full border rounded-md px-3 py-2 text-sm" 
                    value={form.reminder_type} 
                    onChange={(e) => setForm(f => ({ ...f, reminder_type: e.target.value }))}
                  >
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
                  <input 
                    type="date" 
                    className="w-full border rounded-md px-3 py-2 text-sm" 
                    value={form.due_date} 
                    onChange={(e) => setForm(f => ({ ...f, due_date: e.target.value }))} 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Priority</label>
                <select 
                  className="w-full border rounded-md px-3 py-2 text-sm" 
                  value={form.priority} 
                  onChange={(e) => setForm(f => ({ ...f, priority: e.target.value }))}
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Notes</label>
                <textarea 
                  className="w-full border rounded-md px-3 py-2 text-sm" 
                  rows={3} 
                  value={form.notes} 
                  onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} 
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  className="px-3 py-2 text-sm rounded-md bg-gray-100 hover:bg-gray-200" 
                  onClick={closeModal} 
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60" 
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
});

export default CareReminders;
