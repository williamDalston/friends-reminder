// src/Login.jsx
// src/Login.jsx
import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';

export default function Login() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [message, setMessage] = useState('');

  const handleEmailPassword = async (e) => {
    e.preventDefault();
    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
        setMessage('Account created! You are logged in.');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setMessage('Logged in!');
      }
    } catch (err) {
      console.error(err);
      setMessage(err.message || 'Authentication failed');
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setMessage('Logged in with Google!');
    } catch (err) {
      console.error(err);
      setMessage(err.message || 'Google sign-in failed');
    }
  };

  const handleReset = async () => {
    if (!email) {
      setMessage('Enter your email first.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent.');
    } catch (err) {
      console.error(err);
      setMessage(err.message || 'Failed to send reset email');
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: '80px auto', fontFamily: 'sans-serif' }}>
      <h2>{mode === 'signup' ? 'Create an account' : 'Sign in'}</h2>

      <form onSubmit={handleEmailPassword} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: 10 }}
        />
        <input
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: 10 }}
        />
        <button type="submit" style={{ padding: 10 }}>
          {mode === 'signup' ? 'Sign up' : 'Sign in'}
        </button>
      </form>

      <button onClick={handleGoogle} style={{ padding: 10, marginTop: 10 }}>
        Continue with Google
      </button>

      {mode === 'signin' && (
        <button onClick={handleReset} style={{ padding: 10, marginTop: 10 }}>
          Forgot password?
        </button>
      )}

      <p style={{ marginTop: 10 }}>
        {mode === 'signup' ? (
          <>
            Already have an account?{' '}
            <button type="button" onClick={() => setMode('signin')}>Sign in</button>
          </>
        ) : (
          <>
            New here?{' '}
            <button type="button" onClick={() => setMode('signup')}>Create an account</button>
          </>
        )}
      </p>

      {message && <p style={{ color: 'crimson' }}>{message}</p>}
    </div>
  );
}
