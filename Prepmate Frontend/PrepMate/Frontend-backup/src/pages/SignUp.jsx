import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerWithEmail, loginWithGoogle } from '../firebase/authService';
import { useAuth } from '../context/authContext';
import { getSignupConfig } from '../services/api';
import logo from '../assets/logo.png';

// Password strength helper
const getPasswordStrength = (pass) => {
  if (!pass) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pass.length >= 8)  score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  const levels = [
    { score: 0, label: '',        color: '' },
    { score: 1, label: 'Weak',    color: 'bg-red-500' },
    { score: 2, label: 'Fair',    color: 'bg-orange-400' },
    { score: 3, label: 'Good',    color: 'bg-yellow-400' },
    { score: 4, label: 'Strong',  color: 'bg-green-500' },
  ];
  return levels[score] || levels[0];
};

// SVG Icons
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

const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);

// Reusable InputField
const InputField = ({ id, label, type = 'text', value, onChange, placeholder, icon: Icon, error, rightElement, hint }) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300">
      {label}
    </label>
    <div className="relative">
      <span className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${error ? 'text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
        <Icon />
      </span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={id}
        className={`
          w-full pl-10 pr-10 py-2 rounded-xl text-sm
          bg-white dark:bg-[#0d1424] text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500
          border transition-all duration-200 outline-none
          ${error
            ? 'border-red-500/60 focus:border-red-400 focus:ring-2 focus:ring-red-500/20'
            : 'border-slate-300 dark:border-white/[0.07] focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20'
          }
        `}
      />
      {rightElement && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          {rightElement}
        </span>
      )}
    </div>
    {hint && !error && <p className="text-xs text-slate-600 mt-0.5">{hint}</p>}
    {error && (
      <p className="text-xs text-red-400 flex items-center gap-1.5 mt-0.5">
        <span>⚠</span> {error}
      </p>
    )}
  </div>
);

// Reusable SelectField
const SelectField = ({ id, label, value, onChange, options, placeholder, error }) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
    <select
      id={id}
      value={value}
      onChange={onChange}
      className={`
        w-full px-4 py-2 rounded-xl text-sm
        bg-white dark:bg-[#0d1424] text-slate-900 dark:text-slate-200
        border transition-all duration-200 outline-none appearance-none
        ${!value ? 'text-slate-400 dark:text-slate-600' : 'text-slate-900 dark:text-slate-200'}
        ${error
          ? 'border-red-500/60 focus:border-red-400 focus:ring-2 focus:ring-red-500/20'
          : 'border-slate-300 dark:border-white/[0.07] focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20'
        }
      `}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt} className="bg-white dark:bg-[#111827] text-slate-900 dark:text-slate-200">{opt}</option>
      ))}
    </select>
    {error && (
      <p className="text-xs text-red-400 flex items-center gap-1.5 mt-0.5">
        <span>⚠</span> {error}
      </p>
    )}
  </div>
);

// Step indicator
const StepIndicator = ({ currentStep, totalSteps, labels }) => (
  <div className="flex items-center justify-between mb-4">
    {labels.map((label, idx) => {
      const stepNum  = idx + 1;
      const isDone   = stepNum < currentStep;
      const isActive = stepNum === currentStep;
      return (
        <React.Fragment key={label}>
          <div className="flex flex-col items-center gap-1.5">
            <div className={`
              w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold
              transition-all duration-300
              ${isDone   ? 'bg-green-500 text-white shadow-md shadow-green-500/30' : ''}
              ${isActive ? 'bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-md shadow-blue-500/30' : ''}
              ${!isDone && !isActive ? 'bg-slate-100 dark:bg-white/[0.05] text-slate-500 border border-slate-200 dark:border-white/[0.08]' : ''}
            `}>
              {isDone ? <CheckIcon /> : stepNum}
            </div>
            <span className={`text-xs font-medium ${isActive ? 'text-slate-900 dark:text-slate-300' : 'text-slate-500 dark:text-slate-600'}`}>
              {label}
            </span>
          </div>
          {idx < totalSteps - 1 && (
            <div className={`flex-1 h-px mx-3 transition-all duration-500 ${isDone ? 'bg-green-500/50' : 'bg-slate-200 dark:bg-white/[0.06]'}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);


// Main SignUp Component
const SignUp = () => {
  const navigate = useNavigate();

  // Wizard step: 1 = Account, 2 = Profile
  const [step, setStep] = useState(1);
  const [isGoogleSignup, setIsGoogleSignup] = useState(false);

  // Step 1 fields
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [confirmPass, setConfirmPass]   = useState('');
  const [showPass, setShowPass]         = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);

  // Step 2 fields
  const [fullName, setFullName]   = useState('');
  const [exam, setExam]           = useState('');
  const [stream, setStream]       = useState('');
  const [examDate, setExamDate]   = useState('');

  // Data from backend
  const [examStreams, setExamStreams] = useState({});
  const [examNames, setExamNames]       = useState([]);

  // UI state
  const [errors, setErrors]           = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading]         = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { syncUserToBackend } = useAuth();
  const passwordStrength = getPasswordStrength(password);
  const streams = examStreams[exam] || [];

  // Fetch signup config (exams + branches) from backend
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await getSignupConfig();
        const data = response.data;
        console.log('Signup config received:', data);
        
        // Handle strictly mapped frontend schemas (streams) or legacy (branches) gracefully
        if (data && typeof data === 'object') {
          const streamsData = data.streams || data.branches || {};
          const exams = Array.isArray(data.exams) ? data.exams : Object.keys(streamsData);
          
          console.log('Exams:', exams);
          console.log('Streams:', streamsData);
          
          setExamStreams(streamsData);
          setExamNames(exams);
          
          if (!exams || exams.length === 0) {
            console.warn('No exams loaded from backend. Database might be empty.');
          }
        } else {
          console.error('Invalid response format:', data);
        }
      } catch (error) {
        console.error('Error fetching signup config:', error);
        console.error('Error details:', error.response?.data);
        setExamNames([]);
        setExamStreams({});
        // Continue without errors - user can still proceed
      }
    };
    fetchConfig();
  }, []);

  // Clear branch when exam changes
  const handleExamChange = (e) => {
    setExam(e.target.value);
    setStream('');
    setErrors(prev => ({ ...prev, exam: '', stream: '' }));
  };

  // Step 1 validation
  const validateStep1 = () => {
    const errs = {};
    if (!email.trim())
      errs.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email))
      errs.email = 'Enter a valid email address.';
    if (!password)
      errs.password = 'Password is required.';
    else if (password.length < 6)
      errs.password = 'Password must be at least 6 characters.';
    if (!confirmPass)
      errs.confirmPass = 'Please confirm your password.';
    else if (password !== confirmPass)
      errs.confirmPass = 'Passwords do not match.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 2 validation
  const validateStep2 = () => {
    const errs = {};
    if (!isGoogleSignup && !fullName.trim())  errs.fullName = 'Full name is required.';
    if (!exam)             errs.exam     = 'Please select your target exam.';
    if (!stream)           errs.stream   = 'Please select your stream / specific course.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    setGlobalError('');
    setIsGoogleSignup(false);
    if (validateStep1()) setStep(2);
  };

  // Final submit (step 2)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError('');
    if (!validateStep2()) return;

    setLoading(true);
    try {
      let user;
      let finalFullName = fullName.trim();

      console.log('[SignUp] Starting submission...');
      console.log('[SignUp] isGoogleSignup:', isGoogleSignup);

      if (isGoogleSignup) {
        console.log('[SignUp] Initiating Google login...');
        user = await loginWithGoogle();
        console.log('[SignUp] Google login successful, user:', user.uid, user.email);
        finalFullName = finalFullName || user.displayName || 'PrepMate User';
      } else {
        console.log('[SignUp] Initiating email registration...');
        user = await registerWithEmail(email, password);
        console.log('[SignUp] Email registration successful, user:', user.uid);
      }

      // Sync user profile to backend with exam/stream info
      const userData = {
        firebaseUid: user.uid,
        email: user.email,
        fullName: finalFullName,
        exam,
        stream,
        examDate: examDate || null,
      };
      
      console.log('[SignUp] Syncing user to backend with data:', userData);
      
      const syncResult = await syncUserToBackend(user, userData);
      
      if (!syncResult) {
        throw new Error('Failed to sync user profile. Please try again.');
      }
      
      console.log('[SignUp] User sync successful, navigating to dashboard');
      navigate('/dashboard');
    } catch (err) {
      console.error('[SignUp] Error during submission:', err);
      console.error('[SignUp] Error response data:', err.response?.data);
      console.error('[SignUp] Full error:', err);
      
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred during signup';
      setGlobalError(errorMessage);
      
      if (!isGoogleSignup) setStep(1);
    } finally {
      setLoading(false);
    }
  };

  // Google signup — skip Firebase auth in step 1, wait for step 2 submission
  const handleGoogleSignup = () => {
    setGlobalError('');
    setIsGoogleSignup(true);
    setStep(2);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-slate-50 dark:bg-[#060914] flex flex-col items-center justify-center p-4 overflow-y-auto">

      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-60 -left-60 w-[500px] h-[500px] rounded-full bg-blue-600/8 blur-[140px]" />
        <div className="absolute top-40 right-0 w-[400px] h-[400px] rounded-full bg-cyan-500/5 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-[440px] mt-auto mb-auto">

        {/* Brand header */}
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
            Start your exam preparation journey
          </p>
        </div>

        {/* Card */}
        <div className="w-full bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl shadow-sm dark:shadow-2xl dark:shadow-black/50 max-h-[80vh] overflow-y-auto custom-scrollbar flex flex-col">
          <div className="p-6 sm:p-8 flex-1 flex flex-col">

          {/* Step indicator */}
          <StepIndicator
            currentStep={step}
            totalSteps={2}
            labels={['Account', 'Exam Profile']}
          />

          {/* Global error */}
          {globalError && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm flex items-start gap-2.5">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>{globalError}</span>
            </div>
          )}

          {/* ── STEP 1: Account Details ───────────────────────────────────── */}
          {step === 1 && (
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Create your account</h2>
              <p className="text-slate-500 text-xs mb-3">Enter your email and set a secure password</p>

              <div className="flex flex-col gap-3">
                <InputField
                  id="email"
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
                  placeholder="you@example.com"
                  icon={MailIcon}
                  error={errors.email}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InputField
                    id="new-password"
                    label="Password"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
                    placeholder="Min. 6 characters"
                    icon={LockIcon}
                    error={errors.password}
                    hint="Use uppercase, numbers and symbols for a stronger password"
                    rightElement={
                      <button type="button" onClick={() => setShowPass(v => !v)}
                        className="text-slate-500 hover:text-slate-300 transition-colors"
                        aria-label={showPass ? 'Hide' : 'Show'}>
                        {showPass ? <EyeClosedIcon /> : <EyeOpenIcon />}
                      </button>
                    }
                  />

                  <InputField
                    id="confirm-password"
                    label="Confirm Password"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPass}
                    onChange={(e) => { setConfirmPass(e.target.value); setErrors(p => ({ ...p, confirmPass: '' })); }}
                    placeholder="Re-enter password"
                    icon={LockIcon}
                    error={errors.confirmPass}
                    rightElement={
                      <button type="button" onClick={() => setShowConfirm(v => !v)}
                        className="text-slate-500 hover:text-slate-300 transition-colors"
                        aria-label={showConfirm ? 'Hide' : 'Show'}>
                        {showConfirm ? <EyeClosedIcon /> : <EyeOpenIcon />}
                      </button>
                    }
                  />
                </div>

                {/* Password strength bar */}
                {password && (
                  <div className="flex items-center gap-2 mt-[-4px]">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-medium ${
                      passwordStrength.score === 4 ? 'text-green-500 dark:text-green-400' :
                      passwordStrength.score === 3 ? 'text-yellow-500 dark:text-yellow-400' :
                      passwordStrength.score === 2 ? 'text-orange-500 dark:text-orange-400' : 'text-red-500 dark:text-red-400'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="
                    w-full py-2 px-4 rounded-xl font-bold text-sm text-white
                    bg-gradient-to-r from-blue-600 to-blue-500
                    hover:from-blue-500 hover:to-blue-400
                    active:scale-[0.98]
                    shadow-lg shadow-blue-500/20
                    transition-all duration-200
                    flex items-center justify-center gap-2
                  "
                >
                  Continue →
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-200 dark:bg-white/[0.06]" />
                <span className="text-xs text-slate-500 dark:text-slate-600 font-medium tracking-wider">OR SIGN UP WITH</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-white/[0.06]" />
              </div>

              {/* Google */}
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={googleLoading}
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
                {googleLoading ? (
                  <><SpinnerIcon /> Connecting…</>
                ) : (
                  <><GoogleIcon /> Continue with Google</>
                )}
              </button>
            </div>
          )}

          {/* ── STEP 2: Exam Profile ──────────────────────────────────────── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} noValidate>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Set up your exam profile</h2>
              <p className="text-slate-500 text-xs mb-3">
                This helps us personalise your study planner and subjects
              </p>

              <div className="flex flex-col gap-3">
                <InputField
                  id="fullname"
                  label={`Full Name ${isGoogleSignup ? '(Optional)' : ''}`}
                  type="text"
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); setErrors(p => ({ ...p, fullName: '' })); }}
                  placeholder={isGoogleSignup ? 'Google will auto-fill if empty' : 'Your full name'}
                  icon={UserIcon}
                  error={errors.fullName}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <SelectField
                    id="exam"
                    label="Target Exam"
                    value={exam}
                    onChange={handleExamChange}
                    options={examNames}
                    placeholder="Select your exam…"
                    error={errors.exam}
                  />

                  {/* Stream — only shows once exam is selected */}
                  {exam && (
                    <SelectField
                      id="stream"
                      label="Stream / Specific Course"
                      value={stream}
                      onChange={(e) => { setStream(e.target.value); setErrors(p => ({ ...p, stream: '' })); }}
                      options={streams}
                      placeholder="Select your stream…"
                      error={errors.stream}
                    />
                  )}
                </div>

                {/* Exam date — optional but helpful for countdown */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="exam-date" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Exam Date <span className="text-slate-500 dark:text-slate-600 font-normal">(optional)</span>
                  </label>
                  <input
                    id="exam-date"
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="
                      w-full px-4 py-2 rounded-xl text-sm
                      bg-white dark:bg-[#0d1424] text-slate-900 dark:text-slate-200
                      border border-slate-300 dark:border-white/[0.07] focus:border-blue-500/60
                      focus:ring-2 focus:ring-blue-500/20
                      transition-all duration-200 outline-none
                    "
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setIsGoogleSignup(false); }}
                    className="
                      flex-1 py-2 px-4 rounded-xl font-semibold text-sm text-slate-600 dark:text-slate-400
                      bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08]
                      border border-slate-300 dark:border-white/[0.07]
                      transition-all duration-200
                    "
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="
                      flex-[2] py-2 px-4 rounded-xl font-bold text-sm text-white
                      bg-gradient-to-r from-blue-600 to-violet-600
                      hover:from-blue-500 hover:to-violet-500
                      active:scale-[0.98]
                      disabled:opacity-50 disabled:cursor-not-allowed
                      shadow-lg shadow-blue-500/20
                      transition-all duration-200
                      flex items-center justify-center gap-2
                    "
                  >
                    {loading ? (
                      <><SpinnerIcon /> Creating account…</>
                    ) : (
                      '🚀 Start Preparing'
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Spacer to push login link to the bottom if container is taller than content */}
          <div className="flex-1" />

          {/* Login link */}
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-white/[0.06] shrink-0">
            <p className="text-center text-slate-500 text-xs">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-500 hover:text-blue-400 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default SignUp;