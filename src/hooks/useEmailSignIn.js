import { useState } from 'react';
import { signInWithEmail, exchangeToken } from '../utils/auth';

// The email -> code -> verify state machine, shared by Account and
// SubscribeModal so the two entry points can't drift out of sync with each
// other or with what the Worker actually implements (a typed code, not a
// clickable link).
export function useEmailSignIn({ onVerified } = {}) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'code'
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const sendCode = async (e) => {
    e?.preventDefault?.();
    setBusy(true);
    setError(null);
    try {
      await signInWithEmail(email);
      setStep('code');
    } catch {
      setError('That did not go through. Check the address and try again.');
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (e) => {
    e?.preventDefault?.();
    setBusy(true);
    setError(null);
    try {
      await exchangeToken(otp, email);
      await onVerified?.();
    } catch {
      setError('That code did not match, or has expired. Check it and try again.');
    } finally {
      setBusy(false);
    }
  };

  const useDifferentEmail = () => {
    setStep('email');
    setOtp('');
    setError(null);
  };

  return { email, setEmail, otp, setOtp, step, busy, error, sendCode, verifyCode, useDifferentEmail };
}
