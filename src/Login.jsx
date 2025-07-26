// src/Login.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Mail, Lock, CheckCircle, AlertCircle, X, Loader2, Shield, Sparkles, ArrowRight } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

const styles = {
  root: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    background: 'rgba(255,255,255,0.97)',
    borderRadius: 24,
    boxShadow: '0 8px 32px rgba(80, 80, 180, 0.12)',
    border: '1px solid #f3e8ff',
    overflow: 'hidden',
    position: 'relative',
    zIndex: 2,
    margin: '0 auto',
  },
  header: {
    background: 'linear-gradient(135deg, #6366f1 0%, #a21caf 100%)',
    color: 'white',
    padding: '32px 32px 20px 32px',
    textAlign: 'center',
    position: 'relative',
  },
  iconBox: {
    width: 64,
    height: 64,
    background: 'rgba(255,255,255,0.18)',
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px auto',
    boxShadow: '0 2px 8px rgba(80, 80, 180, 0.08)',
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 8,
    letterSpacing: '-0.5px',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    marginBottom: 0,
  },
  form: {
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    background: 'transparent',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    padding: '14px 44px 14px 44px',
    border: '2px solid #e0e7ff',
    borderRadius: 12,
    fontSize: 16,
    background: 'rgba(255,255,255,0.95)',
    color: '#22223b',
    outline: 'none',
    transition: 'border 0.2s, box-shadow 0.2s',
    boxShadow: '0 1px 3px rgba(80, 80, 180, 0.04)',
  },
  inputIcon: {
    position: 'absolute',
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#a5b4fc',
    pointerEvents: 'none',
  },
  inputToggle: {
    position: 'absolute',
    right: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#a5b4fc',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
  },
  error: {
    color: '#dc2626',
    fontSize: 13,
    marginTop: 2,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  passwordStrengthBar: {
    width: '100%',
    height: 6,
    borderRadius: 4,
    background: '#e0e7ff',
    marginTop: 4,
    overflow: 'hidden',
  },
  passwordStrengthFill: strength => ({
    height: '100%',
    width: `${strength}%`,
    borderRadius: 4,
    background:
      strength < 25
        ? '#ef4444'
        : strength < 50
        ? '#f59e42'
        : strength < 75
        ? '#facc15'
        : '#22c55e',
    transition: 'width 0.4s, background 0.4s',
  }),
  passwordStrengthText: strength => ({
    fontWeight: 500,
    fontSize: 13,
    color:
      strength < 25
        ? '#ef4444'
        : strength < 50
        ? '#f59e42'
        : strength < 75
        ? '#facc15'
        : '#22c55e',
    marginLeft: 8,
  }),
  rememberMe: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    color: '#555',
    marginBottom: 0,
    cursor: 'pointer',
    userSelect: 'none',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    border: '2px solid #a5b4fc',
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
    cursor: 'pointer',
  },
  button: {
    width: '100%',
    padding: '14px 0',
    borderRadius: 12,
    border: 'none',
    fontWeight: 600,
    fontSize: 16,
    background: 'linear-gradient(90deg, #6366f1 0%, #a21caf 100%)',
    color: 'white',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(80, 80, 180, 0.08)',
    marginTop: 4,
    marginBottom: 0,
    transition: 'background 0.2s, box-shadow 0.2s',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '24px 0',
    color: '#a5b4fc',
    fontSize: 14,
    fontWeight: 500,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: 'linear-gradient(90deg, transparent 0%, #e0e7ff 50%, transparent 100%)',
    border: 'none',
  },
  socialButton: {
    width: '100%',
    padding: '12px 0',
    borderRadius: 10,
    border: '2px solid #e0e7ff',
    background: 'linear-gradient(90deg, #4285F4 0%, #34A853 100%)',
    color: 'white',
    fontWeight: 600,
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    cursor: 'pointer',
    marginBottom: 0,
    marginTop: 0,
    transition: 'background 0.2s, border 0.2s',
    outline: 'none',
    borderColor: '#e0e7ff',
  },
  forgotPassword: {
    width: '100%',
    background: 'none',
    border: 'none',
    color: '#6366f1',
    fontWeight: 500,
    fontSize: 15,
    margin: '12px 0 0 0',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'color 0.2s',
  },
  switchMode: {
    color: '#6366f1',
    fontWeight: 600,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: 15,
    marginLeft: 4,
    transition: 'color 0.2s',
  },
  notification: type => ({
    position: 'fixed',
    top: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    maxWidth: 360,
    width: '90vw',
    padding: 18,
    borderRadius: 16,
    fontSize: 15,
    fontWeight: 500,
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    background: type === 'success' ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' : 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
    color: type === 'success' ? '#166534' : '#991b1b',
    border: `1px solid ${type === 'success' ? '#bbf7d0' : '#fecaca'}`,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    transition: 'opacity 0.3s, transform 0.3s',
    opacity: 1,
  }),
  notificationHiding: {
    opacity: 0,
    transform: 'translateX(-50%) translateY(-120%)',
  },
};

export default function Login({ onSuccess }) {
  const [mode, setMode] = useState('signin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [focusedField, setFocusedField] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (notification) {
      // Notification is instantly dismissible and auto-dismisses after 2.5s
      const timer = setTimeout(() => {
        setNotification(prev => ({ ...prev, hiding: true }));
        setTimeout(() => setNotification(null), 200);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    if (formData.password) {
      let strength = 0;
      if (formData.password.length >= 8) strength += 25;
      if (/[A-Z]/.test(formData.password)) strength += 25;
      if (/[0-9]/.test(formData.password)) strength += 25;
      if (/[^A-Za-z0-9]/.test(formData.password)) strength += 25;
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [formData.password]);

  const showNotification = (message, type = 'error') => {
    setNotification({ message, type, hiding: false });
  };

  const validateField = (name, value) => {
    const errors = { ...fieldErrors };
    switch (name) {
      case 'email':
        if (!value) {
          errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          errors.email = 'Please enter a valid email';
        } else {
          delete errors.email;
        }
        break;
      case 'password':
        if (!value) {
          errors.password = 'Password is required';
        } else if (value.length < 6) {
          errors.password = 'Password must be at least 6 characters';
        } else {
          delete errors.password;
        }
        break;
      case 'confirmPassword':
        if (mode === 'signup') {
          if (!value) {
            errors.confirmPassword = 'Please confirm your password';
          } else if (value !== formData.password) {
            errors.confirmPassword = 'Passwords do not match';
          } else {
            delete errors.confirmPassword;
          }
        }
        break;
      default:
        break;
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      validateField(name, value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const isEmailValid = validateField('email', formData.email);
    const isPasswordValid = validateField('password', formData.password);
    const isConfirmPasswordValid = mode === 'signin' || validateField('confirmPassword', formData.confirmPassword);
    if (!isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
      setIsLoading(false);
      return;
    }
    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        showNotification('🎉 Account created successfully! Welcome aboard!', 'success');
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        showNotification('👋 Welcome back! Great to see you again!', 'success');
      }
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (err) {
      let errorMessage = 'Authentication failed';
      switch (err.code) {
        case 'auth/user-not-found':
          errorMessage = '🔍 No account found with this email';
          break;
        case 'auth/wrong-password':
        case 'auth/invalid-credentials':
          errorMessage = '🔒 Invalid email or password';
          break;
        case 'auth/email-already-in-use':
          errorMessage = '📧 An account with this email already exists';
          break;
        case 'auth/weak-password':
          errorMessage = '🛡️ Password should be at least 6 characters';
          break;
        case 'auth/invalid-email':
          errorMessage = '✉️ Please enter a valid email address';
          break;
        default:
          errorMessage = err.message || 'Authentication failed';
      }
      showNotification(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      showNotification('🚀 Welcome! Signed in with Google successfully!', 'success');
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (err) {
      showNotification('❌ Google sign-in failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!formData.email) {
      showNotification('📧 Please enter your email address first', 'error');
      return;
    }
    if (!validateField('email', formData.email)) {
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, formData.email);
      showNotification('📬 Password reset email sent! Check your inbox', 'success');
    } catch (err) {
      showNotification('❌ Failed to send reset email', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setFieldErrors({});
    setNotification(null);
    setFormData(prev => ({ ...prev, confirmPassword: '' }));
    setPasswordStrength(0);
    if (firstInputRef.current) {
      setTimeout(() => firstInputRef.current.focus(), 100);
    }
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return 'Weak';
    if (passwordStrength < 50) return 'Fair';
    if (passwordStrength < 75) return 'Good';
    return 'Strong';
  };

  // Notification Component
  const Notification = ({ message, type, onClose, hiding }) => (
    <div
      style={{
        ...styles.notification(type),
        ...(hiding ? styles.notificationHiding : {})
      }}
      role="alert"
      tabIndex={0}
      aria-live="assertive"
      onClick={onClose}
    >
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        {type === 'success' ? (
          <CheckCircle style={{ color: '#22c55e', marginRight: 8 }} />
        ) : (
          <AlertCircle style={{ color: '#dc2626', marginRight: 8 }} />
        )}
        <span style={{ flex: 1 }}>{message}</span>
        <button
          onClick={e => { e.stopPropagation(); onClose(); }}
          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', marginLeft: 8, fontSize: 18 }}
          aria-label="Close notification"
        >
          <X />
        </button>
      </div>
    </div>
  );

  // Input Field
  const InputField = ({ icon: Icon, name, type, placeholder, showToggle, onToggle, error, inputRef }) => (
    <div style={styles.inputGroup}>
      <div style={styles.inputWrapper}>
        <div style={{ ...styles.inputIcon, ...(focusedField === name ? { color: '#6366f1' } : {}) }}>
          <Icon size={20} />
        </div>
        <input
          ref={inputRef}
          type={type}
          name={name}
          placeholder={placeholder}
          value={formData[name]}
          onChange={handleInputChange}
          onFocus={() => setFocusedField(name)}
          onBlur={() => setFocusedField(null)}
          disabled={isLoading}
          style={{
            ...styles.input,
            ...(error ? { borderColor: '#ef4444', boxShadow: '0 0 0 3px #fecaca' } : {}),
            ...(focusedField === name ? { borderColor: '#6366f1', boxShadow: '0 0 0 3px #e0e7ff' } : {}),
            ...(isLoading ? styles.buttonDisabled : {})
          }}
          tabIndex={0}
          aria-label={placeholder}
          autoComplete={name === 'password' ? 'current-password' : name}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            style={styles.inputToggle}
            tabIndex={0}
            aria-label={type === 'password' ? 'Show password' : 'Hide password'}
          >
            {type === 'password' ? (
              <EyeOff size={20} />
            ) : (
              <Eye size={20} />
            )}
          </button>
        )}
      </div>
      {name === 'password' && formData.password && mode === 'signup' && (
        <div style={styles.inputGroup}>
          <div style={styles.inputWrapper}>
            <span style={styles.passwordStrengthText(passwordStrength)}>Password strength: {getPasswordStrengthText()}</span>
          </div>
          <div style={styles.passwordStrengthBar}>
            <div style={styles.passwordStrengthFill(passwordStrength)} />
          </div>
        </div>
      )}
      {error && (
        <div style={styles.error}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );

  // Google Social Login Button
  const GoogleButton = ({ onClick, disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...styles.socialButton, ...(disabled ? styles.buttonDisabled : {}) }}
      tabIndex={0}
      aria-label="Sign in with Google"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
        <path fill="#fff" d="M21.35 11.1h-9.18v2.92h5.98c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#fff" d="M12.17 22.99c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.35v2.84c1.81 2.69 5.52 5.16 9.82 5.16z"/>
        <path fill="#fff" d="M5.99 14.08c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.35C1.6 8.54 1.17 10.21 1.17 12s.43 3.45 1.18 4.93l2.85-2.22.81-.63z"/>
        <path fill="#fff" d="M12.17 5.37c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.62 2.08 15.14.99 12.17.99c-4.3 0-8.01 2.47-9.82 6.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      <span>Sign in with Google</span>
      {isLoading && <Loader2 size={18} style={{ marginLeft: 8, animation: 'spin 1s linear infinite' }} />}
    </button>
  );

  return (
    <>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          hiding={notification.hiding}
          onClose={() => setNotification(null)}
        />
      )}
      <div style={styles.root}>
        <form
          style={styles.card}
          onSubmit={handleSubmit}
          aria-label="Login form"
          autoComplete="on"
        >
          <div style={styles.header}>
            <div style={styles.iconBox} aria-hidden="true">
              {mode === 'signup' ? (
                <Sparkles size={40} />
              ) : (
                <Shield size={40} />
              )}
            </div>
            <h1 style={styles.title}>{mode === 'signup' ? 'Join Our Community' : 'Welcome Back'}</h1>
            <p style={styles.subtitle}>
              {mode === 'signup'
                ? 'Create your account and start your journey'
                : 'Sign in to continue to your dashboard'}
            </p>
          </div>
          <div style={styles.form}>
            <InputField
              icon={Mail}
              name="email"
              type="email"
              placeholder="Enter your email address"
              error={fieldErrors.email}
              inputRef={firstInputRef}
            />
            <InputField
              icon={Lock}
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              showToggle={true}
              onToggle={() => setShowPassword(!showPassword)}
              error={fieldErrors.password}
            />
            {mode === 'signup' && (
              <InputField
                icon={Lock}
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                showToggle={true}
                onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                error={fieldErrors.confirmPassword}
              />
            )}
            {mode === 'signin' && (
              <div style={styles.inputGroup}>
                <label style={styles.rememberMe}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    style={{ marginRight: 6 }}
                    tabIndex={0}
                  />
                  Remember me
                </label>
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading}
              style={{ ...styles.button, ...(isLoading ? styles.buttonDisabled : {}) }}
              tabIndex={0}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} />
                  Processing...
                </>
              ) : (
                <>
                  {mode === 'signup' ? 'Create Account' : 'Sign In'}
                  <ArrowRight size={18} style={{ marginLeft: 8 }} />
                </>
              )}
            </button>
            <div style={styles.divider}>
              <div style={styles.dividerLine} />
              <span>or</span>
              <div style={styles.dividerLine} />
            </div>
            <GoogleButton onClick={handleGoogleSignIn} disabled={isLoading} />
            {mode === 'signin' && (
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={isLoading}
                style={styles.forgotPassword}
                tabIndex={0}
              >
                Forgot your password?
              </button>
            )}
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <span style={{ color: '#555', fontSize: 15 }}>
                {mode === 'signup' ? 'Already have an account?' : 'New to our platform?'}{' '}
                <button
                  type="button"
                  onClick={switchMode}
                  style={styles.switchMode}
                  tabIndex={0}
                >
                  {mode === 'signup' ? 'Sign in here' : 'Create an account'}
                </button>
              </span>
            </div>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
