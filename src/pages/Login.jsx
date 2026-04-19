import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../features/auth/authSlice';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.auth);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username && password) {
      dispatch(loginUser({ username, password }));
    }
  };

  return (
    <div className="login-page">
      {/* Background Texture/Gradient Elements (handled via CSS/implied) */}
      
      <main className="login-main">
        {/* Brand Identity Header */}
        <div className="login-brand">
          <div className="brand-logo">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '2.25rem', height: '2.25rem' }}>
              <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2.5" fill="none"/>
              <path d="M20 6 L20 34 M6 20 L34 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M11 11 L29 29 M29 11 L11 29" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
              <circle cx="20" cy="20" r="5" fill="currentColor"/>
            </svg>
          </div>
          <h1 className="brand-title" style={{ fontSize: '1.4rem', lineHeight: '1.2' }}>Koperasi Konsumen<br/>Pegawai KESDM</h1>
        </div>

        {/* The Monolithic Login Card */}
        <div className="login-card">
          <div className="login-card-content">
            <h2 className="login-title">Login</h2>
            <p className="login-subtitle">Masukkan kredensial Anda untuk masuk ke sistem.</p>

            <form onSubmit={handleSubmit} className="login-form">
              {/* Input: Identity */}
              <div className="input-group">
                <label className="input-label">Username atau ID</label>
                <div className="input-wrapper">
                  <div className="input-icon-left">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Contoh: ADM-01-2024"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={status === 'loading'}
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Input: Password */}
              <div className="input-group">
                <div className="input-label-wrapper">
                  <label className="input-label">Kata Sandi</label>
                </div>
                <div className="input-wrapper">
                  <div className="input-icon-left">
                    <span className="material-symbols-outlined">lock</span>
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="input-field" 
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={status === 'loading'}
                  />
                  <div className="input-icon-right">
                    <button 
                      type="button" 
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="options-group">
                <input 
                  type="checkbox" 
                  id="remember-me" 
                  name="remember-me" 
                  className="checkbox"
                />
                <label htmlFor="remember-me" className="checkbox-label">Ingat Saya</label>
              </div>

              {error && <div className="error-message">{error}</div>}

              {/* Action: Submit */}
              <button 
                type="submit" 
                className="btn-submit group"
                disabled={status === 'loading' || !username || !password}
              >
                {status === 'loading' ? 'AUTHORIZING...' : 'Masuk'}
                <span className="material-symbols-outlined btn-icon group-hover">arrow_forward</span>
              </button>
            </form>
          </div>
          {/* Footer Meta */}
        </div>
        {/* Secondary Navigation/Links */}
      </main>
      {/* Aesthetic Decorative Corner Text */}
    </div>
  );
};

export default Login;
