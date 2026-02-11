
import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Save, User, Calculator, 
  Tag, Percent, Hammer, Package, Construction, CheckCircle2, Calendar, AlertCircle, X, Edit2
} from 'lucide-react';
import { Product, Budget, BudgetOrderItem, ClientData, BusinessSettings, RequiredMaterial } from '../types';

interface BudgetGeneratorProps {
  products: Product[];
  settings: BusinessSettings;
  onSave: (budget: Budget) => void;
  initialBudget?: Budget | null;
  onCancel?: () => void;
}

const BudgetGenerator: React.FC<BudgetGeneratorProps> = ({ products, settings, onSave, initialBudget, onCancel }) => {
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
  const [budgetID, setBudgetID] = useState<string>(`EXP-${Date.now().toString().slice(-6)}`);

  // Efecto para cargar datos cuando se presiona EDITAR o resetear para NUEVO
  useEffect(() => {
    if (initialBudget) {
      setBudgetID(initialBudget.id);
      setClient(initialBudget.client);
      setItems(initialBudget.items);
      setRequiredMaterials(initialBudget.requiredMaterials || []);
      setTaxRate(initialBudget.taxRate);
      setDiscount(initialBudget.discount);
      
      const diffTime = Math.abs(new Date(initialBudget.validUntil).getTime() - new Date(initialBudget.date).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setValidDays(diffDays || 15);
    } else {
      // Reset para nueva obra
      setBudgetID(`EXP-${Date.now().toString().slice(-6)}`);
      setClient({ name: '', phone: '', observations: '' });
      setItems([]);
      setRequiredMaterials([]);
      setTaxRate(settings.defaultTax);
      setDiscount(0);
      setValidDays(15);
    }
  }, [initialBudget, settings]);

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

  const updateItemValue = (idx: number, field: 'price' | 'quantity', value: string) => {
    const val = parseFloat(value) || 0;
    const newItems = [...items];
    newItems[idx] = {
      ...newItems[idx],
      [field]: val,
      subtotal: field === 'price' ? val * newItems[idx].quantity : newItems[idx].price * val
    };
    setItems(newItems);
  };

  const addMaterial = () => {
    if (!matName || !matQty) return;
    setRequiredMaterials([...requiredMaterials, { name: matName, quantity: matQty }]);
    setMatName('');
    setMatQty('');
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const removeMaterial = (idx: number) => setRequiredMaterials(requiredMaterials.filter((_, i) => i !== idx));

  const subtotalValue = items.reduce((acc, curr) => acc + curr.subtotal, 0);
  const discountAmount = (subtotalValue * discount) / 100;
  const taxAmount = ((subtotalValue - discountAmount) * taxRate) / 100;
  const totalValue = subtotalValue - discountAmount + taxAmount;

  const handleSave = () => {
    if (!client.name || items.length === 0) {
      alert('Error: Debe ingresar un nombre de cliente y cargar rubros en la planilla.');
      return;
    }
    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + validDays);
    
    onSave({
      id: budgetID,
      date: initialBudget ? initialBudget.date : new Date().toISOString(),
      validUntil: validUntilDate.toISOString(),
      client, 
      items, 
      requiredMaterials, 
      taxRate, 
      discount, 
      subtotal: subtotalValue, 
      total: totalValue, 
      status: initialBudget ? initialBudget.status : 'pendiente'
    });
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + validDays);

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6 animate-in pb-24">
      <div className="lg:col-span-3 space-y-6">
        
        {/* CABECERA DE MODO */}
        {initialBudget && (
          <div className="bg-amber-500 p-5 rounded-3xl flex items-center justify-between shadow-xl border-b-4 border-amber-600">
            <div className="flex items-center gap-4 text-slate-900">
               <Edit2 size={24} />
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest leading-none opacity-80">Negociación de Precio</p>
                 <p className="text-lg font-black uppercase italic tracking-tighter">EDITANDO EXP: {budgetID}</p>
               </div>
            </div>
            <button onClick={onCancel} className="p-3 bg-slate-900 text-amber-500 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg"><X size={20}/></button>
          </div>
        )}

        {/* IDENTIFICACION */}
        <section className="bg-white p-6 rounded-[2rem] border-l-[10px] border-amber-500 shadow-sm border border-slate-200">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3 uppercase italic tracking-tighter">
            <User size={18} className="text-amber-500" />
            Datos del Proyecto
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cliente / Obra</label>
              <input type="text" value={client.name} onChange={(e) => setClient({...client, name: e.target.value})} placeholder="Ej: Consorcio Edificio Norte" className="w-full bg-slate-50 px-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-amber-500 outline-none font-bold uppercase text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
              <input type="text" value={client.phone} onChange={(e) => setClient({...client, phone: e.target.value})} placeholder="Ej: 549351..." className="w-full bg-slate-50 px-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-amber-500 outline-none font-bold text-sm" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Notas Técnicas</label>
              <textarea value={client.observations} onChange={(e) => setClient({...client, observations: e.target.value})} placeholder="Condiciones de pago, plazos, etc." rows={2} className="w-full bg-slate-50 px-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-amber-500 outline-none font-medium text-sm" />
            </div>
          </div>
        </section>

        {/* CARGADOR DE RUBROS */}
        <section className="bg-slate-950 p-6 rounded-[2.5rem] shadow-2xl relative overflow-visible">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Construction size={100} className="text-amber-500" />
          </div>
          <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3 uppercase italic tracking-tighter">
            <Plus size={18} className="text-amber-500" />
            Catálogo de Rubros
          </h3>
          <div className="flex flex-col gap-4 relative z-20">
            <div className="relative">
              <input 
                type="text" 
                placeholder="BUSCAR TAREA O INSUMO..." 
                value={searchTerm} 
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedProductId('');
                }} 
                className="w-full bg-slate-900 text-white px-5 py-5 rounded-2xl border-2 border-slate-800 focus:border-amber-500 outline-none font-black uppercase italic text-sm placeholder:text-slate-600 shadow-inner" 
              />
              {searchTerm && !selectedProductId && (
                <div className="absolute top-full left-0 right-0 z-[100] mt-3 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] max-h-72 overflow-y-auto border-2 border-slate-900 custom-scrollbar">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map(p => (
                      <button key={p.id} onClick={() => { setSelectedProductId(p.id); setSearchTerm(p.name); }} className="w-full text-left p-5 hover:bg-amber-50 border-b border-slate-100 last:border-0 flex justify-between items-center group transition-all">
                        <div>
                          <p className="font-black text-slate-900 uppercase italic text-xs group-hover:text-amber-600 leading-tight mb-1">{p.name}</p>
                          <div className="flex items-center gap-3">
                             <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase">{p.category}</span>
                             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{settings.currency}{p.price.toLocaleString()} / {p.unit}</span>
                          </div>
                        </div>
                        <CheckCircle2 size={18} className="text-slate-200 group-hover:text-amber-500" />
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-300 uppercase font-black text-[10px] tracking-widest italic">Sin resultados en catálogo</div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="CANT." className="w-full bg-slate-900 text-amber-500 px-5 py-5 rounded-2xl border-2 border-slate-800 focus:border-amber-500 outline-none font-black text-center text-2xl shadow-inner" />
              </div>
              <button onClick={addItem} disabled={!selectedProductId} className="flex-[2] bg-amber-500 text-slate-950 font-black rounded-2xl shadow-xl shadow-amber-500/20 disabled:opacity-20 uppercase italic tracking-tighter text-base active:scale-95 transition-all border-b-4 border-amber-700">
                CARGAR RUBRO
              </button>
            </div>
          </div>
        </section>

        {/* PLANILLA DETALLADA */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Planilla de Certificación</h4>
             <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">{items.length} Rubros</span>
          </div>

          <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-[9px] font-black text-amber-500 uppercase tracking-[0.3em]">
                  <tr>
                    <th className="px-6 py-5">Descripción</th>
                    <th className="px-6 py-5 text-center">Cant.</th>
                    <th className="px-6 py-5 text-right">Unitario</th>
                    <th className="px-6 py-5 text-right">Subtotal</th>
                    <th className="px-6 py-5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-6">
                        <p className="font-black text-slate-900 uppercase italic text-[11px] leading-none mb-1">{item.name}</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{item.unit}</p>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <input 
                          type="number" 
                          value={item.quantity} 
                          onChange={(e) => updateItemValue(idx, 'quantity', e.target.value)} 
                          className="w-16 bg-slate-100 border border-slate-200 rounded-xl py-2 px-1 text-center text-xs font-black outline-none focus:border-amber-500 focus:bg-white transition-all shadow-inner"
                        />
                      </td>
                      <td className="px-6 py-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-[10px] font-black text-slate-300">{settings.currency}</span>
                          <input 
                            type="number" 
                            value={item.price} 
                            onChange={(e) => updateItemValue(idx, 'price', e.target.value)} 
                            className="w-24 bg-slate-100 border border-slate-200 rounded-xl py-2 px-2 text-right text-xs font-black outline-none focus:border-amber-500 focus:bg-white transition-all shadow-inner"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right font-black text-slate-900 italic text-base font-mono">{settings.currency}{item.subtotal.toLocaleString()}</td>
                      <td className="px-6 py-6">
                        <button onClick={() => removeItem(idx)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {items.length === 0 && (
              <div className="py-24 text-center flex flex-col items-center opacity-20">
                 <Hammer size={48} className="mb-3" />
                 <p className="text-[11px] font-black uppercase tracking-[0.5em]">Planilla de obra vacía</p>
              </div>
            )}
          </div>
        </div>

        {/* MATERIALES DE CAMPO */}
        <section className="bg-slate-100 p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200">
          <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-tighter mb-6 flex items-center gap-3">
            <Package size={20} className="text-amber-600" /> Requerimientos de Materiales
          </h3>
          <div className="flex gap-3 mb-6">
            <input type="text" value={matName} onChange={(e) => setMatName(e.target.value)} placeholder="EJ: ARENA FINA X M3" className="flex-1 bg-white px-5 py-4 rounded-2xl border border-slate-200 outline-none font-bold text-xs uppercase" />
            <input type="text" value={matQty} onChange={(e) => setMatQty(e.target.value)} placeholder="CANT." className="w-28 bg-white px-3 py-4 rounded-2xl border border-slate-200 outline-none font-bold text-center text-xs" />
            <button onClick={addMaterial} className="p-4 bg-slate-950 text-amber-500 rounded-2xl hover:bg-slate-800 transition-all shadow-lg active:scale-90"><Plus size={24}/></button>
          </div>
          <div className="flex flex-wrap gap-3">
            {requiredMaterials.map((mat, idx) => (
              <div key={idx} className="bg-white px-4 py-3 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm group hover:border-amber-200 transition-colors">
                <span className="text-[11px] font-black uppercase italic text-slate-700">{mat.name} <span className="text-amber-600 font-mono ml-2">[{mat.quantity}]</span></span>
                <button onClick={() => removeMaterial(idx)} className="text-slate-300 hover:text-red-500 transition-colors"><X size={16}/></button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* BLOQUE DE LIQUIDACIÓN FIJO (ESTILO INDUSTRIAL) */}
      <div className="lg:col-span-1">
        <div className="bg-slate-950 text-white p-8 rounded-[3rem] shadow-2xl border-t-[12px] border-amber-500 space-y-8 lg:sticky lg:top-24">
          <h3 className="text-xl font-black flex items-center gap-3 uppercase italic tracking-tighter text-amber-500">
            <Calculator size={24} /> Resumen Final
          </h3>
          
          <div className="space-y-5">
            <div className="flex justify-between border-b border-white/5 pb-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Bruto Planilla</span>
              <span className="text-white font-mono font-black text-lg">{settings.currency}{subtotalValue.toLocaleString()}</span>
            </div>
            
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                 <Calendar size={12}/> Validez (Días)
               </label>
               <input type="number" value={validDays} onChange={(e) => setValidDays(parseInt(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-4 font-black text-amber-500 text-base outline-none focus:border-amber-500/50" />
            </div>

            <div className="flex items-center justify-between">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Tag size={12}/> Descuento %</span>
               <input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} className="w-24 bg-slate-900 border border-slate-800 rounded-xl p-3 text-right font-black text-amber-500 text-sm" />
            </div>

            <div className="flex items-center justify-between">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Percent size={12}/> IVA / Gastos %</span>
               <input type="number" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} className="w-24 bg-slate-900 border border-slate-800 rounded-xl p-3 text-right font-black text-amber-500 text-sm" />
            </div>

            <div className="pt-8 text-right border-t border-white/10 relative">
              <div className="absolute -top-3 right-0 bg-slate-950 px-3 text-[9px] font-black text-amber-600 uppercase tracking-[0.4em] italic">Inversión de Obra</div>
              <p className="text-5xl font-black text-white italic font-mono tracking-tighter leading-none mt-2">{settings.currency}{totalValue.toLocaleString()}</p>
            </div>
          </div>

          <button onClick={handleSave} className="w-full bg-amber-500 text-slate-950 font-black py-6 rounded-[2rem] shadow-xl flex items-center justify-center gap-3 uppercase italic tracking-tighter text-lg active:scale-95 transition-all border-b-8 border-amber-700 hover:bg-amber-400">
            <Save size={24} />
            {initialBudget ? 'GUARDAR CAMBIOS' : 'EMITIR PRESUPUESTO'}
          </button>

          <div className="text-center pt-2 opacity-40">
             <p className="text-[9px] font-black uppercase tracking-widest">Válido hasta el {expirationDate.toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetGenerator;

