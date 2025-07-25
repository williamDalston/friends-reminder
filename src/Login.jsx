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
  const [isLoading, setIsLoading] = useState(false);

  // Beautiful styling
  const containerStyles = {
    maxWidth: 400,
    margin: '60px auto',
    padding: '40px 30px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  const titleStyles = {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: '30px',
  };

  const formStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px',
  };

  const inputStyles = {
    padding: '14px 16px',
    border: '2px solid #e1e5e9',
    borderRadius: '8px',
    fontSize: '16px',
    transition: 'all 0.2s ease',
    outline: 'none',
    ':focus': {
      borderColor: '#007AFF',
      boxShadow: '0 0 0 3px rgba(0, 122, 255, 0.1)',
    },
  };

  const primaryButtonStyles = {
    padding: '14px 24px',
    backgroundColor: '#007AFF',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#0056CC',
      transform: 'translateY(-1px)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
  };

  const secondaryButtonStyles = {
    padding: '14px 24px',
    backgroundColor: '#ffffff',
    color: '#007AFF',
    border: '2px solid #007AFF',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f0f8ff',
    },
  };

  const googleButtonStyles = {
    padding: '14px 24px',
    backgroundColor: '#ffffff',
    color: '#1a1a1a',
    border: '2px solid #e1e5e9',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    ':hover': {
      backgroundColor: '#f8f9fa',
      borderColor: '#d1d5d9',
    },
  };

  const dividerStyles = {
    display: 'flex',
    alignItems: 'center',
    margin: '24px 0',
    color: '#6c757d',
    fontSize: '14px',
  };

  const dividerLineStyles = {
    flex: 1,
    height: '1px',
    backgroundColor: '#e1e5e9',
  };

  const messageStyles = {
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    textAlign: 'center',
    marginTop: '16px',
  };

  const successMessageStyles = {
    ...messageStyles,
    backgroundColor: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb',
  };

  const errorMessageStyles = {
    ...messageStyles,
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb',
  };

  const handleEmailPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    
    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
        setMessage('Account created successfully! Welcome! 🎉');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setMessage('Welcome back! 👋');
      }
    } catch (err) {
      console.error('Auth error:', err);
      let errorMessage = 'Authentication failed';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address';
      }
      
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      console.log('Attempting Google sign-in...');
      console.log('Google provider:', googleProvider);
      
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Google sign-in successful:', result.user.email);
      setMessage('Welcome! Signed in with Google 🎉');
    } catch (err) {
      console.error('Google sign-in error:', err);
      let errorMessage = 'Google sign-in failed';
      
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in was cancelled';
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = 'Pop-up was blocked. Please allow pop-ups for this site';
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with this email using a different sign-in method';
      }
      
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) {
      setMessage('Please enter your email address first');
      return;
    }
    
    setIsLoading(true);
    setMessage('');
    
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent! Check your inbox 📧');
    } catch (err) {
      console.error('Password reset error:', err);
      setMessage(err.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={containerStyles}>
      <h1 style={titleStyles}>
        {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
      </h1>

      <form onSubmit={handleEmailPassword} style={formStyles}>
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyles}
          disabled={isLoading}
        />
        <input
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyles}
          disabled={isLoading}
        />
        <button 
          type="submit" 
          style={primaryButtonStyles}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : (mode === 'signup' ? 'Create Account' : 'Sign In')}
        </button>
      </form>

      <div style={dividerStyles}>
        <div style={dividerLineStyles}></div>
        <span style={{ margin: '0 16px' }}>or</span>
        <div style={dividerLineStyles}></div>
      </div>

      <button 
        onClick={handleGoogle} 
        style={googleButtonStyles}
        disabled={isLoading}
      >
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      {mode === 'signin' && (
        <button 
          onClick={handleReset} 
          style={secondaryButtonStyles}
          disabled={isLoading}
        >
          Forgot password?
        </button>
      )}

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <p style={{ color: '#6c757d', fontSize: '14px' }}>
          {mode === 'signup' ? (
            <>
              Already have an account?{' '}
              <button 
                type="button" 
                onClick={() => setMode('signin')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#007AFF',
                  cursor: 'pointer',
                  fontSize: '14px',
                  textDecoration: 'underline',
                }}
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              New here?{' '}
              <button 
                type="button" 
                onClick={() => setMode('signup')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#007AFF',
                  cursor: 'pointer',
                  fontSize: '14px',
                  textDecoration: 'underline',
                }}
              >
                Create an account
              </button>
            </>
          )}
        </p>
      </div>

      {message && (
        <div style={message.includes('Welcome') || message.includes('successfully') || message.includes('sent') ? successMessageStyles : errorMessageStyles}>
          {message}
        </div>
      )}
    </div>
  );
}
