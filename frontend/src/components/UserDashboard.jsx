import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  Type, 
  DollarSign, 
  Box, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  Activity, 
  Camera 
} from 'lucide-react';

export default function UserDashboard({
  isStreaming = false,
  status = 'offline',
  speechEnabled = true,
  onToggleSpeech = () => {},
  onToggleStream = () => {},
  onSceneCheck = () => {},
  onReadText = () => {},
  onIdentifyCurrency = () => {},
  onIdentifyItem = () => {},
  onSosAlert = () => {},
  videoSrc = '',
  aiResponse = '',
  loading = false
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 font-sans selection:bg-cyan-500/30">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Top Bar */}
        <header 
          className="flex flex-col sm:flex-row justify-between items-center gap-6 p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl"
          role="banner"
        >
          <div className="flex items-center gap-4">
            <div 
              className={`flex items-center gap-3 px-6 py-3 rounded-full border ${
                status === 'online' 
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' 
                  : status === 'camera_error' 
                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                    : 'bg-white/5 border-white/10 text-gray-400'
              }`}
              role="status"
              aria-live="polite"
            >
              <Activity size={28} className={status === 'online' ? 'animate-pulse' : ''} />
              <span className="text-xl font-bold tracking-wide uppercase">
                Status: {status.replace('_', ' ')}
              </span>
            </div>
          </div>

          <button
            onClick={onToggleSpeech}
            className={`flex items-center gap-4 px-8 py-4 rounded-full transition-all duration-300 border focus:outline-none focus:ring-4 focus:ring-cyan-500/50 ${
              speechEnabled 
                ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/20' 
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
            }`}
            aria-label={speechEnabled ? "Voice Feedback is Enabled. Click to disable." : "Voice Feedback is Disabled. Click to enable."}
            aria-pressed={speechEnabled}
            role="switch"
          >
            {speechEnabled ? <Volume2 size={32} /> : <VolumeX size={32} />}
            <span className="text-xl font-bold">Voice Settings</span>
          </button>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Video Feed & Narrative */}
          <div className="lg:col-span-7 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative aspect-video bg-black/50 backdrop-blur-md rounded-3xl overflow-hidden border-4 border-white/10 shadow-2xl flex flex-col items-center justify-center"
              role="region"
              aria-label="Live Camera Feed"
            >
              {isStreaming && status === 'online' ? (
                <>
                  <img 
                    src={videoSrc} 
                    alt="Live Web Camera Feed" 
                    className="w-full h-full object-cover"
                  />
                  {/* Scanning Animation */}
                  <motion.div
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] z-10 opacity-70"
                    aria-hidden="true"
                  />
                </>
              ) : (
                <div className="text-center p-8 flex flex-col items-center">
                  <Camera size={80} className="text-gray-600 mb-6" aria-hidden="true" />
                  <p className="text-2xl text-gray-400 mb-8 font-medium">Vision system is in standby.</p>
                  <button 
                    onClick={onToggleStream}
                    className="px-10 py-5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-2xl rounded-2xl transition-all shadow-[0_0_30px_rgba(34,211,238,0.3)] focus:outline-none focus:ring-4 focus:ring-white"
                    aria-label="Initialize Vision System"
                  >
                    Start Vision Feed
                  </button>
                </div>
              )}
            </motion.div>

            {/* AI Narrative Section */}
            <AnimatePresence mode="wait">
              {aiResponse && (
                <motion.div
                  key={aiResponse}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-cyan-500/10 border-l-8 border-cyan-400 backdrop-blur-xl rounded-2xl p-6 shadow-xl"
                  role="status"
                  aria-live="assertive"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Volume2 className="text-cyan-400" size={28} aria-hidden="true" />
                    <h2 className="text-xl font-bold text-cyan-400 uppercase tracking-wider">AI Narrative</h2>
                  </div>
                  <p className="text-2xl md:text-3xl font-medium leading-relaxed text-white">
                    {aiResponse}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Primary Actions */}
          <div className="lg:col-span-5 flex flex-col gap-6" role="group" aria-label="Primary Actions">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
              
              <ActionCard 
                icon={<Eye size={48} />}
                label="Scene Check"
                onClick={onSceneCheck}
                disabled={loading}
                colorClass="text-yellow-400"
                bgClass="hover:bg-yellow-400/10 focus:ring-yellow-400/50"
              />
              
              <ActionCard 
                icon={<Type size={48} />}
                label="Read Text"
                onClick={onReadText}
                disabled={loading}
                colorClass="text-cyan-400"
                bgClass="hover:bg-cyan-400/10 focus:ring-cyan-400/50"
              />
              
              <ActionCard 
                icon={<DollarSign size={48} />}
                label="Identify Currency"
                onClick={onIdentifyCurrency}
                disabled={loading}
                colorClass="text-green-400"
                bgClass="hover:bg-green-400/10 focus:ring-green-400/50"
              />
              
              <ActionCard 
                icon={<Box size={48} />}
                label="Identify Item"
                onClick={onIdentifyItem}
                disabled={loading}
                colorClass="text-purple-400"
                bgClass="hover:bg-purple-400/10 focus:ring-purple-400/50"
              />

            </div>

            {/* SOS Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSosAlert}
              className="mt-4 flex-1 min-h-[120px] w-full flex flex-col items-center justify-center gap-4 bg-red-600/20 backdrop-blur-xl border-4 border-red-500/50 rounded-3xl text-red-500 hover:bg-red-600/30 hover:border-red-500 hover:text-red-400 transition-all shadow-[0_0_40px_rgba(239,68,68,0.2)] focus:outline-none focus:ring-8 focus:ring-red-500/50"
              aria-label="Emergency SOS Alert. Press to trigger immediate assistance."
            >
              <ShieldAlert size={64} aria-hidden="true" />
              <span className="text-3xl font-black uppercase tracking-widest">SOS Alert</span>
            </motion.button>
          </div>

        </div>
      </div>
    </div>
  );
}

function ActionCard({ icon, label, onClick, disabled, colorClass, bgClass }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`w-full min-h-[140px] flex items-center p-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 ${bgClass}`}
      aria-label={label}
    >
      <div className={`flex items-center justify-center w-20 h-20 rounded-2xl bg-white/5 mr-8 ${colorClass}`} aria-hidden="true">
        {icon}
      </div>
      <span className="text-3xl font-bold text-white text-left leading-tight flex-1">
        {label}
      </span>
    </motion.button>
  );
}
