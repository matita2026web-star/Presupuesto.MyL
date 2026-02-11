
import React, { useState } from 'react';
import { 
  Plus, Trash2, Save, User, Calculator, 
  Tag, Percent, Hammer, Package, Construction, CheckCircle2, Calendar
} from 'lucide-react';
import { Product, Budget, BudgetOrderItem, ClientData, BusinessSettings, RequiredMaterial } from '../types';

interface BudgetGeneratorProps {
  products: Product[];
  settings: BusinessSettings;
  onSave: (budget: Budget) => void;
}

const BudgetGenerator: React.FC<BudgetGeneratorProps> = ({ products, settings, onSave }) => {
  const [client, setClient] = useState<ClientData>({ name: '', phone: '', observations: '' });
  const [items, setItems] = useState<BudgetOrderItem[]>([]);
  const [requiredMaterials, setRequiredMaterials] = useState<RequiredMaterial[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState<string>('1');

  const [matName, setMatName] = useState('');
  const [matQty, setMatQty] = useState('');
  
  const [taxRate, setTaxRate] = useState<number>(settings.defaultTax);
  const [discount, setDiscount] = useState<number>(0);
  const [validDays, setValidDays] = useState<number>(15);

  const addItem = () => {
    const product = products.find(p => p.id === selectedProductId);
    if (!product || !quantity || parseFloat(quantity) <= 0) return;

    const qty = parseFloat(quantity);
    const newItem: BudgetOrderItem = {
      productId: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      quantity: qty,
      subtotal: product.price * qty,
    };

    setItems([...items, newItem]);
    setSelectedProductId('');
    setQuantity('1');
    setSearchTerm('');
  };

  const addMaterial = () => {
    if (!matName || !matQty) return;
    setRequiredMaterials([...requiredMaterials, { name: matName, quantity: matQty }]);
    setMatName('');
    setMatQty('');
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const removeMaterial = (idx: number) => setRequiredMaterials(requiredMaterials.filter((_, i) => i !== idx));

  const subtotal = items.reduce((acc, curr) => acc + curr.subtotal, 0);
  const discountAmount = (subtotal * discount) / 100;
  const taxAmount = ((subtotal - discountAmount) * taxRate) / 100;
  const total = subtotal - discountAmount + taxAmount;

  const handleSave = () => {
    if (!client.name || items.length === 0) {
      alert('Faltan datos del cliente o ítems en la planilla.');
      return;
    }
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);
    onSave({
      id: `EXP-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      validUntil: validUntil.toISOString(),
      client, items, requiredMaterials, taxRate, discount, subtotal, total, status: 'pendiente'
    });
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + validDays);

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6 animate-slide-up pb-24">
      <div className="lg:col-span-3 space-y-6">
        
        {/* DATOS CLIENTE */}
        <section className="bg-white p-6 rounded-3xl border-l-[10px] border-amber-500 shadow-lg">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3 uppercase italic tracking-tighter">
            <User size={18} className="text-amber-500" />
            Identificación de Obra
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cliente / Empresa</label>
              <input type="text" value={client.name} onChange={(e) => setClient({...client, name: e.target.value})} placeholder="Residencia García" className="w-full bg-slate-50 px-4 py-3.5 rounded-xl border-2 border-slate-100 focus:border-amber-500 outline-none font-bold uppercase text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
              <input type="text" value={client.phone} onChange={(e) => setClient({...client, phone: e.target.value})} placeholder="+54 9..." className="w-full bg-slate-50 px-4 py-3.5 rounded-xl border-2 border-slate-100 focus:border-amber-500 outline-none font-bold text-sm" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Notas Técnicas</label>
              <textarea value={client.observations} onChange={(e) => setClient({...client, observations: e.target.value})} placeholder="Ej: Plazo de ejecución 15 días..." rows={2} className="w-full bg-slate-50 px-4 py-3.5 rounded-xl border-2 border-slate-100 focus:border-amber-500 outline-none font-medium text-sm" />
            </div>
          </div>
        </section>

        {/* BUSCADOR DE RUBROS */}
        <section className="bg-slate-950 p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Construction size={100} className="text-amber-500" />
          </div>
          <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3 uppercase italic tracking-tighter">
            <Plus size={18} className="text-amber-500" />
            Planilla de Rubros
          </h3>
          <div className="flex flex-col gap-4 relative z-10">
            <div className="relative">
              <input type="text" placeholder="Buscar rubro de ingeniería..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900 text-white px-5 py-4 rounded-xl border-2 border-slate-800 focus:border-amber-500 outline-none font-bold uppercase italic text-sm placeholder:text-slate-600" />
              {searchTerm && !selectedProductId && (
                <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white rounded-2xl shadow-2xl max-h-60 overflow-y-auto border-2 border-slate-900">
                  {filteredProducts.map(p => (
                    <button key={p.id} onClick={() => { setSelectedProductId(p.id); setSearchTerm(p.name); }} className="w-full text-left p-4 hover:bg-amber-50 border-b border-slate-100 last:border-0 flex justify-between items-center group">
                      <div>
                        <p className="font-black text-slate-900 uppercase italic text-sm group-hover:text-amber-600">{p.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{settings.currency}{p.price} / {p.unit}</p>
                      </div>
                      <Plus size={16} className="text-slate-300" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Cant." className="w-full bg-slate-900 text-amber-500 px-5 py-4 rounded-xl border-2 border-slate-800 focus:border-amber-500 outline-none font-black text-center text-xl" />
              </div>
              <button onClick={addItem} disabled={!selectedProductId} className="flex-[2] bg-amber-500 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/10 disabled:opacity-20 uppercase italic tracking-tighter text-sm active:scale-95 transition-transform">
                CARGAR
              </button>
            </div>
          </div>
        </section>

        {/* LISTADO DE ITEMS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Presupuesto Detallado</h4>
             <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">{items.length} ítems</span>
          </div>
          
          <div className="md:hidden space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm relative group">
                <button onClick={() => removeItem(idx)} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                <h5 className="font-black text-slate-900 uppercase italic text-sm pr-10">{item.name}</h5>
                <div className="mt-4 flex justify-between items-end border-t border-slate-50 pt-3">
                  <div className="text-[10px] font-bold text-slate-400 uppercase leading-none">
                    {item.quantity} {item.unit} x {settings.currency}{item.price.toLocaleString()}
                  </div>
                  <div className="text-lg font-black text-slate-900 italic leading-none">
                    {settings.currency}{item.subtotal.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="py-20 text-center text-slate-300 italic border-2 border-dashed border-slate-200 rounded-2xl">
                 <Hammer size={32} className="mx-auto mb-2 opacity-20" />
                 <p className="text-[10px] font-black uppercase">Sin tareas asignadas</p>
              </div>
            )}
          </div>

          <div className="hidden md:block bg-white rounded-3xl border-2 border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-950 text-[9px] font-black text-amber-500 uppercase tracking-[0.2em]">
                <tr>
                  <th className="px-6 py-4">Rubro</th>
                  <th className="px-6 py-4 text-center">Cant.</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-6 py-5">
                      <p className="font-black text-slate-900 uppercase italic text-sm">{item.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{settings.currency}{item.price} / {item.unit}</p>
                    </td>
                    <td className="px-6 py-5 text-center font-black text-slate-700">{item.quantity}</td>
                    <td className="px-6 py-5 text-right font-black text-slate-900 italic text-base">{settings.currency}{item.subtotal.toLocaleString()}</td>
                    <td className="px-6 py-5">
                      <button onClick={() => removeItem(idx)} className="text-slate-300 hover:text-red-500"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MATERIALES */}
        <section className="bg-slate-100 p-6 rounded-3xl border-2 border-dashed border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <Package size={18} className="text-slate-600" />
            <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-tighter">Insumos de Campo</h3>
          </div>
          <div className="flex gap-2 mb-6">
            <input type="text" value={matName} onChange={(e) => setMatName(e.target.value)} placeholder="Cemento 50kg" className="flex-1 bg-white px-4 py-3 rounded-xl border border-slate-200 outline-none font-bold text-xs uppercase" />
            <input type="text" value={matQty} onChange={(e) => setMatQty(e.target.value)} placeholder="10" className="w-16 bg-white px-2 py-3 rounded-xl border border-slate-200 outline-none font-bold text-center text-xs" />
            <button onClick={addMaterial} className="p-3 bg-slate-950 text-amber-500 rounded-xl"><Plus size={20}/></button>
          </div>
          <div className="flex flex-wrap gap-2">
            {requiredMaterials.map((mat, idx) => (
              <div key={idx} className="bg-white px-3 py-2 rounded-lg border border-slate-200 flex items-center gap-3">
                <span className="text-[10px] font-black uppercase italic text-slate-700">{mat.name} <span className="text-amber-600 font-mono">[{mat.quantity}]</span></span>
                <button onClick={() => removeMaterial(idx)} className="text-slate-300 hover:text-red-500"><Trash2 size={12}/></button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* LIQUIDACION */}
      <div className="lg:col-span-1">
        <div className="bg-slate-950 text-white p-6 rounded-[2.5rem] shadow-2xl border-t-[10px] border-amber-500 space-y-6">
          <h3 className="text-lg font-black flex items-center gap-3 uppercase italic tracking-tighter text-amber-500">
            <Calculator size={20} />
            Liquidación Final
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between text-slate-500 font-black uppercase text-[10px] tracking-widest border-b border-white/5 pb-2">
              <span>Costo Neto</span>
              <span className="text-white">{settings.currency}{subtotal.toLocaleString()}</span>
            </div>

            {/* Selector de Validez */}
            <div className="space-y-2">
               <div className="flex items-center gap-2">
                 <Calendar size={12} className="text-slate-500" />
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Validez de Oferta (Días)</span>
               </div>
               <input 
                type="number" 
                value={validDays} 
                onChange={(e) => setValidDays(parseInt(e.target.value) || 0)} 
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 font-black text-amber-500 outline-none text-sm focus:border-amber-500/50" 
              />
            </div>

            <div className="flex items-center justify-between gap-4">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Tag size={12}/> % BONIF.</span>
               <input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} className="w-20 bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-right font-black text-amber-500 outline-none text-xs" />
            </div>
            <div className="flex items-center justify-between gap-4">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Percent size={12}/> % IVA/GAST.</span>
               <input type="number" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} className="w-20 bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-right font-black text-amber-500 outline-none text-xs" />
            </div>
            
            <div className="pt-4 flex flex-col items-end gap-1">
              <span className="text-[9px] font-black text-amber-600 uppercase tracking-[0.4em] italic">Inversión Final</span>
              <span className="text-4xl md:text-5xl font-black text-white tracking-tighter italic leading-none">{settings.currency}{total.toLocaleString()}</span>
            </div>
          </div>
          
          <button onClick={handleSave} className="w-full bg-amber-500 text-slate-950 font-black py-5 rounded-2xl shadow-xl shadow-amber-900/20 flex items-center justify-center gap-3 uppercase italic tracking-tighter text-base active:scale-95 transition-transform border-b-4 border-amber-700">
            <Save size={20} />
            EMITIR COTIZACIÓN
          </button>
          
          <div className="text-center bg-slate-900/50 py-3 rounded-2xl border border-white/5">
            <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1">Presupuesto vigente hasta el:</p>
            <p className="text-xs font-black text-white font-mono">{expirationDate.toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetGenerator;
