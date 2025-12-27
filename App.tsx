
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TeachingMode, TeachingAction, ObservationLog, EngagementLevel, SessionData } from './types';
import { Icons, COLORS } from './constants';

// --- Sub-components ---

const ModeCard: React.FC<{
  mode: TeachingMode;
  isActive: boolean;
  duration: number;
  onClick: () => void;
}> = ({ mode, isActive, duration, onClick }) => {
  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m.toString().padStart(2, '0')}:${rs.toString().padStart(2, '0')}`;
  };

  return (
    <button
      onClick={onClick}
      className={`relative w-full p-6 rounded-2xl transition-all duration-300 border-2 overflow-hidden group ${
        isActive 
          ? 'border-amber-500 bg-amber-500/10 scale-[1.02] shadow-[0_0_20px_rgba(245,158,11,0.2)]' 
          : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
      }`}
    >
      <div className="flex justify-between items-center relative z-10">
        <span className={`text-xl font-bold ${isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
          {mode}
        </span>
        <span className={`font-mono text-2xl ${isActive ? 'text-amber-200' : 'text-slate-600'}`}>
          {formatDuration(duration)}
        </span>
      </div>
      {isActive && (
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%" className="animate-pulse">
            <pattern id="pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#f59e0b" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#pattern)" />
          </svg>
        </div>
      )}
    </button>
  );
};

const ActionButton: React.FC<{
  action: TeachingAction;
  count: number;
  onClick: () => void;
}> = ({ action, count, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-800 bg-slate-900/30 hover:bg-slate-800/50 hover:border-amber-500/50 transition-all active:scale-95 group"
  >
    <div className="text-3xl font-bold text-amber-500 mb-1 group-hover:scale-110 transition-transform">
      {count}
    </div>
    <div className="text-xs text-slate-400 uppercase tracking-widest">{action}</div>
  </button>
);

const ReportModal: React.FC<{
  data: SessionData;
  onClose: () => void;
}> = ({ data, onClose }) => {
  // Fix: Explicitly cast Object.values to number[] to ensure reduce works correctly with arithmetic '+'
  const totalSeconds = (Object.values(data.modeDurations) as number[]).reduce((a, b) => a + b, 0);
  
  const generateTextReport = () => {
    let report = `Chronos 數位觀課報告\n`;
    report += `========================\n`;
    report += `科目: ${data.subject}\n`;
    report += `開始時間: ${new Date(data.startTime!).toLocaleString()}\n`;
    report += `結束時間: ${new Date(data.endTime!).toLocaleString()}\n\n`;
    
    report += `[教學模式統計]\n`;
    // Fix: Explicitly cast secValue to number to allow arithmetic operations (/ and %)
    Object.entries(data.modeDurations).forEach(([mode, secValue]) => {
      const sec = secValue as number;
      const min = Math.floor(sec / 60);
      const s = sec % 60;
      report += `- ${mode}: ${min}分 ${s}秒\n`;
    });
    
    report += `\n[教學行為統計]\n`;
    const actionCounts: Record<string, number> = {};
    data.logs.filter(l => l.type === 'ACTION').forEach(l => {
      actionCounts[l.label] = (actionCounts[l.label] || 0) + 1;
    });
    Object.entries(TeachingAction).forEach(([_, val]) => {
      report += `- ${val}: ${actionCounts[val] || 0}次\n`;
    });

    report += `\n[詳細紀錄流]\n`;
    data.logs.forEach(l => {
      const m = Math.floor(l.relativeTime / 60);
      const s = l.relativeTime % 60;
      const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      report += `[${timeStr}] ${l.label}${l.value ? `: ${l.value}` : ''}\n`;
    });
    
    return report;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateTextReport());
    alert('已複製到剪貼簿');
  };

  const downloadTxt = () => {
    const content = generateTextReport();
    const blob = new Blob(["\ufeff", content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `觀課紀錄_${data.subject}_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass w-full max-w-2xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-amber-500">觀課總結報告</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-8">
          <section>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">模式時間佔比</h3>
            <div className="h-4 w-full bg-slate-800 rounded-full flex overflow-hidden">
              {/* Fix: Explicitly cast totalSeconds and secValue to numbers for width calculation */}
              {Object.entries(data.modeDurations).map(([mode, secValue], idx) => {
                const sec = secValue as number;
                const width = totalSeconds > 0 ? (sec / totalSeconds) * 100 : 0;
                const colors = ['bg-amber-500', 'bg-rust-800', 'bg-orange-600', 'bg-yellow-700'];
                if (width === 0) return null;
                return (
                  <div 
                    key={mode} 
                    style={{ width: `${width}%` }} 
                    className={`${colors[idx % colors.length]} h-full transition-all`}
                    title={`${mode}: ${Math.round(width)}%`}
                  />
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
               {/* Fix: Explicitly cast secValue to number for duration display logic */}
               {Object.entries(data.modeDurations).map(([mode, secValue]) => {
                 const sec = secValue as number;
                 return (
                 <div key={mode} className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-sm">{mode}</span>
                    <span className="text-amber-200 font-mono">{Math.floor(sec/60)}m {sec%60}s</span>
                 </div>
               );})}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">教學行為次數</h3>
            <div className="grid grid-cols-5 gap-2">
              {Object.values(TeachingAction).map(act => {
                const count = data.logs.filter(l => l.type === 'ACTION' && l.label === act).length;
                return (
                  <div key={act} className="text-center p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                    <div className="text-xl font-bold text-amber-400">{count}</div>
                    <div className="text-[10px] text-slate-500">{act}</div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/80 flex gap-4">
          <button onClick={copyToClipboard} className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all">
            <Icons.Copy className="w-5 h-5" /> 複製紀錄
          </button>
          <button onClick={downloadTxt} className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-600 hover:bg-amber-500 rounded-xl transition-all font-bold">
            <Icons.Download className="w-5 h-5" /> 下載 TXT
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [sessionActive, setSessionActive] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [relativeTime, setRelativeTime] = useState(0);
  const [subject, setSubject] = useState('國文');
  const [currentMode, setCurrentMode] = useState<TeachingMode>(TeachingMode.NONE);
  const [modeDurations, setModeDurations] = useState<Record<string, number>>({
    [TeachingMode.LECTURE]: 0,
    [TeachingMode.DISCUSSION]: 0,
    [TeachingMode.PRACTICE]: 0,
    [TeachingMode.DIGITAL]: 0,
  });
  const [logs, setLogs] = useState<ObservationLog[]>([]);
  const [engagement, setEngagement] = useState<EngagementLevel>('MID');
  const [noteInput, setNoteInput] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [remindEngagement, setRemindEngagement] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const timerRef = useRef<number | null>(null);
  const inactivityRef = useRef<number | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Scrolling logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Activity timer
  useEffect(() => {
    if (sessionActive) {
      const check = setInterval(() => {
        const diff = Date.now() - lastActivity;
        if (diff > 300000) { // 5 minutes
          setRemindEngagement(true);
        }
      }, 10000);
      return () => clearInterval(check);
    }
  }, [sessionActive, lastActivity]);

  const handleAction = useCallback((type: 'MODE_CHANGE' | 'ACTION' | 'NOTE' | 'ENGAGEMENT', label: string, value?: string | number) => {
    if (!sessionActive) return;
    setLastActivity(Date.now());
    setRemindEngagement(false);
    
    const newLog: ObservationLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      relativeTime: relativeTime,
      type,
      label,
      value
    };
    setLogs(prev => [...prev, newLog]);
  }, [sessionActive, relativeTime]);

  const toggleSession = () => {
    if (!sessionActive) {
      setStartTime(Date.now());
      setRelativeTime(0);
      setLogs([]);
      setModeDurations({
        [TeachingMode.LECTURE]: 0,
        [TeachingMode.DISCUSSION]: 0,
        [TeachingMode.PRACTICE]: 0,
        [TeachingMode.DIGITAL]: 0,
      });
      setSessionActive(true);
      setLastActivity(Date.now());
    } else {
      setSessionActive(false);
      setShowReport(true);
    }
  };

  useEffect(() => {
    if (sessionActive) {
      timerRef.current = window.setInterval(() => {
        setRelativeTime(prev => prev + 1);
        if (currentMode !== TeachingMode.NONE) {
          setModeDurations(prev => ({
            ...prev,
            [currentMode]: prev[currentMode] + 1
          }));
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [sessionActive, currentMode]);

  const handleModeChange = (mode: TeachingMode) => {
    if (!sessionActive) return;
    if (currentMode === mode) {
      setCurrentMode(TeachingMode.NONE);
      handleAction('MODE_CHANGE', '暫停模式', mode);
    } else {
      setCurrentMode(mode);
      handleAction('MODE_CHANGE', '進入模式', mode);
    }
  };

  const sendNote = () => {
    if (noteInput.trim()) {
      handleAction('NOTE', '質性紀錄', noteInput);
      setNoteInput('');
    }
  };

  return (
    <div className="flex flex-col h-screen text-slate-200 overflow-hidden">
      {/* Header */}
      <header className="glass h-20 px-6 flex items-center justify-between z-40">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-amber-500 tracking-tighter">CHRONOS</h1>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-[0.2em]">Observation Hub</span>
          </div>
          
          <div className="hidden md:flex items-center bg-slate-900/50 border border-slate-800 rounded-full px-4 py-1.5 gap-2">
            <Icons.Subject className="w-4 h-4 text-amber-400" />
            <select 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)}
              disabled={sessionActive}
              className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer outline-none"
            >
              <option className="bg-slate-950">國文</option>
              <option className="bg-slate-950">英文</option>
              <option className="bg-slate-950">數學</option>
              <option className="bg-slate-950">自然</option>
              <option className="bg-slate-950">社會</option>
              <option className="bg-slate-950">藝術</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end">
            <div className="text-2xl font-mono font-bold text-slate-300">
              {currentTime.toLocaleTimeString('zh-TW', { hour12: false })}
            </div>
            {sessionActive && (
              <div className="text-xs font-mono text-amber-500 animate-pulse">
                REC • {Math.floor(relativeTime/60).toString().padStart(2,'0')}:{(relativeTime%60).toString().padStart(2,'0')}
              </div>
            )}
          </div>

          <button 
            onClick={toggleSession}
            className="transition-transform active:scale-90"
          >
            {sessionActive ? <Icons.Stop /> : <Icons.Start />}
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Left: Modes */}
        <section className="lg:col-span-4 p-6 overflow-y-auto scrollbar-hide space-y-4 border-r border-slate-900">
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-[0.3em] mb-4">教學模式 (States)</h2>
          {Object.values(TeachingMode).filter(m => m !== TeachingMode.NONE).map(mode => (
            <ModeCard
              key={mode}
              mode={mode}
              isActive={currentMode === mode}
              duration={modeDurations[mode]}
              onClick={() => handleModeChange(mode)}
            />
          ))}
          
          <div className="mt-8 p-6 rounded-2xl border border-slate-800 bg-slate-900/20">
             <div className="text-xs font-bold text-slate-500 uppercase mb-4">實時觀課日誌</div>
             <div className="space-y-3 h-[200px] overflow-y-auto scrollbar-hide">
                {logs.length === 0 && <div className="text-slate-600 text-sm italic">等待觀課開始...</div>}
                {logs.slice().reverse().map(log => (
                  <div key={log.id} className="flex gap-3 text-sm animate-in fade-in slide-in-from-left-2 duration-300">
                    <span className="text-amber-600 font-mono text-[10px] mt-1">[{Math.floor(log.relativeTime/60).toString().padStart(2,'0')}:{(log.relativeTime%60).toString().padStart(2,'0')}]</span>
                    <span className="text-slate-400">
                      <strong className="text-slate-200">{log.label}</strong>
                      {log.value && <span className="text-slate-500 ml-1">- {log.value}</span>}
                    </span>
                  </div>
                ))}
                <div ref={logEndRef} />
             </div>
          </div>
        </section>

        {/* Right: Actions */}
        <section className="lg:col-span-8 p-6 flex flex-col bg-slate-950/50">
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-[0.3em] mb-6">教學行為 (Actions)</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {Object.values(TeachingAction).map(action => {
              const count = logs.filter(l => l.type === 'ACTION' && l.label === action).length;
              return (
                <ActionButton 
                  key={action}
                  action={action}
                  count={count}
                  onClick={() => handleAction('ACTION', action)}
                />
              );
            })}
          </div>

          <div className="mt-auto pt-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Visualizer Placeholder / Stat card */}
                <div className="glass p-6 rounded-3xl border border-amber-500/10 flex flex-col justify-center">
                  <div className="text-sm text-slate-500 mb-2">當前課程效率</div>
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-black text-amber-500">84%</span>
                    <span className="text-emerald-500 text-sm mb-2 font-bold">↑ 2.4%</span>
                  </div>
                  <div className="mt-4 flex gap-1 h-1">
                     {[...Array(20)].map((_, i) => (
                       <div key={i} className={`flex-1 rounded-full ${i < 15 ? 'bg-amber-500' : 'bg-slate-800'}`} />
                     ))}
                  </div>
                </div>

                <div className="glass p-6 rounded-3xl border border-slate-800/50 flex flex-col justify-center">
                   <div className="text-sm text-slate-500 mb-2">行為頻次分布</div>
                   <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin-slow" />
                      <div>
                        <div className="text-slate-200 font-bold">互動頻率高</div>
                        <div className="text-xs text-slate-500">當前平均每分鐘 3.2 次記錄</div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={`glass transition-all duration-500 border-t ${remindEngagement ? 'border-amber-500 shadow-[0_-10px_30px_rgba(245,158,11,0.1)]' : 'border-slate-900'} h-24 px-6 flex items-center gap-6`}>
        <div className="flex-1 flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase mb-2">專注度 (Engagement)</span>
            <div className="flex bg-slate-900 p-1 rounded-full border border-slate-800 gap-1">
              {[
                { label: '低', val: 'LOW', color: 'bg-rose-500' },
                { label: '中', val: 'MID', color: 'bg-amber-500' },
                { label: '高', val: 'HIGH', color: 'bg-emerald-500' }
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => {
                    setEngagement(opt.val as EngagementLevel);
                    handleAction('ENGAGEMENT', '學生專注度', opt.label);
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    engagement === opt.val 
                      ? `${opt.color} text-white shadow-lg` 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex items-center bg-slate-900/80 rounded-2xl border border-slate-800 px-4 group focus-within:border-amber-500/50 transition-colors">
            <input 
              type="text" 
              placeholder="輸入課堂質性筆記..." 
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendNote()}
              className="flex-1 bg-transparent border-none py-3 text-sm focus:ring-0 outline-none"
            />
            <button 
              onClick={sendNote}
              className="ml-2 p-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-all active:scale-90"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      </footer>

      {showReport && (
        <ReportModal 
          data={{
            startTime,
            endTime: Date.now(),
            subject,
            logs,
            modeDurations
          }}
          onClose={() => setShowReport(false)}
        />
      )}

      {/* Background decoration elements (Klimt style) */}
      <div className="fixed top-20 right-10 w-64 h-64 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-20 left-10 w-96 h-96 bg-rust-900/5 rounded-full blur-[120px] pointer-events-none" />
    </div>
  );
}
