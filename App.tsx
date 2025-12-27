
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
  const totalSeconds = (Object.values(data.modeDurations) as number[]).reduce((a, b) => a + b, 0);
  
  const generateTextReport = () => {
    let report = `Chronos 數位觀課報告\n`;
    report += `==========================================\n`;
    report += `科目: ${data.subject}\n`;
    report += `開始時間: ${new Date(data.startTime!).toLocaleString()}\n`;
    report += `結束時間: ${new Date(data.endTime!).toLocaleString()}\n`;
    report += `總時長: ${Math.floor(totalSeconds / 60)}分 ${totalSeconds % 60}秒\n`;
    report += `==========================================\n\n`;
    
    report += `[教學模式統計]\n`;
    Object.entries(data.modeDurations).forEach(([mode, secValue]) => {
      const sec = secValue as number;
      const min = Math.floor(sec / 60);
      const s = sec % 60;
      const percent = totalSeconds > 0 ? ((sec / totalSeconds) * 100).toFixed(1) : "0";
      report += `- ${mode.padEnd(6, ' ')}: ${min.toString().padStart(2, '0')}分 ${s.toString().padStart(2, '0')}秒 (${percent}%)\n`;
    });
    
    report += `\n[教學行為統計]\n`;
    const actionCounts: Record<string, number> = {};
    data.logs.filter(l => l.type === 'ACTION').forEach(l => {
      actionCounts[l.label] = (actionCounts[l.label] || 0) + 1;
    });
    Object.entries(TeachingAction).forEach(([_, val]) => {
      report += `- ${val.padEnd(6, ' ')}: ${actionCounts[val] || 0}次\n`;
    });

    report += `\n[完整課堂日誌紀錄 (時間碼格式: 相對時間 | 絕對時間)]\n`;
    report += `------------------------------------------\n`;
    data.logs.forEach(l => {
      const m = Math.floor(l.relativeTime / 60);
      const s = l.relativeTime % 60;
      const relativeTimeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      const absoluteTimeStr = new Date(l.timestamp).toLocaleTimeString('zh-TW', { hour12: false });
      
      let entryType = "";
      switch(l.type) {
        case 'MODE_CHANGE': entryType = "【模式】"; break;
        case 'ACTION': entryType = "【行為】"; break;
        case 'NOTE': entryType = "【筆記】"; break;
        case 'ENGAGEMENT': entryType = "【專注】"; break;
      }

      report += `[${relativeTimeStr} | ${absoluteTimeStr}] ${entryType} ${l.label}${l.value ? `: ${l.value}` : ''}\n`;
    });
    report += `------------------------------------------\n`;
    report += `\n報告生成日期: ${new Date().toLocaleString()}\n`;
    
    return report;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateTextReport());
    alert('已複製到剪貼簿，包含完整時間碼紀錄。');
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
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
          <div>
            <h2 className="text-2xl font-bold text-amber-500">觀課總結報告</h2>
            <p className="text-xs text-slate-500 mt-1">科目：{data.subject} | 紀錄條目：{data.logs.length} 筆</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-8">
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              教學模式佔比
            </h3>
            <div className="h-6 w-full bg-slate-800 rounded-full flex overflow-hidden border border-slate-700">
              {Object.entries(data.modeDurations).map(([mode, secValue], idx) => {
                const sec = secValue as number;
                const width = totalSeconds > 0 ? (sec / totalSeconds) * 100 : 0;
                const colors = ['bg-amber-500', 'bg-rust-700', 'bg-orange-600', 'bg-yellow-700'];
                if (width === 0) return null;
                return (
                  <div 
                    key={mode} 
                    style={{ width: `${width}%` }} 
                    className={`${colors[idx % colors.length]} h-full transition-all flex items-center justify-center text-[10px] font-bold text-white whitespace-nowrap overflow-hidden`}
                    title={`${mode}: ${Math.round(width)}%`}
                  >
                    {width > 10 ? mode : ""}
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
               {Object.entries(data.modeDurations).map(([mode, secValue]) => {
                 const sec = secValue as number;
                 return (
                 <div key={mode} className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-xs font-medium">{mode}</span>
                    <span className="text-amber-200 font-mono text-sm">{Math.floor(sec/60)}m {sec%60}s</span>
                 </div>
               );})}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
               詳細日誌與時間碼
            </h3>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
               <div className="max-h-[300px] overflow-y-auto scrollbar-hide">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-800/50 sticky top-0 text-[10px] uppercase tracking-tighter text-slate-500">
                      <tr>
                        <th className="px-4 py-2 border-b border-slate-700">相對時間</th>
                        <th className="px-4 py-2 border-b border-slate-700">紀錄內容</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.logs.map((log, idx) => {
                        const m = Math.floor(log.relativeTime / 60);
                        const s = log.relativeTime % 60;
                        const tStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                        return (
                          <tr key={log.id} className={`hover:bg-slate-800/30 transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-900/40'}`}>
                            <td className="px-4 py-3 font-mono text-amber-500 text-xs border-b border-slate-800/50">{tStr}</td>
                            <td className="px-4 py-3 text-slate-300 border-b border-slate-800/50">
                              <span className="font-bold text-slate-100">{log.label}</span>
                              {log.value && <span className="text-slate-500 text-xs ml-2">({log.value})</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
               </div>
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/80 flex gap-4">
          <button onClick={copyToClipboard} className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all font-medium text-slate-300">
            <Icons.Copy className="w-5 h-5" /> 複製紀錄 (帶時間碼)
          </button>
          <button onClick={downloadTxt} className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-600 hover:bg-amber-500 rounded-xl transition-all font-bold text-white shadow-lg shadow-amber-600/20">
            <Icons.Download className="w-5 h-5" /> 下載 TXT 報告
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
      handleAction('NOTE', '質性筆記', noteInput);
      setNoteInput('');
    }
  };

  return (
    <div className="flex flex-col h-screen text-slate-200 overflow-hidden bg-slate-950">
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
              className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer outline-none text-slate-300"
            >
              <option className="bg-slate-950" value="國文">國文</option>
              <option className="bg-slate-950" value="英文">英文</option>
              <option className="bg-slate-950" value="數學">數學</option>
              <option className="bg-slate-950" value="自然">自然</option>
              <option className="bg-slate-950" value="社會">社會</option>
              <option className="bg-slate-950" value="藝術">藝術</option>
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
            className="transition-transform active:scale-90 hover:opacity-90"
          >
            {sessionActive ? <Icons.Stop /> : <Icons.Start />}
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Left: Modes */}
        <section className="lg:col-span-4 p-6 overflow-y-auto scrollbar-hide space-y-4 border-r border-slate-900">
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            教學模式 (States)
          </h2>
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
             <div className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest">實時觀課日誌</div>
             <div className="space-y-3 h-[200px] overflow-y-auto scrollbar-hide">
                {logs.length === 0 && <div className="text-slate-600 text-sm italic">等待觀課開始...</div>}
                {logs.slice().reverse().map(log => (
                  <div key={log.id} className="flex gap-3 text-sm animate-in fade-in slide-in-from-left-2 duration-300">
                    <span className="text-amber-600 font-mono text-[10px] mt-1 shrink-0">[{Math.floor(log.relativeTime/60).toString().padStart(2,'0')}:{(log.relativeTime%60).toString().padStart(2,'0')}]</span>
                    <span className="text-slate-400">
                      <strong className="text-slate-200">{log.label}</strong>
                      {log.value && <span className="text-slate-500 ml-1 text-xs">- {log.value}</span>}
                    </span>
                  </div>
                ))}
                <div ref={logEndRef} />
             </div>
          </div>
        </section>

        {/* Right: Actions */}
        <section className="lg:col-span-8 p-6 flex flex-col bg-slate-950/50">
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            教學行為 (Actions)
          </h2>
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
                  <div className="text-sm text-slate-500 mb-2">當前課程效率評估</div>
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-black text-amber-500">84%</span>
                    <span className="text-emerald-500 text-sm mb-2 font-bold flex items-center gap-1">
                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m5 12 7-7 7 7M12 19V5"/></svg>
                       2.4%
                    </span>
                  </div>
                  <div className="mt-4 flex gap-1 h-1">
                     {[...Array(20)].map((_, i) => (
                       <div key={i} className={`flex-1 rounded-full ${i < 15 ? 'bg-amber-500' : 'bg-slate-800'}`} />
                     ))}
                  </div>
                </div>

                <div className="glass p-6 rounded-3xl border border-slate-800/50 flex flex-col justify-center">
                   <div className="text-sm text-slate-500 mb-2">教學行為分佈趨勢</div>
                   <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-full border-4 border-amber-500/10 border-t-amber-500 animate-spin-slow">
                         <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-1 h-1 bg-amber-500 rounded-full"></div>
                         </div>
                      </div>
                      <div>
                        <div className="text-slate-200 font-bold">互動頻率活躍</div>
                        <div className="text-xs text-slate-500">平均每分鐘 3.2 次有效紀錄</div>
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
          <div className="flex flex-col shrink-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">學生專注度 (Engagement)</span>
            <div className="flex bg-slate-950 p-1 rounded-full border border-slate-800 gap-1">
              {[
                { label: '低', val: 'LOW', color: 'bg-rose-600' },
                { label: '中', val: 'MID', color: 'bg-amber-600' },
                { label: '高', val: 'HIGH', color: 'bg-emerald-600' }
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => {
                    setEngagement(opt.val as EngagementLevel);
                    handleAction('ENGAGEMENT', '學生專注度', opt.label);
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    engagement === opt.val 
                      ? `${opt.color} text-white shadow-[0_0_10px_rgba(0,0,0,0.5)] scale-105` 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex items-center bg-slate-900/80 rounded-2xl border border-slate-800 px-4 group focus-within:border-amber-500/50 transition-all">
            <input 
              type="text" 
              placeholder="輸入質性觀察筆記... (按 Enter 發送)" 
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendNote()}
              className="flex-1 bg-transparent border-none py-3 text-sm focus:ring-0 outline-none text-slate-300"
            />
            <button 
              onClick={sendNote}
              className="ml-2 p-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-all active:scale-90 shadow-md"
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

      {/* Background decoration elements */}
      <div className="fixed top-20 right-10 w-64 h-64 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-20 left-10 w-96 h-96 bg-rust-900/5 rounded-full blur-[120px] pointer-events-none" />
    </div>
  );
}
