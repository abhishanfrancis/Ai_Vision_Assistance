import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Eye,
  Settings,
  Volume2,
  Type,
  Activity,
  Camera,
  ShieldAlert,
  LayoutDashboard,
  Users,
  Bell,
  LogOut,
  Lock,
  Loader2,
  Navigation,
  DollarSign,
  History,
  Trash2,
  Upload,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = 'http://localhost:8000';

function App() {
  const [view, setView] = useState('user'); // 'user', 'login', 'admin'
  const [isStreaming, setIsStreaming] = useState(false);
  const [status, setStatus] = useState('offline');
  const [loading, setLoading] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [voiceHistory, setVoiceHistory] = useState([]);

  // Bug 4/6: track which feature is currently active
  const [activeFeature, setActiveFeature] = useState('idle');
  // Bug 5: per-feature loading message
  const [featureLoading, setFeatureLoading] = useState('');
  // Ref to cancel in-flight API requests when switching features
  const abortControllerRef = useRef(null);

  // Admin Data
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [uploadProgress, setUploadProgress] = useState(null);
  const [loginError, setLoginError] = useState(''); // Bug #10 fix: inline error instead of alert()

  const cardRef = useRef(null);
  const fileInputRef = useRef(null);

  const [speechSettings, setSpeechSettings] = useState({
    rate: 150,
    volume: 0.9,
    enabled: true,
    narrator_mode: true
  });
  const [aiResponse, setAiResponse] = useState('');

  useEffect(() => {
    // Check for existing admin session
    const savedAdmin = localStorage.getItem('vision_admin');
    if (savedAdmin) {
      const user = JSON.parse(savedAdmin);
      setAdminUser(user);
      setView('admin');
      fetchAdminData();
    }
  }, []);

  useEffect(() => {
    checkBackend();
    const interval = setInterval(checkBackend, 5000);
    return () => clearInterval(interval);
  }, []);

  const speakInBrowser = (text, settings = speechSettings) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (!settings.enabled || !text || text.trim() === '') return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = Math.max(0.5, Math.min(2.0, (settings.rate || 150) / 150));
    utterance.volume = settings.volume !== undefined ? settings.volume : 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const checkBackend = async () => {
    try {
      const res = await axios.get(`${API_BASE}/status`);
      if (res.data.status === 'online') {
        setStatus(res.data.camera === 'connected' ? 'online' : 'camera_error');
      }
    } catch (e) {
      setStatus('offline');
    }
  };

  const updateSpeechSettings = async (newSettings) => {
    setSpeechSettings(newSettings);
    if (!newSettings.enabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    try {
      await axios.post(`${API_BASE}/settings`, newSettings);
    } catch (e) {
      console.error("Failed to update speech settings", e);
    }
  };

  const addVoiceHistory = (text) => {
    setVoiceHistory(prev => [{ text, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
    setAiResponse(text);
    speakInBrowser(text);
  };

  /**
   * Bug 1-3, 6: Centralized feature switch.
   * Cancels any in-flight API request, stops backend speech,
   * sets the backend mode, and updates frontend state.
   */
  const switchFeature = async (mode, loadingMsg = '') => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    // Cancel any in-flight HTTP request from the previous feature
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Stop backend speech + set mode (fire-and-forget, don't block UI)
    try {
      await Promise.all([
        axios.post(`${API_BASE}/stop_speech`),
        axios.post(`${API_BASE}/set_mode`, { mode })
      ]);
    } catch (_) { /* backend may be briefly unreachable */ }

    setActiveFeature(mode);
    setLoading(true);
    setFeatureLoading(loadingMsg);
    setAiResponse(loadingMsg);

    return abortControllerRef.current.signal;
  };

  const handleDescribeScene = async () => {
    const signal = await switchFeature('scene_check', 'Scanning surroundings...');
    try {
      const res = await axios.get(`${API_BASE}/describe_scene`, { signal });
      addVoiceHistory(res.data.description);
    } catch (e) {
      if (!axios.isCancel(e)) addVoiceHistory('Scene analysis failed.');
    }
    setLoading(false);
    setFeatureLoading('');
  };

  const handleReadText = async () => {
    const signal = await switchFeature('read_text', 'Reading text...');
    try {
      const res = await axios.post(`${API_BASE}/read_text`, null, { signal });
      addVoiceHistory(res.data.text || 'No text detected.');
    } catch (e) {
      if (!axios.isCancel(e)) addVoiceHistory('OCR request failed.');
    }
    setLoading(false);
    setFeatureLoading('');
  };

  const handleCurrency = async () => {
    const signal = await switchFeature('currency', 'Scanning for currency...');
    try {
      const res = await axios.get(`${API_BASE}/identify_currency`, { signal });
      addVoiceHistory(res.data.text || 'Could not identify currency.');
    } catch (e) {
      if (!axios.isCancel(e)) addVoiceHistory('Currency recognition failed.');
    }
    setLoading(false);
    setFeatureLoading('');
  };

  const handleIdentifyBottle = async () => {
    const signal = await switchFeature('identify_item', 'Detecting object...');
    try {
      const res = await axios.get(`${API_BASE}/describe_bottle`, { signal });
      addVoiceHistory(res.data.description || res.data.error);
    } catch (e) {
      if (!axios.isCancel(e)) addVoiceHistory('Object identification failed.');
    }
    setLoading(false);
    setFeatureLoading('');
  };

  const triggerAlert = async () => {
    // SOS doesn't cancel other features — it's an additive emergency action
    try {
      await axios.post(`${API_BASE}/stop_speech`);
      await axios.post(`${API_BASE}/trigger_alert`, { location: 'User Context' });
      setActiveFeature('sos');
      addVoiceHistory('Emergency Alert Sent!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(''); // clear previous error
    try {
      const res = await axios.post(`${API_BASE}/admin/login`, loginData);
      const user = res.data.user;
      setAdminUser(user);
      localStorage.setItem('vision_admin', JSON.stringify(user));
      setView('admin');
      fetchAdminData();
      addVoiceHistory('Admin authenticated successfully.');
    } catch (e) {
      // Bug #10 fix: inline error state instead of alert()
      setLoginError('Invalid credentials. Please try again.');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setAdminUser(null);
    localStorage.removeItem('vision_admin');
    setView('user');
  };

  const fetchAdminData = async () => {
    try {
      const [logsRes, usersRes, alertsRes] = await Promise.all([
        axios.get(`${API_BASE}/admin/logs`),
        axios.get(`${API_BASE}/admin/users`),
        axios.get(`${API_BASE}/admin/alerts`)
      ]);
      setLogs(logsRes.data);
      setUsers(usersRes.data);
      setAlerts(alertsRes.data);
    } catch (e) {
      console.error("Failed to fetch admin data", e);
    }
  };

  const deleteUser = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`${API_BASE}/admin/users/${id}`);
      fetchAdminData();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to delete user");
    }
  };

  const clearLogs = async () => {
    if (!confirm("Delete all activity logs?")) return;
    try {
      await axios.post(`${API_BASE}/admin/clear_logs`);
      fetchAdminData();
    } catch (e) {
      alert("Failed to clear logs");
    }
  };

  const handleDatasetUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setUploadProgress('Uploading...');

    try {
      await axios.post(`${API_BASE}/admin/update_dataset`, formData);
      setUploadProgress('Upload Successful!');
      fetchAdminData();
      setTimeout(() => setUploadProgress(null), 3000);
    } catch (e) {
      setUploadProgress('Upload Failed');
      setTimeout(() => setUploadProgress(null), 3000);
    }
  };

  const renderUserView = () => (
    <div className="grid-layout">
      <main>
        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card main-card"
          style={{ padding: '20px', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}
        >
          <div className="video-container">
            {isStreaming && status === 'online' ? (
              <>
                <img
                  className="video-feed"
                  src={`${API_BASE}/video_feed`}
                  alt="Live Webcam Feed"
                  onError={() => {
                    // Bug #11 fix: also reset isStreaming so user can retry
                    setIsStreaming(false);
                    setStatus('camera_error');
                  }}
                />
                <motion.div
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'var(--primary)',
                    boxShadow: '0 0 15px var(--primary)',
                    zIndex: 10,
                    opacity: 0.6
                  }}
                />
              </>
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                <Camera size={64} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                {status === 'camera_error' ? (
                  <p style={{ color: 'var(--danger)' }}>Camera not detected. Please ensure your webcam is connected.</p>
                ) : (
                  <p>Vision system is currently in standby.</p>
                )}
                <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => {
                  // Bug #11 fix: clear camera_error status when user retries
                  if (status === 'camera_error') setStatus('offline');
                  setIsStreaming(true);
                }}>
                  <Activity size={18} /> Initialize Vision
                </button>
              </div>
            )}

            <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
              <div className="status-badge" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)' }}>
                <div className={status === 'online' ? 'pulse' : ''} />
                <span style={{ color: 'white' }}>{status.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            <button
              className={`btn ${activeFeature === 'scene_check' ? 'btn-active' : 'btn-secondary'} ${loading && activeFeature === 'scene_check' ? 'btn-loading' : ''}`}
              onClick={handleDescribeScene}
              disabled={loading && activeFeature !== 'scene_check'}
            >
              {loading && activeFeature === 'scene_check' ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Eye size={18} />}
              {loading && activeFeature === 'scene_check' ? 'Scanning...' : 'Scene Check'}
            </button>
            <button
              className={`btn ${activeFeature === 'read_text' ? 'btn-active' : 'btn-secondary'} ${loading && activeFeature === 'read_text' ? 'btn-loading' : ''}`}
              onClick={handleReadText}
              disabled={loading && activeFeature !== 'read_text'}
            >
              {loading && activeFeature === 'read_text' ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Type size={18} />}
              {loading && activeFeature === 'read_text' ? 'Reading...' : 'Read Text'}
            </button>
            <button
              className={`btn ${activeFeature === 'currency' ? 'btn-active' : 'btn-secondary'} ${loading && activeFeature === 'currency' ? 'btn-loading' : ''}`}
              onClick={handleCurrency}
              disabled={loading && activeFeature !== 'currency'}
            >
              {loading && activeFeature === 'currency' ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <DollarSign size={18} />}
              {loading && activeFeature === 'currency' ? 'Scanning...' : 'Currency'}
            </button>
            <button
              className={`btn ${activeFeature === 'identify_item' ? 'btn-active' : 'btn-secondary'} ${loading && activeFeature === 'identify_item' ? 'btn-loading' : ''}`}
              onClick={handleIdentifyBottle}
              disabled={loading && activeFeature !== 'identify_item'}
            >
              {loading && activeFeature === 'identify_item' ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Navigation size={18} />}
              {loading && activeFeature === 'identify_item' ? 'Detecting...' : 'Identify Item'}
            </button>
            <button
              className={`btn btn-danger ${activeFeature === 'sos' ? 'btn-active' : ''}`}
              onClick={triggerAlert}
            >
              <ShieldAlert size={18} /> SOS Alert
            </button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {aiResponse && (
            <motion.div
              key={aiResponse}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-card"
              style={{ padding: '24px', borderLeft: '4px solid var(--primary)', marginBottom: '2rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Volume2 color="var(--primary)" size={18} />
                <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>AI Narrative</h3>
              </div>
              <p style={{ lineHeight: '1.6', color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: '500' }}>{aiResponse}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <aside>
        <div className="glass-card" style={{ padding: '24px', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={18} /> Voice Settings
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.9rem' }}>Audio Feedback</span>
                <label className="switch">
                  <input type="checkbox" checked={speechSettings.enabled} onChange={(e) => updateSpeechSettings({ ...speechSettings, enabled: e.target.checked })} />
                  <span className="slider"></span>
                </label>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.9rem' }}>Speaking Rate</span>
                <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{speechSettings.rate}</span>
              </div>
              <input
                type="range" min="50" max="300" step="10"
                value={speechSettings.rate}
                onChange={(e) => updateSpeechSettings({ ...speechSettings, rate: parseInt(e.target.value) })}
              />
            </div>

            <button
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={async () => {
                const msg = "Testing the AI Vision Assist audio feedback system.";
                speakInBrowser(msg);
                try {
                  await axios.get(`${API_BASE}/test_speech`);
                } catch (e) {
                  console.error(e);
                }
              }}
            >
              Test Voice Modules
            </button>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={18} /> Session Log
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {voiceHistory.map((h, i) => (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={i} style={{ paddingBottom: '8px', borderBottom: '1px solid var(--glass-border)' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{h.text}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{h.time}</p>
              </motion.div>
            ))}
            {voiceHistory.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No history yet this session.</p>}
          </div>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <button className="btn btn-secondary" style={{ width: '100%', opacity: 0.6 }} onClick={() => setView('login')}>
            <Lock size={16} /> Restricted Admin Portal
          </button>
        </div>
      </aside>
    </div>
  );

  const renderLoginView = () => (
    <div style={{ maxWidth: '440px', margin: '80px auto', width: '100%' }}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card" style={{ padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ width: '64px', height: '64px', background: 'var(--primary)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <ShieldAlert color="white" size={32} />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Admin Gateway</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Verify credentials to access system telemetry</p>
        </div>

        <form onSubmit={handleAdminLogin}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>System Identity</label>
            <input
              style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
              type="text"
              placeholder="Username"
              value={loginData.username}
              onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
              required
            />
          </div>
          <div style={{ marginBottom: '2.5rem' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>Access Key</label>
            <input
              style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
              type="password"
              placeholder="••••••••"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              required
            />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '16px' }} disabled={loading}>
            {loading 
              ? <Loader2 style={{ animation: 'spin 1s linear infinite' }} /> 
              : 'Authenticate'
            }
          </button>
          {/* Bug #10 fix: inline error message instead of alert() */}
          {loginError && (
            <p role="alert" style={{ color: 'var(--danger)', fontSize: '0.9rem', marginTop: '0.75rem', textAlign: 'center', padding: '8px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>
              {loginError}
            </p>
          )}
          <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }} onClick={() => { setLoginError(''); setView('user'); }}>Discard</button>
        </form>
      </motion.div>
    </div>
  );

  const renderAdminView = () => (
    <div className="admin-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <LayoutDashboard size={32} color="var(--primary)" /> System Telemetry
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>Monitoring AI performance and user safety protocols</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={fetchAdminData}>
            <RefreshCw size={18} /> Refresh
          </button>
          <button className="btn btn-danger" onClick={handleLogout}>
            <LogOut size={18} /> Terminate Session
          </button>
        </div>
      </header>

      <div className="admin-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '3rem' }}>
        <AdminStatCard icon={<Users />} label="Registered Operators" value={users.length} color="#6366f1" />
        <AdminStatCard icon={<Activity />} label="Neural Processing" value="Active (8ms)" color="#10b981" />
        <AdminStatCard icon={<Bell />} label="Telemetry Alerts" value={alerts.length} color="#f59e0b" />
        <AdminStatCard icon={<ShieldAlert />} label="Critical Flags" value={alerts.filter(a => a.status === 'Pending').length} color="#ef4444" />
      </div>

      <div className="grid-layout" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <History size={20} color="var(--primary)" /> Activity Timeline
              </h3>
              <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={clearLogs}>
                Clear Telemetry
              </button>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
              {logs.map((log, i) => (
                <LogItem key={i} action={log.action} details={log.details} time={new Date(log.timestamp).toLocaleString()} />
              ))}
              {logs.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Metadata stream empty.</p>}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={20} color="var(--accent)" /> User Registry
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {users.map((u) => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                  <div>
                    <p style={{ fontWeight: 'bold' }}>{u.username} {u.is_admin && <span style={{ fontSize: '0.6rem', background: 'var(--primary)', color: 'white', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>ADMIN</span>}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Registered: {new Date(u.created_at).toLocaleDateString()}</p>
                  </div>
                  {!u.is_admin && (
                    <button onClick={() => deleteUser(u.id)} style={{ padding: '8px', color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '24px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', color: '#f59e0b' }}>
              <Bell size={20} /> Priority Alerts
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {alerts.map((alert, i) => (
                <div key={i} className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--danger)', background: 'rgba(239, 68, 68, 0.1)' }}>
                  <p style={{ fontWeight: 'bold' }}>Location: {alert.location}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{new Date(alert.timestamp).toLocaleString()}</p>
                </div>
              ))}
              {alerts.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No critical alerts in buffer.</p>}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Upload size={20} color="var(--primary)" /> Vision Training
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Upload environmental samples to improve object recognition accuracy.</p>
            <input type="file" ref={fileInputRef} onChange={handleDatasetUpload} style={{ display: 'none' }} />
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => fileInputRef.current.click()}>
              <Upload size={18} /> Send Data Sample
            </button>
            {uploadProgress && <p style={{ marginTop: '12px', fontSize: '0.8rem', textAlign: 'center', color: uploadProgress.includes('Success') ? 'var(--accent)' : 'var(--text-primary)' }}>{uploadProgress}</p>}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="glass-card" style={{ padding: '12px', background: 'linear-gradient(135deg, var(--primary), #818cf8)', borderRadius: '16px', boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)' }}>
            <Eye color="white" size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-0.5px' }}>VisionAssist<span style={{ color: 'var(--primary)' }}>.AI</span></h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Precision Guidance for the Visually Impaired</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className={`status-badge ${status === 'online' ? 'status-online' : ''}`}>
            <div className={status === 'online' ? 'pulse' : ''} />
            {status.replace('_', ' ').toUpperCase()}
          </div>
        </div>
      </header>

      <div style={{ flex: 1 }}>
        {view === 'user' && renderUserView()}
        {view === 'login' && renderLoginView()}
        {view === 'admin' && renderAdminView()}
      </div>

      <footer style={{ marginTop: '5rem', padding: '3rem 0', borderTop: '1px solid var(--glass-border)', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Project VisionAssist AI &copy; 2026</p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '8px' }}>Empowering accessibility through advanced computer vision.</p>
      </footer>
    </div>
  );
}

function AdminStatCard({ icon, label, value, color }) {
  return (
    <div className="glass-card" style={{ padding: '32px', display: 'flex', alignItems: 'center', gap: '24px', transition: 'transform 0.3s' }}>
      <div style={{ padding: '16px', background: color + '20', color: color, borderRadius: '16px' }}>{icon}</div>
      <div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>{label}</p>
        <p style={{ fontSize: '1.8rem', fontWeight: '800' }}>{value}</p>
      </div>
    </div>
  );
}

function LogItem({ action, details, time }) {
  return (
    <div style={{ padding: '16px 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', padding: '2px 8px', borderRadius: '4px', background: action.includes('Alert') ? 'var(--danger)' : 'var(--glass)', color: action.includes('Alert') ? 'white' : 'var(--text-primary)' }}>{action}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{time}</span>
        </div>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>{details}</p>
      </div>
    </div>
  );
}

export default App;
