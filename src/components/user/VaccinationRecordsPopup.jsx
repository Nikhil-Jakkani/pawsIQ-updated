import React, { useState, useMemo } from 'react';
import { FaTimes, FaPlus, FaTrash, FaSyringe, FaCheck } from 'react-icons/fa';

// Popup to add multiple vaccination records at once
// Each entry supports: vaccine name (from common list or custom), record date, next due date (optional), notes (optional), one file (optional)
// Also supports global toggles: create reminder(s) and open appointment booking after save
const VaccinationRecordsPopup = ({ isOpen, onClose, onSubmit, petName = 'your pet', petType = 'dog' }) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  const today = new Date().toISOString().split('T')[0];

  const commonVaccines = useMemo(() => {
    const base = {
      dog: [
        'Rabies',
        'DHPP',
        'Bordetella',
        'Leptospirosis',
        'Lyme'
      ],
      cat: [
        'Rabies',
        'FVRCP',
        'FeLV'
      ],
      bird: [
        'Polyomavirus'
      ],
      other: ['Rabies']
    };
    const key = (petType || '').toLowerCase();
    return base[key] || base.other;
  }, [petType]);

  const [entries, setEntries] = useState([
    { vaccineName: '', recordDate: today, nextDueDate: '', notes: '', file: null }
  ]);

  const [createReminder, setCreateReminder] = useState(true);
  const [bookAppointment, setBookAppointment] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleEntryChange = (index, field, value) => {
    setEntries(prev => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)));
  };

  const handleFileChange = (index, file) => {
    if (!file) return;
    if (!allowedTypes.includes(file.type)) {
      setError(`File "${file.name}" is not a supported format. Please use PDF, JPG, PNG, or DOCX files.`);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError(`File "${file.name}" exceeds the 10MB size limit.`);
      return;
    }
    setError('');
    setEntries(prev => prev.map((e, i) => (i === index ? { ...e, file } : e)));
  };

  const addEntry = () => {
    setEntries(prev => [...prev, { vaccineName: '', recordDate: today, nextDueDate: '', notes: '', file: null }]);
  };

  const removeEntry = (index) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    if (entries.length === 0) return 'Please add at least one vaccine entry.';
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      if (!e.vaccineName?.trim()) return `Entry ${i + 1}: Vaccine name is required.`;
      if (!e.recordDate) return `Entry ${i + 1}: Record date is required.`;
      if (e.nextDueDate && e.nextDueDate < e.recordDate) return `Entry ${i + 1}: Next due date cannot be before record date.`;
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setError('');
    const v = validate();
    if (v) { setError(v); return; }

    try {
      setSubmitting(true);
      await onSubmit({ entries, createReminder, bookAppointment });
      // Reset state only on successful submit
      setEntries([{ vaccineName: '', recordDate: today, nextDueDate: '', notes: '', file: null }]);
      setCreateReminder(true);
      setBookAppointment(false);
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to save vaccination records. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                  <FaSyringe className="text-white text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Add Vaccination Records</h2>
                  <p className="text-blue-100 text-sm">Record vaccinations for {petName}</p>
                </div>
              </div>
              <button onClick={onClose} className="text-white hover:text-blue-200 transition-colors p-2 rounded-lg hover:bg-white hover:bg-opacity-10">
                <FaTimes className="text-xl" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Entries */}
              <div className="space-y-4">
                {entries.map((entry, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-md font-semibold text-gray-800 flex items-center gap-2">
                        <FaSyringe className="text-blue-600" />
                        Vaccine #{index + 1}
                      </h3>
                      {entries.length > 1 && (
                        <button type="button" onClick={() => removeEntry(index)} className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1">
                          <FaTrash /> Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Vaccine Name *</label>
                        <div className="flex gap-2">
                          <select
                            value={entry.vaccineName}
                            onChange={(e) => handleEntryChange(index, 'vaccineName', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          >
                            <option value="">Select common vaccine</option>
                            {commonVaccines.map((v) => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                        </div>
                        <input
                          type="text"
                          value={entry.vaccineName}
                          onChange={(e) => handleEntryChange(index, 'vaccineName', e.target.value)}
                          placeholder="Or type a custom vaccine name"
                          className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Record Date *</label>
                        <input
                          type="date"
                          value={entry.recordDate}
                          onChange={(e) => handleEntryChange(index, 'recordDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Next Due Date (optional)</label>
                        <input
                          type="date"
                          value={entry.nextDueDate}
                          onChange={(e) => handleEntryChange(index, 'nextDueDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
                        <input
                          type="text"
                          value={entry.notes}
                          onChange={(e) => handleEntryChange(index, 'notes', e.target.value)}
                          placeholder="Any notes about this vaccine"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Document (optional)</label>
                      <input
                        id={`file-${index}`}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => handleFileChange(index, e.target.files?.[0])}
                        className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG, DOCX up to 10MB. One file per vaccine entry.</p>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addEntry}
                  className="px-3 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
                >
                  <FaPlus className="text-sm" /> Add another vaccine
                </button>
              </div>

              {/* Options */}
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">After saving</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={createReminder}
                      onChange={(e) => setCreateReminder(e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">Create a reminder for each entry with a Next Due Date</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={bookAppointment}
                      onChange={(e) => setBookAppointment(e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">Open appointment booking (pre-filled for vaccination)</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-top-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaCheck /> Save Records
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VaccinationRecordsPopup;