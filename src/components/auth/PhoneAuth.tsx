import React, { useRef, useState } from 'react';
import { signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth, setupRecaptcha } from '../../firebaseClient';

type Props = {
  mode?: 'user' | 'provider';
  onSuccess?: (payload: any) => void; // { user, tokens } or { success, accessToken, refreshToken, user }
};

const PhoneAuth: React.FC<Props> = ({ mode = 'user', onSuccess }) => {
  const [phone, setPhone] = useState('+91');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'enter' | 'sent' | 'verifying' | 'done'>('enter');
  const [error, setError] = useState<string>('');
  const confirmationRef = useRef<ConfirmationResult | null>(null);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      setupRecaptcha('recaptcha-container');
      const verifier = window.recaptchaVerifier!;
      const confirmation = await signInWithPhoneNumber(auth, phone.trim(), verifier);
      confirmationRef.current = confirmation;
      setStep('sent');
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP');
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setStep('verifying');
    try {
      const confirmation = confirmationRef.current;
      if (!confirmation) throw new Error('No OTP session found. Please resend OTP.');
      const cred = await confirmation.confirm(code.trim());
      const idToken = await cred.user.getIdToken();
      const payload = await exchangeIdToken(idToken, mode);
      onSuccess?.(payload);
      setStep('done');
    } catch (err: any) {
      setError(err?.message || 'OTP verification failed');
      setStep('sent');
    }
  }

  return (
    <div>
      <div id="recaptcha-container" />

      {step === 'enter' && (
        <form onSubmit={handleSendOtp}>
          <label>Phone (E.164):</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91XXXXXXXXXX" />
          <button type="submit">Send OTP</button>
        </form>
      )}

      {step === 'sent' && (
        <form onSubmit={handleVerifyOtp}>
          <label>Enter OTP:</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" />
          <button type="submit">Verify OTP</button>
          <button type="button" onClick={() => setStep('enter')}>Resend</button>
        </form>
      )}

      {step === 'verifying' && <p>Verifying...</p>}
      {step === 'done' && <p>Signed in successfully.</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

async function exchangeIdToken(idToken: string, mode: 'user' | 'provider') {
  const base = import.meta.env.VITE_API_URL || '/api/v1';
  const url = mode === 'user' ? `${base}/auth/phone/verify` : `${base}/provider/auth/phone/verify`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Phone verify failed: ${res.status} - ${text}`);
  }
  return res.json();
}

export default PhoneAuth;
