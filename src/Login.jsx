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

  // Enhanced beautiful styling with mobile-first responsive design
  const containerStyles = {
    maxWidth: 'min(420px, 90vw)',
    margin: '20px auto',
    padding: 'clamp(24px, 6vw, 48px) clamp(20px, 4vw, 40px)',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    borderRadius: 'clamp(16px, 4vw, 24px)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08), 0 8px 32px rgba(0, 0, 0, 0.04)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    minHeight: 'fit-content',
    '@media (max-width: 480px)': {
      margin: '10px auto',
      padding: '24px 20px',
    },
  };

  const titleStyles = {
    fontSize: 'clamp(24px, 6vw, 32px)',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textAlign: 'center',
    marginBottom: 'clamp(24px, 6vw, 36px)',
    letterSpacing: '-0.5px',
    lineHeight: '1.2',
  };

  const subtitleStyles = {
    fontSize: 'clamp(14px, 4vw, 16px)',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 'clamp(24px, 6vw, 32px)',
    lineHeight: '1.5',
    padding: '0 10px',
  };

  const formStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'clamp(16px, 4vw, 20px)',
    marginBottom: 'clamp(20px, 5vw, 28px)',
  };

  const inputGroupStyles = {
    position: 'relative',
  };

  const inputStyles = {
    width: '100%',
    padding: 'clamp(16px, 4vw, 18px) clamp(16px, 4vw, 20px)',
    border: '2px solid #e5e7eb',
    borderRadius: 'clamp(12px, 3vw, 16px)',
    fontSize: '16px', // Keep 16px to prevent zoom on iOS
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    minHeight: '44px', // Minimum touch target size
    '&:focus': {
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.1), 0 4px 12px rgba(0, 0, 0, 0.05)',
      transform: 'translateY(-1px)',
    },
    '&:hover': {
      borderColor: '#d1d5db',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    },
    '@media (max-width: 480px)': {
      fontSize: '16px', // Prevent zoom on iOS
      padding: '16px 20px',
    },
  };

  const primaryButtonStyles = {
    width: '100%',
    padding: 'clamp(16px, 4vw, 18px) clamp(20px, 5vw, 24px)',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: 'white',
    border: 'none',
    borderRadius: 'clamp(12px, 3vw, 16px)',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3), 0 2px 8px rgba(0, 0, 0, 0.1)',
    position: 'relative',
    overflow: 'hidden',
    minHeight: '44px', // Minimum touch target size
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4), 0 4px 12px rgba(0, 0, 0, 0.15)',
    },
    '&:active': {
      transform: 'translateY(0)',
      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
    },
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
      transform: 'none',
    },
    '@media (max-width: 480px)': {
      fontSize: '16px',
      padding: '16px 24px',
    },
  };

  const secondaryButtonStyles = {
    width: '100%',
    padding: 'clamp(14px, 4vw, 16px) clamp(20px, 5vw, 24px)',
    backgroundColor: 'transparent',
    color: '#3b82f6',
    border: '2px solid #e5e7eb',
    borderRadius: 'clamp(12px, 3vw, 16px)',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    minHeight: '44px', // Minimum touch target size
    '&:hover': {
      borderColor: '#3b82f6',
      backgroundColor: '#f0f9ff',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)',
    },
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
      transform: 'none',
    },
    '@media (max-width: 480px)': {
      fontSize: '16px',
      padding: '14px 24px',
    },
  };

  const googleButtonStyles = {
    width: '100%',
    padding: 'clamp(16px, 4vw, 18px) clamp(20px, 5vw, 24px)',
    backgroundColor: '#ffffff',
    color: '#374151',
    border: '2px solid #e5e7eb',
    borderRadius: 'clamp(12px, 3vw, 16px)',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'clamp(8px, 2vw, 12px)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    minHeight: '44px', // Minimum touch target size
    '&:hover': {
      backgroundColor: '#f9fafb',
      borderColor: '#d1d5db',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    },
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
      transform: 'none',
    },
    '@media (max-width: 480px)': {
      fontSize: '16px',
      padding: '16px 24px',
      gap: '8px',
    },
  };

  const dividerStyles = {
    display: 'flex',
    alignItems: 'center',
    margin: 'clamp(24px, 6vw, 32px) 0',
    color: '#9ca3af',
    fontSize: 'clamp(12px, 3vw, 14px)',
    fontWeight: '500',
  };

  const dividerLineStyles = {
    flex: 1,
    height: '1px',
    background: 'linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%)',
  };

  // Enhanced mobile-friendly notification styles
  const messageStyles = {
    padding: 'clamp(12px, 3vw, 16px) clamp(16px, 4vw, 20px)',
    borderRadius: 'clamp(12px, 3vw, 16px)',
    fontSize: 'clamp(13px, 3.5vw, 14px)',
    textAlign: 'center',
    marginTop: 'clamp(16px, 4vw, 20px)',
    fontWeight: '500',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    position: 'relative',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    lineHeight: '1.4',
    // Mobile-specific enhancements
    '@media (max-width: 480px)': {
      margin: '16px 0 0 0',
      padding: '16px 20px',
      fontSize: '14px',
      borderRadius: '12px',
    },
  };

  const successMessageStyles = {
    ...messageStyles,
    background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
    color: '#166534',
    border: '1px solid #bbf7d0',
    // Mobile-specific success styling
    '@media (max-width: 480px)': {
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
    },
  };

  const errorMessageStyles = {
    ...messageStyles,
    background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
    color: '#991b1b',
    border: '1px solid #fecaca',
    // Mobile-specific error styling
    '@media (max-width: 480px)': {
      background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
    },
  };

  const toggleButtonStyles = {
    background: 'none',
    border: 'none',
    color: '#3b82f6',
    cursor: 'pointer',
    fontSize: 'clamp(13px, 3.5vw, 14px)',
    fontWeight: '600',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    padding: 'clamp(6px, 1.5vw, 8px) clamp(8px, 2vw, 12px)',
    borderRadius: '8px',
    minHeight: '32px', // Minimum touch target
    '&:hover': {
      backgroundColor: '#f0f9ff',
      textDecoration: 'underline',
    },
    '@media (max-width: 480px)': {
      fontSize: '14px',
      padding: '8px 12px',
      minHeight: '36px',
    },
  };

  // Mobile-friendly popup notification component
  const NotificationPopup = ({ message, type, onClose }) => {
    const popupStyles = {
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      maxWidth: 'min(90vw, 400px)',
      padding: '16px 20px',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.8)',
      animation: 'slideDown 0.3s ease-out',
      '@keyframes slideDown': {
        '0%': { transform: 'translateX(-50%) translateY(-100%)', opacity: 0 },
        '100%': { transform: 'translateX(-50%) translateY(0)', opacity: 1 },
      },
      // Mobile-specific popup styling
      '@media (max-width: 480px)': {
        top: '10px',
        left: '10px',
        right: '10px',
        transform: 'none',
        maxWidth: 'none',
        padding: '16px 20px',
        fontSize: '14px',
      },
    };

    const successPopupStyles = {
      ...popupStyles,
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      color: '#166534',
      border: '1px solid #bbf7d0',
    };

    const errorPopupStyles = {
      ...popupStyles,
      background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
      color: '#991b1b',
      border: '1px solid #fecaca',
    };

    return (
      <div style={type === 'success' ? successPopupStyles : errorPopupStyles}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <span style={{ flex: 1, wordBreak: 'break-word' }}>{message}</span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '4px',
              borderRadius: '4px',
              minWidth: '24px',
              minHeight: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>
      </div>
    );
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
    <>
      {/* Mobile-friendly popup notification */}
      {message && (
        <NotificationPopup
          message={message}
          type={message.includes('Welcome') || message.includes('successfully') || message.includes('sent') ? 'success' : 'error'}
          onClose={() => setMessage('')}
        />
      )}

      <div style={containerStyles}>
        <h1 style={titleStyles}>
          {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
        </h1>
        
        <p style={subtitleStyles}>
          {mode === 'signup' 
            ? 'Join us and start managing your friendships' 
            : 'Sign in to access your account'
          }
        </p>

        <form onSubmit={handleEmailPassword} style={formStyles}>
          <div style={inputGroupStyles}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyles}
              disabled={isLoading}
            />
          </div>
          <div style={inputGroupStyles}>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyles}
              disabled={isLoading}
            />
          </div>
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
          <span style={{ margin: '0 16px' }}>or continue with</span>
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
            Forgot your password?
          </button>
        )}

        <div style={{ marginTop: 'clamp(24px, 6vw, 32px)', textAlign: 'center' }}>
          <p style={{ color: '#6b7280', fontSize: 'clamp(13px, 3.5vw, 14px)', lineHeight: '1.5' }}>
            {mode === 'signup' ? (
              <>
                Already have an account?{' '}
                <button 
                  type="button" 
                  onClick={() => setMode('signin')}
                  style={toggleButtonStyles}
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
                  style={toggleButtonStyles}
                >
                  Create an account
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </>
  );
}
