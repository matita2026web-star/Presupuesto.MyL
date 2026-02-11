

import React, { useState } from 'react';
import { 
  Plus, Search, Trash2, Edit3, Save, X, 
  HardHat, Package, Construction, 
  Layers, Info, DollarSign, Type
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

  // Usamos un estado que permita string para el precio, así se puede borrar el '0'
  const [form, setForm] = useState<{
    name: string;
    price: string | number;
    unit: UnitType;
    category: string;
  }>({
    name: '',
    price: '',
    unit: UnitType.UNIDAD,
    category: 'General'
  });

  const handleSave = () => {
    const priceNum = typeof form.price === 'string' ? parseFloat(form.price) : form.price;
    
    if (!form.name || isNaN(priceNum as number) || form.name.trim() === '') {
      alert("La descripción técnica y un precio válido son obligatorios.");
      return;
    }
    
    if (editingId) {
      onUpdate(products.map(p => p.id === editingId ? { ...p, ...form, price: priceNum } as Product : p));
    } else {
      const newProduct: Product = {
        id: Date.now().toString(),
        name: form.name,
        price: priceNum as number,
        unit: form.unit,
        category: form.category || 'General'
      };
      onUpdate([...products, newProduct]);
    }
    resetForm();
  };

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      price: p.price,
      unit: p.unit,
      category: p.category
    });
    setIsAdding(true);
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setForm({ name: '', price: '', unit: UnitType.UNIDAD, category: 'General' });
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Industrial */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-amber-500 rounded text-slate-900">
              <Layers size={18} />
            </div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">MAESTRO DE INSUMOS</h2>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Control de Precios y Rendimientos Técnicos</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black flex items-center justify-center gap-2 uppercase text-[11px] tracking-widest shadow-lg shadow-slate-200 active:scale-95 transition-all border-b-4 border-slate-700 hover:bg-slate-800"
        >
          <Plus size={16} className="text-amber-500" />
          Añadir Registro
        </button>
      </div>

      {/* Buscador Profesional */}
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors">
          <Search size={18}/>
        </div>
        <input 
          type="text" 
          placeholder="BUSCAR POR DESCRIPCIÓN O RUBRO..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="w-full bg-white pl-12 pr-4 py-4 rounded-xl border border-slate-200 outline-none focus:border-amber-500 text-xs font-bold shadow-sm transition-all uppercase placeholder:text-slate-300 tracking-wider" 
        />
      </div>

      {/* Modal de Carga Mejorado */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border-x-4 border-slate-900 animate-in zoom-in-95">
            <header className="bg-slate-900 p-6 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center text-slate-900 shadow-lg shadow-amber-500/20">
                  <Construction size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">
                    {editingId ? 'Editar Especificación' : 'Nueva Ficha Técnica'}
                  </h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Entrada de datos maestros</p>
                </div>
              </div>
              <button onClick={resetForm} className="p-2 text-slate-500 hover:text-white transition-colors"><X size={24}/></button>
            </header>

            <div className="p-8 space-y-8">
              {/* Bloque de Identificación */}
              <div className="space-y-5">
                <div className="relative">
                  <label className="absolute -top-2 left-3 px-2 bg-white text-[9px] font-black text-slate-400 uppercase tracking-widest z-10">Descripción del Insumo</label>
                  <div className="flex items-center bg-slate-50 border-2 border-slate-100 rounded-xl px-4 focus-within:border-amber-500 transition-colors">
                    <Type size={16} className="text-slate-300 mr-3" />
                    <input 
                      type="text" 
                      value={form.name} 
                      onChange={(e) => setForm({...form, name: e.target.value})} 
                      placeholder="EJ: MANO DE OBRA REVOQUE GRUESO" 
                      className="w-full py-4 bg-transparent outline-none font-bold text-xs uppercase text-slate-700" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="absolute -top-2 left-3 px-2 bg-white text-[9px] font-black text-slate-400 uppercase tracking-widest z-10">Rubro</label>
                    <div className="flex items-center bg-slate-50 border-2 border-slate-100 rounded-xl px-4 focus-within:border-amber-500 transition-colors">
                      <Layers size={16} className="text-slate-300 mr-3" />
                      <input 
                        type="text" 
                        value={form.category} 
                        onChange={(e) => setForm({...form, category: e.target.value})} 
                        placeholder="ALBAÑILERÍA" 
                        className="w-full py-4 bg-transparent outline-none font-bold text-[10px] uppercase text-slate-700" 
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <label className="absolute -top-2 left-3 px-2 bg-white text-[9px] font-black text-slate-400 uppercase tracking-widest z-10">Unidad</label>
                    <div className="flex items-center bg-slate-50 border-2 border-slate-100 rounded-xl px-4 focus-within:border-amber-500 transition-colors">
                      <Package size={16} className="text-slate-300 mr-3" />
                      <select 
                        value={form.unit} 
                        onChange={(e) => setForm({...form, unit: e.target.value as UnitType})} 
                        className="w-full py-4 bg-transparent outline-none font-bold text-[10px] uppercase text-slate-700 appearance-none cursor-pointer"
                      >
                        {Object.values(UnitType).map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloque de Costos - Con corrección de borrado de 0 */}
              <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={14} className="text-amber-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor Unitario de Referencia</span>
                </div>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-amber-500 text-2xl">$</div>
                  <input 
                    type="number" 
                    value={form.price} 
                    onChange={(e) => setForm({...form, price: e.target.value})} 
                    placeholder="0"
                    className="w-full bg-slate-900 text-white pl-14 pr-6 py-6 rounded-xl border-none outline-none font-mono font-bold text-4xl text-center shadow-xl ring-2 ring-transparent focus:ring-amber-500 transition-all" 
                  />
                </div>
                <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Ingrese el valor neto para cálculos automáticos</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={resetForm} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-xl uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-colors">
                  Cancelar
                </button>
                <button 
                  onClick={handleSave} 
                  className="flex-[2] bg-slate-900 text-white font-black py-4 rounded-xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all uppercase text-[10px] tracking-widest border-b-4 border-slate-700 hover:bg-slate-800"
                >
                  <Save size={18} className="text-amber-500" />
                  {editingId ? 'Guardar Cambios' : 'Confirmar Alta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Planilla Técnica (Tabla) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción Técnica</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Rubro</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Unidad</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Costo Vigente</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-slate-900 group-hover:text-amber-500 transition-all border border-transparent group-hover:border-amber-500/30">
                        <HardHat size={16} />
                      </div>
                      <span className="text-xs font-black text-slate-700 uppercase truncate max-w-[200px]" title={p.name}>
                        {p.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="inline-block px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200 group-hover:bg-white group-hover:text-slate-800 transition-colors">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center font-mono text-[10px] font-bold text-slate-400 uppercase">{p.unit}</td>
                  <td className="px-6 py-5 text-right font-mono font-black text-slate-900 italic text-sm">
                    ${p.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleEdit(p)} className="p-2.5 text-slate-300 hover:text-slate-900 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100">
                        <Edit3 size={16}/>
                      </button>
                      <button 
                        onClick={() => { if(confirm('¿ELIMINAR ESTE INSUMO DEL CATÁLOGO MAESTRO?')) onUpdate(products.filter(item => item.id !== p.id)) }} 
                        className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-24 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Package size={24} className="text-slate-200" />
            </div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] italic">No se hallaron registros técnicos</p>
          </div>
        )}
      </div>

      {/* Footer Informativo */}
      <div className="bg-slate-900 p-5 rounded-2xl flex items-center justify-between text-white shadow-xl border-b-4 border-amber-500">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-amber-500 border border-slate-700">
              <Info size={20} />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-0.5">Gestión de Catálogo</p>
              <p className="text-[9px] font-medium text-slate-400 leading-tight">
                Los precios actualizados aquí se reflejarán en todas las nuevas cotizaciones.
              </p>
           </div>
        </div>
        <div className="text-right">
           <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Items Totales</p>
           <p className="text-lg font-black font-mono text-white leading-none">{products.length}</p>
        </div>
      </div>
    </div>
  );
};

export default ProductManager;
