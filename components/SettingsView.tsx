
import React, { useState, useRef } from 'react';
import { 
  Save, Building2, User, Phone, MapPin, 
  DollarSign, Image, HardHat, Info, Upload, Trash2
} from 'lucide-react';
import { BusinessSettings } from '../types';

interface SettingsProps {
  settings: BusinessSettings;
  onUpdate: (settings: BusinessSettings) => void;
}

const SettingsView: React.FC<SettingsProps> = ({ settings, onUpdate }) => {
  const [form, setForm] = useState<BusinessSettings>(settings);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setForm({ ...form, logoUrl: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="animate-slide-up max-w-5xl mx-auto pb-32">
      <div className="mb-10 flex items-center justify-between border-b-4 border-slate-900 pb-8">
        <div>
           <h2 className="text-4xl md:text-6xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">MI <span className="text-amber-500">ESTUDIO</span></h2>
           <p className="text-slate-500 font-bold text-[10px] md:text-sm uppercase tracking-[0.4em] italic mt-2">Perfil de Ingeniería y Configuración</p>
        </div>
        <div className="hidden sm:flex w-24 h-24 bg-slate-950 rounded-[2.5rem] items-center justify-center text-amber-500 shadow-2xl rotate-6 border-b-8 border-amber-600">
           <HardHat size={48} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* LOGO SECTION */}
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-200 shadow-xl space-y-8">
          <h3 className="font-black text-xl flex items-center gap-4 text-slate-900 uppercase italic tracking-tighter">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-lg">
               <Image size={20} />
            </div>
            Identidad Visual
          </h3>
          
          <div className="flex flex-col items-center gap-6">
            <div className="w-48 h-48 rounded-[2rem] bg-slate-50 border-4 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group shadow-inner">
              {form.logoUrl ? (
                <>
                  <img src={form.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setForm({...form, logoUrl: ''})} className="absolute inset-0 bg-red-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-black uppercase text-[10px]">ELIMINAR</button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-300">
                  <Image size={40} className="opacity-20" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Sin Logo</span>
                </div>
              )}
            </div>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full bg-slate-950 text-white py-4 rounded-xl font-black text-xs uppercase italic tracking-tighter border-b-4 border-amber-600 shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-3">
              <Upload size={16} className="text-amber-500" />
              SUBIR LOGOTIPO
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Razón Social / Nombre Comercial</label>
              <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full bg-slate-50 px-4 py-4 rounded-xl border-2 border-slate-100 focus:border-amber-500 outline-none font-black uppercase text-base italic transition-all shadow-inner" />
            </div>
          </div>
        </div>

        {/* FINANCIALS & CONTACT */}
        <div className="bg-slate-950 p-8 rounded-[2.5rem] shadow-2xl text-white border-t-[10px] border-amber-500 space-y-8">
          <h3 className="font-black text-xl flex items-center gap-4 text-amber-500 uppercase italic tracking-tighter">
            <DollarSign size={20} />
            Datos Técnicos
          </h3>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Ingeniero Responsable</label>
              <input type="text" value={form.ownerName} onChange={(e) => setForm({...form, ownerName: e.target.value})} className="w-full bg-slate-900 px-4 py-4 rounded-xl border-2 border-slate-800 focus:border-amber-500 outline-none font-bold text-white text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Símbolo Moneda</label>
                <input type="text" value={form.currency} onChange={(e) => setForm({...form, currency: e.target.value})} className="w-full bg-slate-900 px-4 py-4 rounded-xl border-2 border-slate-800 focus:border-amber-500 outline-none font-black text-center text-amber-500 text-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">IVA / Gastos %</label>
                <input type="number" value={form.defaultTax} onChange={(e) => setForm({...form, defaultTax: parseFloat(e.target.value) || 0})} className="w-full bg-slate-900 px-4 py-4 rounded-xl border-2 border-slate-800 focus:border-amber-500 outline-none font-black text-center text-amber-500 text-xl" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Teléfono Obra</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="w-full bg-slate-900 px-4 py-4 rounded-xl border-2 border-slate-800 focus:border-amber-500 outline-none font-bold text-white text-sm" />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Domicilio Fiscal</label>
              <input type="text" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} className="w-full bg-slate-900 px-4 py-4 rounded-xl border-2 border-slate-800 focus:border-amber-500 outline-none font-bold text-white text-sm" />
            </div>
          </div>
        </div>

        {/* SAVE BAR */}
        <div className="md:col-span-2 flex flex-col sm:flex-row items-center justify-between bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-xl gap-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase italic tracking-widest max-w-sm text-center sm:text-left">
            La información aquí cargada aparecerá como membrete oficial en todas las exportaciones PDF y comunicaciones de obra.
          </p>
          <button type="submit" className="w-full sm:w-auto bg-slate-950 text-white font-black px-12 py-5 rounded-2xl shadow-xl shadow-slate-200 flex items-center justify-center gap-3 uppercase italic tracking-tighter text-sm border-b-4 border-amber-500 active:scale-95 transition-transform">
            <Save size={20} className="text-amber-500" />
            {saved ? 'ACTUALIZADO ✓' : 'GUARDAR AJUSTES'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsView;
