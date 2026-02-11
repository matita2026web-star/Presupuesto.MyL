
import React from 'react';
import { 
  FileText, CheckCircle, Hammer, Clock, Plus, 
  XCircle, CheckSquare, HardHat, TrendingUp, ChevronRight
} from 'lucide-react';
import { Product, Budget, BusinessSettings, BudgetStatus } from '../types';

interface DashboardProps {
  products: Product[];
  budgets: Budget[];
  settings: BusinessSettings;
  onNavigate: (tab: any) => void;
  onUpdateStatus: (id: string, status: BudgetStatus) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ products, budgets, settings, onNavigate, onUpdateStatus }) => {
  const totalRevenue = budgets.filter(b => b.status === 'aceptado').reduce((acc, curr) => acc + curr.total, 0);
  const pendingBudgets = budgets.filter(b => b.status === 'pendiente');
  
  return (
    <div className="space-y-6 md:space-y-10 animate-slide-up">
      {/* Header adaptable */}
      <div className="flex flex-col gap-4 border-b-4 border-slate-900 pb-6 md:pb-10">
        <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
          DASHBOARD <span className="text-amber-500">OBRA</span>
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] md:text-xs italic">
            Central de Operaciones - {settings.name}
          </p>
          <button 
            onClick={() => onNavigate('generator')}
            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-slate-950 text-white px-8 py-4 rounded-xl font-black shadow-lg shadow-slate-400 uppercase italic text-sm active:scale-95 transition-transform"
          >
            <Plus size={20} className="text-amber-500" />
            NUEVA COTIZACIÓN
          </button>
        </div>
      </div>

      {/* Stats en Grid adaptable (2 columnas en móvil) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard label="Aprobado" value={totalRevenue} isCurrency={true} settings={settings} color="bg-slate-900" icon={<TrendingUp size={20} className="text-amber-500"/>} />
        <StatCard label="Pendientes" value={pendingBudgets.length} color="bg-amber-500" icon={<Clock size={20} className="text-slate-900"/>} />
        <StatCard label="Total Hist." value={budgets.length} color="bg-slate-800" icon={<FileText size={20} className="text-white"/>} />
        <StatCard label="Catálogo" value={products.length} color="bg-white" border={true} icon={<Hammer size={20} className="text-amber-500"/>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de propuestas pendientes optimizada para móvil */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-6 bg-amber-500 rounded-full"></div>
            <h3 className="font-black text-slate-900 uppercase italic tracking-widest text-sm">Propuestas por Firmar</h3>
          </div>
          
          <div className="space-y-3">
            {pendingBudgets.length > 0 ? (
              pendingBudgets.map((b) => (
                <div key={b.id} className="bg-white p-4 md:p-6 rounded-2xl border-2 border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-900 text-xl border-b-2 border-amber-500 uppercase italic">
                      {b.client.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 uppercase italic leading-tight text-base">{b.client.name}</h4>
                      <p className="font-mono text-xs text-amber-600 font-bold mt-1 uppercase">{settings.currency}{b.total.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onUpdateStatus(b.id, 'rechazado')} className="flex-1 md:flex-none py-3 px-4 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase italic active:bg-red-50 active:text-red-500 transition-colors">Rechazar</button>
                    <button onClick={() => onUpdateStatus(b.id, 'aceptado')} className="flex-1 md:flex-none py-3 px-4 bg-slate-900 text-amber-500 rounded-xl font-black text-[10px] uppercase italic shadow-lg active:scale-95 transition-transform">Aceptar Obra</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-slate-100/50 rounded-2xl p-10 text-center border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-black uppercase italic text-xs tracking-widest">Sin acciones pendientes</p>
              </div>
            )}
          </div>
        </div>

        {/* Historial rápido */}
        <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <HardHat size={120} />
          </div>
          <h3 className="font-black uppercase italic tracking-tighter text-amber-500 mb-6 flex justify-between items-center">
            Bitácora Técnica
            <ChevronRight size={16} />
          </h3>
          <div className="space-y-4 relative z-10">
            {budgets.slice(0, 4).map(b => (
              <div key={b.id} className="flex justify-between items-center border-b border-white/5 pb-3 last:border-0">
                <div className="max-w-[60%]">
                  <p className="text-sm font-black uppercase italic truncate">{b.client.name}</p>
                  <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">{b.status}</p>
                </div>
                <p className="font-mono text-xs font-black text-white">{settings.currency}{b.total.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color, isCurrency, settings, border }: any) => (
  <div className={`${color} p-4 md:p-6 rounded-2xl md:rounded-[2rem] shadow-lg flex flex-col justify-between ${border ? 'border-2 border-slate-200' : ''}`}>
    <div className="mb-2 opacity-80">{icon}</div>
    <div>
      <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1 ${color === 'bg-white' ? 'text-slate-400' : 'text-white/60'}`}>{label}</p>
      <h4 className={`text-sm md:text-2xl font-black italic tracking-tighter truncate ${color === 'bg-white' ? 'text-slate-950' : (color === 'bg-amber-500' ? 'text-slate-950' : 'text-white')}`}>
        {isCurrency ? `${settings.currency}${value.toLocaleString()}` : value}
      </h4>
    </div>
  </div>
);

export default Dashboard;
