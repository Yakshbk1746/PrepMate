import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginWithEmail, loginWithGoogle, sendPasswordReset } from '../firebase/authService';
import logo from '../assets/logo.png';

const MailIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const EyeOpenIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeClosedIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const SpinnerIcon = () => (
  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
  </svg>
);

const InputField = ({ id, label, type, value, onChange, placeholder, icon: Icon, error, rightElement }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300">
      {label}
    </label>
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
        <Icon />
      </div>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`
          w-full pl-11 pr-11 py-2 rounded-xl text-sm
          bg-white dark:bg-white/[0.04] text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500
          border ${error ? 'border-red-500/50' : 'border-slate-300 dark:border-white/[0.07]'}
          hover:border-slate-400 dark:hover:border-white/[0.14] focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20
          outline-none transition-all duration-200
        `}
      />
      {rightElement && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
          {rightElement}
        </div>
      )}
    </div>
    {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
  </div>
);

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [globalError, setGlobalError] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const isLoading = loadingEmail || loadingGoogle;

  const validateEmail = (email) => {
    if (!email.trim()) return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(email)) return 'Enter a valid email';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      return;
    }

    setErrors({ email: '', password: '' });
    setGlobalError('');
    setLoadingEmail(true);

    try {
      await loginWithEmail(email, password);
      navigate('/dashboard');
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGlobalError('');
    setLoadingGoogle(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setErrors({ ...errors, email: 'Enter your email above first, then click Forgot password.' });
      return;
    }
    setGlobalError('');
    try {
      await sendPasswordReset(email);
      setResetSent(true);
    } catch (err) {
      setGlobalError(err.message);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-slate-50 dark:bg-[#060914] flex flex-col justify-center items-center p-4 overflow-y-auto">

      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-60 -left-60 w-[500px] h-[500px] rounded-full bg-blue-600/8 blur-[140px]" />
        <div className="absolute -bottom-60 -right-60 w-[500px] h-[500px] rounded-full bg-violet-600/8 blur-[140px]" />
      </div>

      <div className="relative w-full max-w-[440px] mt-auto mb-auto">

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-blue-500/30">
              <img src={logo} alt="PrepMate Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl font-black tracking-tight leading-none text-slate-900 dark:text-white">
              Prep<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Mate</span>
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            Your competitive exam command centre
          </p>
        </div>

        <div className="w-full bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 sm:p-8 shadow-sm dark:shadow-2xl dark:shadow-black/50">

          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Welcome back</h2>
          <p className="text-slate-500 text-xs mb-4">Sign in to continue your preparation</p>

          {globalError && (
            <div className="mb-4 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>{globalError}</span>
            </div>
          )}

          {resetSent && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/25 text-green-400 text-sm flex items-start gap-2.5">
              <span className="shrink-0 mt-0.5">✅</span>
              <span>Password reset email sent! Check your inbox.</span>
            </div>
          )}

          <form onSubmit={handleEmailLogin} noValidate>
            <div className="flex flex-col gap-3">

              <InputField
                id="email"
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors(prev => ({ ...prev, email: '' }));
                }}
                placeholder="you@example.com"
                icon={MailIcon}
                error={errors.email}
              />

              <InputField
                id="current-password"
                label="Password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors(prev => ({ ...prev, password: '' }));
                }}
                placeholder="••••••••"
                icon={LockIcon}
                error={errors.password}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPass ? <EyeClosedIcon /> : <EyeOpenIcon />}
                  </button>
                }
              />

              <div className="flex justify-end -mt-2">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors disabled:opacity-50"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="
                  w-full py-2 px-4 rounded-xl font-bold text-sm text-white
                  bg-gradient-to-r from-blue-600 to-blue-500
                  hover:from-blue-500 hover:to-blue-400
                  active:scale-[0.98]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  shadow-lg shadow-blue-500/20
                  transition-all duration-200
                  flex items-center justify-center gap-2
                "
              >
                {loadingEmail ? (
                  <><SpinnerIcon /> Signing in…</>
                ) : (
                  'Sign In →'
                )}
              </button>
            </div>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-200 dark:bg-white/[0.06]" />
            <span className="text-xs text-slate-500 dark:text-slate-600 font-medium tracking-wider">OR CONTINUE WITH</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-white/[0.06]" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="
              w-full py-2 px-4 rounded-xl font-semibold text-sm text-slate-700 dark:text-slate-300
              bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08]
              border border-slate-300 dark:border-white/[0.07] hover:border-slate-400 dark:hover:border-white/[0.14]
              active:scale-[0.98]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
              flex items-center justify-center gap-3
            "
          >
            {loadingGoogle ? (
              <><SpinnerIcon /> Connecting…</>
            ) : (
              <><GoogleIcon /> Continue with Google</>
            )}
          </button>

          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-white/[0.06]">
            <p className="text-center text-slate-500 text-xs">
              New to PrepMate?{' '}
              <Link
                to="/signup"
                className="text-blue-500 hover:text-blue-400 font-semibold transition-colors"
              >
                Create a free account
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;