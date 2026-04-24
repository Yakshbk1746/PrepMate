import React, { useEffect, useState } from 'react';
import { User, BookOpen, Clock, Palette, Bell, Shield, Info, Upload, Download, Trash2, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/authContext';
import { getSignupConfig, getUserByFirebaseUid, updateUserProfile } from '../services/api';

const SettingsPage = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, backendUserId } = useAuth();

  // Personal Information
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Exam Details
  const [selectedExam, setSelectedExam] = useState('GATE');
  const [stream, setStream] = useState('');
  const [examDate, setExamDate] = useState('');

  // Preferences
  const [pomodoroTime, setPomodoroTime] = useState('25');
  const [weekStart, setWeekStart] = useState('Monday');
  const [timeFormat, setTimeFormat] = useState('12h');

  // Appearance
  const [themeMode, setThemeMode] = useState(theme);

  // Notifications
  const [browserNotifs, setBrowserNotifs] = useState(true);
  const [timerSound, setTimerSound] = useState(true);
  const [breakReminders, setBreakReminders] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [examOptions, setExamOptions] = useState(['GATE', 'UPSC', 'SSC CGL', 'SSC CHSL', 'CAT', 'JEE', 'NEET', 'CLAT', 'NDA', 'Other']);

  useEffect(() => {
    getSignupConfig()
      .then((config) => {
        const exams = Array.isArray(config?.exams) ? config.exams.filter(Boolean) : [];
        if (exams.length > 0) {
          setExamOptions(exams);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!user?.uid) return;

    getUserByFirebaseUid(user.uid)
      .then((data) => {
        setFullName(data?.fullName || user?.displayName || '');
        setEmail(data?.email || user?.email || '');
        setPhotoUrl(data?.photoUrl || user?.photoURL || '');
        setSelectedExam(data?.exam || 'GATE');
        setStream(data?.stream || '');
        setExamDate(data?.examDate || '');
        setPomodoroTime(String(data?.pomodoroTime || '25'));
        setWeekStart(data?.weekStart || 'Monday');
        setTimeFormat(data?.timeFormat || '12h');
        setBrowserNotifs(data?.browserNotifs ?? true);
        setTimerSound(data?.timerSound ?? true);
        setBreakReminders(data?.breakReminders ?? true);

        const backendTheme = data?.theme;
        if (backendTheme && backendTheme !== themeMode) {
          setThemeMode(backendTheme);
          if (backendTheme !== 'auto') {
            if ((backendTheme === 'dark' && theme !== 'dark') || (backendTheme === 'light' && theme !== 'light')) {
              toggleTheme();
            }
          }
        }
      })
      .catch(console.error);
  }, [user?.uid, user?.displayName, user?.email, user?.photoURL]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSaveMessage('Please select an image file (JPG/PNG/WebP).');
      e.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setSaveMessage('Image is too large. Max size is 2MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setPhotoUrl(result);
      setSaveMessage('Photo selected. Click Save Settings to persist.');
    };
    reader.onerror = () => {
      setSaveMessage('Failed to read image file. Please try another file.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    setPhotoUrl('');
    setSaveMessage('Photo removed. Click Save Settings to persist.');
  };

  const handleThemeChange = (mode) => {
    setThemeMode(mode);
    if (mode === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if ((prefersDark && theme !== 'dark') || (!prefersDark && theme !== 'light')) {
        toggleTheme();
      }
    } else if (mode !== theme) {
      toggleTheme();
    }
  };

  const handleExport = () => {
    const data = { fullName, email, photoUrl, selectedExam, stream, examDate, pomodoroTime, weekStart, timeFormat, themeMode, browserNotifs, timerSound, breakReminders };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prepmate-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveSettings = () => {
    if (!backendUserId) return;

    setIsSaving(true);
    setSaveMessage('');

    updateUserProfile(backendUserId, {
      fullName,
      photoUrl,
      exam: selectedExam,
      stream,
      examDate,
      pomodoroTime,
      weekStart,
      timeFormat,
      theme: themeMode,
      browserNotifs,
      timerSound,
      breakReminders,
    })
      .then(() => {
        setSaveMessage('Settings saved successfully.');
      })
      .catch((err) => {
        console.error(err);
        setSaveMessage('Failed to save settings.');
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const cardClass = "bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm dark:shadow-none";
  const inputClass = "w-full px-4 py-2.5 rounded-xl bg-white dark:bg-white/[0.05] border border-slate-300 dark:border-white/[0.1] text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm";
  const labelClass = "text-xs text-slate-500 font-semibold block mb-1.5";
  const sectionTitleClass = "text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4";

  return (
    <div className="space-y-6 max-w-3xl">

      <div className="flex items-center justify-end gap-3">
        {saveMessage && (
          <span className={`text-xs font-semibold ${saveMessage.includes('Failed') ? 'text-red-500' : 'text-emerald-500'}`}>
            {saveMessage}
          </span>
        )}
        <button
          onClick={handleSaveSettings}
          disabled={isSaving || !backendUserId}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* 1. Personal Information */}
      <div className={cardClass}>
        <h3 className={sectionTitleClass}>
          <User size={18} className="text-blue-400" />
          Personal Information
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover border border-slate-200 dark:border-white/10 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-xl shrink-0">
                {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <label htmlFor="settings-photo-upload" className="px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-all flex items-center gap-2 cursor-pointer w-fit">
                  <Upload size={14} /> Upload Photo
                </label>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={!photoUrl}
                  className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Remove Image
                </button>
              </div>
              <input id="settings-photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              <p className="text-[10px] text-slate-500 mt-1">JPG, PNG. Max 2MB</p>
            </div>
          </div>
          <div>
            <label className={labelClass}>Full Name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" value={email} disabled className={`${inputClass} opacity-60 cursor-not-allowed`} />
            <p className="text-[10px] text-slate-500 mt-1">Email cannot be changed</p>
          </div>
        </div>
      </div>

      {/* 2. Exam Details */}
      <div className={cardClass}>
        <h3 className={sectionTitleClass}>
          <BookOpen size={18} className="text-emerald-400" />
          Exam Details
        </h3>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Target Exam</label>
            <select value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)} className={inputClass}>
              {examOptions.map(exam => (
                <option key={exam} value={exam}>{exam}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Stream</label>
            <input type="text" value={stream} onChange={(e) => setStream(e.target.value)} placeholder="e.g., Computer Science" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Exam Date</label>
            <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>

      {/* 3. Preferences */}
      <div className={cardClass}>
        <h3 className={sectionTitleClass}>
          <Clock size={18} className="text-violet-400" />
          Preferences
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Default Pomodoro</label>
            <select value={pomodoroTime} onChange={(e) => setPomodoroTime(e.target.value)} className={inputClass}>
              <option value="25">25 minutes</option>
              <option value="50">50 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Week Starts On</label>
            <select value={weekStart} onChange={(e) => setWeekStart(e.target.value)} className={inputClass}>
              <option value="Monday">Monday</option>
              <option value="Sunday">Sunday</option>
              <option value="Saturday">Saturday</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Time Format</label>
            <select value={timeFormat} onChange={(e) => setTimeFormat(e.target.value)} className={inputClass}>
              <option value="12h">12-hour</option>
              <option value="24h">24-hour</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Appearance */}
      <div className={cardClass}>
        <h3 className={sectionTitleClass}>
          <Palette size={18} className="text-pink-400" />
          Appearance
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'light', label: 'Light', icon: Sun },
            { value: 'dark', label: 'Dark', icon: Moon },
            { value: 'auto', label: 'Auto', icon: Monitor },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => handleThemeChange(value)}
              className={`p-4 rounded-xl border text-center transition-all ${
                themeMode === value
                  ? 'bg-blue-500/10 border-blue-500/50 text-blue-400'
                  : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.06] text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
              }`}
            >
              <Icon size={20} className="mx-auto mb-2" />
              <span className="text-sm font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 5. Notifications */}
      <div className={cardClass}>
        <h3 className={sectionTitleClass}>
          <Bell size={18} className="text-yellow-400" />
          Notifications
        </h3>
        <div className="space-y-4">
          {[
            { label: 'Browser Notifications', description: 'Get notified about study reminders', value: browserNotifs, setter: setBrowserNotifs },
            { label: 'Timer Sound', description: 'Play sound when timer ends', value: timerSound, setter: setTimerSound },
            { label: 'Break Reminders', description: 'Remind to take breaks during study', value: breakReminders, setter: setBreakReminders },
          ].map(({ label, description, value, setter }) => (
            <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">{label}</div>
                <div className="text-xs text-slate-500">{description}</div>
              </div>
              <button
                onClick={() => setter(!value)}
                className={`w-11 h-6 rounded-full transition-all relative ${
                  value ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <div className={`w-4.5 h-4.5 absolute top-[3px] rounded-full bg-white shadow transition-all ${
                  value ? 'left-[22px]' : 'left-[3px]'
                }`} style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Data & Privacy */}
      <div className={cardClass}>
        <h3 className={sectionTitleClass}>
          <Shield size={18} className="text-orange-400" />
          Data & Privacy
        </h3>
        <div className="space-y-3">
          <button onClick={handleExport} className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors text-left group">
            <div className="flex items-center gap-3">
              <Download size={18} className="text-blue-400" />
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">Export Data</div>
                <div className="text-xs text-slate-500">Download all your data as JSON</div>
              </div>
            </div>
            <span className="text-xs text-blue-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Export →</span>
          </button>

          <button onClick={() => { localStorage.clear(); alert('Cache cleared!'); }} className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors text-left group">
            <div className="flex items-center gap-3">
              <Trash2 size={18} className="text-yellow-400" />
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">Clear Cache</div>
                <div className="text-xs text-slate-500">Remove locally stored data</div>
              </div>
            </div>
            <span className="text-xs text-yellow-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Clear →</span>
          </button>

          <button onClick={() => { if (window.confirm('Are you sure? This cannot be undone.')) console.log('Account deletion requested'); }} className="w-full flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-colors text-left group">
            <div className="flex items-center gap-3">
              <Trash2 size={18} className="text-red-400" />
              <div>
                <div className="text-sm font-semibold text-red-400">Delete Account</div>
                <div className="text-xs text-slate-500">Permanently delete your account and data</div>
              </div>
            </div>
            <span className="text-xs text-red-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Delete →</span>
          </button>
        </div>
      </div>

      {/* 7. About */}
      <div className={cardClass}>
        <h3 className={sectionTitleClass}>
          <Info size={18} className="text-cyan-400" />
          About
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
            <span className="text-sm text-slate-500">App Version</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">PrepMate v1.0.0</span>
          </div>
          <div className="flex gap-3 pt-2">
            <button className="text-xs text-blue-400 hover:text-blue-300 font-semibold hover:underline">Privacy Policy</button>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <button className="text-xs text-blue-400 hover:text-blue-300 font-semibold hover:underline">Terms of Service</button>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <button className="text-xs text-blue-400 hover:text-blue-300 font-semibold hover:underline">Open Source Licenses</button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default SettingsPage;
