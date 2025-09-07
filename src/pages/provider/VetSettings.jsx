import React from 'react';
import VetLayout from './VetLayout';

export default function VetSettings() {
  return (
    <VetLayout title="Settings / Profile & Billing (India)">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 gap-4">
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Clinic Profile</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className="border rounded px-3 py-2" placeholder="Clinic Name" defaultValue="PawsIQ Vet Care" />
              <input className="border rounded px-3 py-2" placeholder="City" defaultValue="Mumbai" />
              <input className="border rounded px-3 py-2" placeholder="GSTIN" defaultValue="27ABCDE1234F1Z5" />
              <input className="border rounded px-3 py-2" placeholder="Phone" defaultValue="+91 98765 43210" />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Payments</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className="border rounded px-3 py-2" placeholder="UPI ID" defaultValue="pawsiq@okicici" />
              <input className="border rounded px-3 py-2" placeholder="Bank IFSC" defaultValue="ICIC0001234" />
              <input className="border rounded px-3 py-2" placeholder="Account Number" defaultValue="XXXXXXXX1234" />
            </div>
            <p className="text-xs text-gray-500 mt-2">We support UPI payouts and GST-compliant invoicing.</p>
          </section>

          <div>
            <button className="px-3 py-2 bg-indigo-600 text-white rounded" onClick={() => alert('Settings saved!')}>Save Changes</button>
          </div>
        </div>
      </div>
    </VetLayout>
  );
}