
import React from 'react';

export const COLORS = {
  amber: '#f59e0b',
  rust: '#991b1b',
  slate950: '#020617',
  emerald: '#10b981',
  rose: '#f43f5e'
};

export const Icons = {
  Start: () => (
    <svg width="60" height="60" viewBox="0 0 100 100" className="relative">
      <defs>
        <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#fbbf24', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#d97706', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <circle 
        cx="50" cy="50" r="45" 
        fill="none" 
        stroke="url(#amberGrad)" 
        strokeWidth="2" 
        strokeDasharray="6 4"
        className="animate-spin-slow"
      />
      <circle 
        cx="50" cy="50" r="38" 
        fill="none" 
        stroke="rgba(245, 158, 11, 0.2)" 
        strokeWidth="1" 
      />
      <path 
        d="M40 35 L70 50 L40 65 Z" 
        fill="url(#amberGrad)" 
        filter="drop-shadow(0 0 5px rgba(245, 158, 11, 0.5))"
      />
    </svg>
  ),
  Stop: () => (
    <svg width="60" height="60" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="rustGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#ef4444', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#991b1b', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <rect 
        x="10" y="10" width="80" height="80" rx="4"
        fill="none" 
        stroke="rgba(153, 27, 27, 0.3)" 
        strokeWidth="1"
      />
      <rect 
        x="30" y="30" width="40" height="40" rx="4"
        fill="url(#rustGrad)" 
        filter="drop-shadow(0 0 8px rgba(153, 27, 27, 0.6))"
      />
      <path d="M10 10 L90 10 L90 90 L10 90 Z" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
    </svg>
  ),
  Subject: (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-0.5-5Z"/><path d="M6.5 17.5H20"/></svg>
  ),
  Check: (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  ),
  Download: (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
  ),
  Copy: (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
  )
};
