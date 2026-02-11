
import React, { useState } from 'react';
import { 
  Plus, Search, Trash2, Edit3, Save, X, 
  Hammer, HardHat, Package, Construction
} from 'lucide-react';
import { Product, UnitType } from '../types';

interface ProductManagerProps {
  products: Product[];
  onUpdate: (products: Product[]) => void;
}

const ProductManager: React.FC<ProductManagerProps> = ({ products, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<Product>>({
    name: '',
    price: 0,
    unit: UnitType.UNIDAD,
    category: 'General'
  });

  const handleSave = () => {
    if (!form.name || form.price === undefined) return;
    
    if (editingId) {
      onUpdate(products.map(p => p.id === editingId ? { ...p, ...form } as Product : p));
    } else {
      const newProduct: Product = {
        id: Date.now().toString(),
        name: form.name,
        price: form.price,
        unit: form.unit as UnitType,
        category: form.category || 'General'
      };
      onUpdate([...products, newProduct]);
    }
    resetForm();
  };

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setForm(p);
    setIsAdding(true);
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setForm({ name: '', price: 0, unit: UnitType.UNIDAD, category: 'General' });
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 border-b-4 border-slate-900 pb-12">
        <div className="space-y-2">
          <h2 className="text-6xl font-black text-slate-900 uppercase italic tracking-tighter">BASE DE <span className="text-amber-500">INSUMOS</span></h2>
          <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-xs italic">Catálogo Maestro de Precios y Rendimientos Técnicos</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-slate-950 hover:bg-slate-800 text-white px-12 py-6 rounded-[2.5rem] font-black shadow-2xl shadow-slate-950/20 transition-all flex items-center justify-center gap-5 uppercase italic tracking-tighter text-xl border-b-8 border-amber-500 active:scale-95"
        >
          <Plus size={28} className="text-amber-500" />
          NUEVO REGISTRO
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl">
          <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border-x-[12px] border-slate-950 relative">
            <div className="absolute top-0 left-0 w-full h-4 bg-amber-500"></div>
            <div className="p-14 space-y-12">
              <div className="flex justify-between items-center">
                <h3 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{editingId ? 'Editar Ítem' : 'Añadir Insumo de Obra'}</h3>
                <button onClick={resetForm} className="p-5 bg-slate-100 hover:bg-slate-200 rounded-3xl transition-all shadow-md"><X size={32}/></button>
              </div>

              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] ml-4">Descripción Técnica del Rubro</label>
                  <input 
                    type="text" 
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                    placeholder="Ej: Colocación de Porcelanato"
                    className="w-full bg-slate-50 px-10 py-8 rounded-3xl border-2 border-slate-100 focus:border-amber-500 outline-none font-black uppercase italic text-2xl transition-all shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] ml-4">Rubro / Categoría</label>
                    <input 
                      type="text" 
                      value={form.category}
                      onChange={(e) => setForm({...form, category: e.target.value})}
                      placeholder="Mano de Obra, Gruesa..."
                      className="w-full bg-slate-50 px-10 py-8 rounded-3xl border-2 border-slate-100 focus:border-amber-500 outline-none font-bold uppercase text-xl transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] ml-4">Unidad Técnico/Comercial</label>
                    <select 
                      value={form.unit}
                      onChange={(e) => setForm({...form, unit: e.target.value as UnitType})}
                      className="w-full bg-slate-50 px-10 py-8 rounded-3xl border-2 border-slate-100 focus:border-amber-500 outline-none font-black uppercase italic text-xl transition-all cursor-pointer appearance-none shadow-inner"
                    >
                      {Object.values(UnitType).map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] ml-4">Costo Unitario Vigente</label>
                  <input 
                    type="number" 
                    value={form.price}
                    onChange={(e) => setForm({...form, price: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-950 text-amber-500 px-12 py-10 rounded-[2.5rem] outline-none font-black text-6xl italic text-center transition-all shadow-2xl border-b-8 border-amber-600"
                  />
                </div>
              </div>

              <button 
                onClick={handleSave}
                className="w-full bg-slate-950 hover:bg-slate-800 text-white font-black py-10 rounded-[3rem] shadow-2xl transition-all flex items-center justify-center gap-6 uppercase italic tracking-tighter text-2xl border-b-8 border-amber-500"
              >
                <Save size={32} className="text-amber-500" />
                CONFIRMAR REGISTRO
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="bg-white rounded-[4rem] border-4 border-slate-950 shadow-2xl overflow-hidden">
        <div className="p-12 border-b-4 border-slate-100 bg-slate-50/50 flex items-center gap-10">
          <div className="p-5 bg-white rounded-3xl shadow-xl border-2 border-slate-100">
             <Search size={36} className="text-amber-500" />
          </div>
          <input 
            type="text" 
            placeholder="Filtrar base de datos por rubro o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent flex-1 outline-none font-black text-slate-900 uppercase italic tracking-tighter text-4xl placeholder:text-slate-200"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] border-b-2 border-slate-100 bg-slate-50">
                <th className="px-12 py-10 italic">Insumo / Descripción Técnica</th>
                <th className="px-12 py-10">Categoría</th>
                <th className="px-12 py-10">Unidad</th>
                <th className="px-12 py-10 text-right">Precio Actual</th>
                <th className="px-12 py-10 text-center">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-50">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/80 group transition-all">
                  <td className="px-12 py-12">
                    <div className="flex items-center gap-8">
                      <div className="w-20 h-20 rounded-[2rem] bg-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-slate-950 group-hover:text-amber-500 transition-all shadow-inner border-2 border-transparent group-hover:border-amber-500">
                        <Construction size={36} />
                      </div>
                      <span className="font-black text-slate-900 uppercase italic tracking-tighter text-3xl group-hover:translate-x-2 transition-transform">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-12 py-12">
                    <span className="px-6 py-2.5 bg-slate-900 text-amber-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border-l-4 border-amber-500 shadow-lg">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-12 py-12 text-slate-400 font-black uppercase tracking-[0.2em] italic text-sm">{p.unit}</td>
                  <td className="px-12 py-12 text-right font-black text-slate-900 text-4xl italic tracking-tighter">${p.price.toLocaleString()}</td>
                  <td className="px-12 py-12">
                    <div className="flex items-center justify-center gap-6">
                      <button onClick={() => handleEdit(p)} className="p-5 text-slate-300 hover:text-slate-900 hover:bg-white rounded-2xl transition-all shadow-sm border border-transparent hover:border-slate-200">
                        <Edit3 size={28} />
                      </button>
                      <button onClick={() => { if(confirm('¿Eliminar registro maestro?')) onUpdate(products.filter(item => item.id !== p.id)) }} className="p-5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all shadow-sm">
                        <Trash2 size={28} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                   <td colSpan={5} className="py-56 text-center">
                      <div className="flex flex-col items-center gap-10 text-slate-100">
                         <div className="w-40 h-40 bg-slate-50 rounded-[4rem] flex items-center justify-center border-4 border-dashed border-slate-100">
                            <HardHat size={120} className="opacity-5" />
                         </div>
                         <p className="font-black uppercase tracking-[0.6em] italic text-sm text-slate-200">No hay registros que coincidan</p>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ProductManager;
