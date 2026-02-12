import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Package, FilePlus, History, 
  Settings as SettingsIcon, Menu, X, User, HardHat, ShieldCheck
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import ProductManager from './components/ProductManager';
import BudgetGenerator from './components/BudgetGenerator';
import BudgetHistory from './components/BudgetHistory';
import SettingsView from './components/SettingsView';
import { Product, Budget, BusinessSettings, BudgetStatus } from './types';
import { storage } from './services/storage';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'generator' | 'history' | 'settings'>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [settings, setSettings] = useState<BusinessSettings>(storage.getSettings());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // ESTADO PARA EDICIÓN
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  useEffect(() => {
    setProducts(storage.getProducts());
    setBudgets(storage.getBudgets());
  }, []);

  const handleUpdateProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    storage.saveProducts(newProducts);
  };

  const handleSaveBudget = (newBudget: Budget) => {
    let updatedBudgets: Budget[];
    const exists = budgets.find(b => b.id === newBudget.id);

    if (exists) {
      updatedBudgets = budgets.map(b => b.id === newBudget.id ? newBudget : b);
    } else {
      updatedBudgets = [newBudget, ...budgets];
    }

    setBudgets(updatedBudgets);
    storage.saveBudgets(updatedBudgets);
    setEditingBudget(null);
    setActiveTab('history');
  };

  const handleUpdateBudgetStatus = (id: string, status: BudgetStatus) => {
    const updatedBudgets = budgets.map(b => b.id === id ? { ...b, status } : b);
    setBudgets(updatedBudgets);
    storage.saveBudgets(updatedBudgets);
  };

  const handleDeleteBudget = (id: string) => {
    const updatedBudgets = budgets.filter(b => b.id !== id);
    setBudgets(updatedBudgets);
    storage.saveBudgets(updatedBudgets);
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setActiveTab('generator');
  };

  const handleUpdateSettings = (newSettings: BusinessSettings) => {
    setSettings(newSettings);
    storage.saveSettings(newSettings);
  };

  const navItems = [
    { id: 'dashboard', label: 'Panel Control', icon: LayoutDashboard },
    { id: 'generator', label: 'Nueva Obra', icon: FilePlus },
    { id: 'products', label: 'Insumos / Precios', icon: Package },
    { id: 'history', label: 'Archivo Técnico', icon: History },
    { id: 'settings', label: 'Mi Constructora', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0f172a] text-white border-r border-slate-800 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col relative">
          <div className="p-8 border-b border-slate-800 bg-[#1e293b]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-500 rounded-xl flex items-center justify-center shadow-xl shadow-amber-500/20 flex-shrink-0 border-2 border-white/20">
                {settings.logoUrl ? <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" /> : <HardHat size={32} className="text-slate-900" />}
              </div>
              <div className="overflow-hidden">
                <h1 className="text-xl font-black text-white truncate uppercase tracking-tighter italic">{settings.name}</h1>
                <p className="text-[10px] text-amber-500 font-black uppercase tracking-[0.3em]">ENGINEERING PRO</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-10 space-y-3 overflow-y-auto">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id !== 'generator') setEditingBudget(null);
                  setActiveTab(item.id as any);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group relative overflow-hidden ${activeTab === item.id ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20 translate-x-2' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
              >
                <item.icon size={22} className={activeTab === item.id ? 'text-slate-950' : 'group-hover:text-amber-500 transition-colors'} />
                <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                {activeTab === item.id && <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/40"></div>}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-24 bg-white border-b-2 border-slate-200 flex items-center justify-between px-10 z-30 shadow-sm flex-shrink-0">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 text-slate-600 hover:bg-slate-100 rounded-xl"><Menu size={28} /></button>
          <div className="hidden sm:block">
             <div className="flex items-center gap-3">
               <div className="w-1.5 h-8 bg-amber-500 rounded-full"></div>
               <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">{navItems.find(n => n.id === activeTab)?.label}</h2>
             </div>
          </div>
          <div className="flex items-center gap-10">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Director de Obra</span>
              <span className="text-base font-black text-slate-900 uppercase italic tracking-tighter">{settings.ownerName || 'ADMIN'}</span>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-slate-200 shadow-lg flex items-center justify-center overflow-hidden">
               {settings.logoUrl ? <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" /> : <User className="text-slate-400" size={32} />}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-100/30">
          <div className="p-6 md:p-12 max-w-7xl mx-auto pb-32">
            {activeTab === 'dashboard' && (
              <Dashboard products={products} budgets={budgets} settings={settings} onNavigate={setActiveTab} onUpdateStatus={handleUpdateBudgetStatus} />
            )}
            {activeTab === 'products' && <ProductManager products={products} onUpdate={handleUpdateProducts} />}
            {activeTab === 'generator' && (
              <BudgetGenerator products={products} settings={settings} onSave={handleSaveBudget} initialData={editingBudget} />
            )}
            {activeTab === 'history' && (
              <BudgetHistory budgets={budgets} settings={settings} onDelete={handleDeleteBudget} onUpdateStatus={handleUpdateBudgetStatus} onEdit={handleEditBudget} />
            )}
            {activeTab === 'settings' && <SettingsView settings={settings} onUpdate={handleUpdateSettings} />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
