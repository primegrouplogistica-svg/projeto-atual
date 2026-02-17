
import React from 'react';

export const Logo: React.FC<{ size?: 'sm' | 'md' | 'lg', showText?: boolean }> = ({ size = 'md', showText = true }) => {
  const dimensions = {
    sm: { box: 'w-8 h-8', font: 'text-[10px]' },
    md: { box: 'w-12 h-12', font: 'text-sm' },
    lg: { box: 'w-28 h-28', font: 'text-xl' }
  };
  const { box, font } = dimensions[size];

  return (
    <div className="flex flex-col items-center gap-3">
      <img
        src="/logo.png"
        alt="PRIME GROUP"
        className={`${box} object-contain object-center select-none`}
      />
      {showText && (
        <h1 className={`${font} font-bold tracking-[0.2em] text-white uppercase`}>
          PRIME <span className="font-light opacity-90">GROUP</span>
        </h1>
      )}
    </div>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl ${className}`}>
    {children}
  </div>
);

export const BigButton: React.FC<{ 
  onClick: () => void; 
  children: React.ReactNode; 
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'indigo';
  icon?: React.ReactNode;
  disabled?: boolean;
  notificationCount?: number;
  type?: 'button' | 'submit';
}> = ({ onClick, children, variant = 'primary', icon, disabled, notificationCount, type = 'button' }) => {
  const styles = {
    primary: 'bg-blue-700 hover:bg-blue-600 border-blue-600 text-white shadow-blue-900/20',
    secondary: 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-100',
    danger: 'bg-red-700 hover:bg-red-600 border-red-600 text-white',
    success: 'bg-emerald-700 hover:bg-emerald-600 border-emerald-600 text-white',
    indigo: 'bg-indigo-700 hover:bg-indigo-600 border-indigo-600 text-white'
  };

  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`relative w-full p-6 text-sm font-black uppercase tracking-widest rounded-2xl border-b-4 flex flex-col items-center justify-center gap-4 transition-all active:translate-y-1 active:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]}`}
    >
      {notificationCount ? (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-6 h-6 flex items-center justify-center rounded-full border-2 border-slate-950 font-black animate-bounce">
          {notificationCount}
        </span>
      ) : null}
      {icon && <div className="text-white opacity-80">{icon}</div>}
      {children}
    </button>
  );
};

export const Input: React.FC<{
  label: string;
  type?: string;
  value: string | number;
  onChange: (val: any) => void;
  required?: boolean;
  placeholder?: string;
}> = ({ label, type = 'text', value, onChange, required, placeholder }) => (
  <div className="mb-4">
    <label className="block text-slate-400 text-[10px] font-black mb-1.5 uppercase tracking-wider">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      placeholder={placeholder}
      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-700 text-sm"
    />
  </div>
);

export const Select: React.FC<{
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (val: string) => void;
  required?: boolean;
}> = ({ label, value, options, onChange, required }) => (
  <div className="mb-4">
    <label className="block text-slate-400 text-[10px] font-black mb-1.5 uppercase tracking-wider">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all appearance-none text-sm"
    >
      <option value="">Selecione...</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; status?: any }> = ({ children, status }) => {
  const getColors = () => {
    const s = String(status || '').toLowerCase();
    switch(s) {
      case 'pendente': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'aprovado': 
      case 'feita': 
      case 'finalizada': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'rejeitado':
      case 'reprovada':
      case 'cancelada': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'assumida':
      case 'em_rota':
      case 'rodando':
      case 'vinculado': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'manutencao': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'parado': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      case 'em_execucao': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-widest ${getColors()}`}>
      {children}
    </span>
  );
};

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-slideDown">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-black uppercase tracking-widest text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
