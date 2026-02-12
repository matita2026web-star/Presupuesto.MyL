import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Save, User, Calculator, 
  Tag, Percent, Hammer, Package, Construction, CheckCircle2, Calendar, AlertCircle, X, Edit2, TrendingDown,
  Layers, Clock, ShieldAlert, FileText, BadgeCheck, Zap, Briefcase, Info, ClipboardCheck, ArrowDownToLine
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
  // --- ESTADOS ORIGINALES ---
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
  const [manualAdjustment, setManualAdjustment] = useState<number>(0); 
  const [validDays, setValidDays] = useState<number>(15);
  const [budgetID, setBudgetID] = useState<string>(`EXP-${Date.now().toString().slice(-6)}`);

  // --- NUEVOS ESTADOS PARA EXPANSIÓN (+360 líneas) ---
  const [workDuration, setWorkDuration] = useState<string>('7');
  const [priority, setPriority] = useState<'baja' | 'media' | 'alta'>('media');
  const [showProfitCalc, setShowProfitCalc] = useState(false);
  const [laborCostPercent, setLaborCostPercent] = useState<number>(40);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  // --- EFECTOS ---
  useEffect(() => {
    if (initialBudget) {
      setBudgetID(initialBudget.id);
      setClient(initialBudget.client);
      setItems([...initialBudget.items]);
      setRequiredMaterials(initialBudget.requiredMaterials || []);
      setTaxRate(initialBudget.taxRate);
      setDiscount(initialBudget.discount);
      
      const diffTime = Math.abs(new Date(initialBudget.validUntil).getTime() - new Date(initialBudget.date).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setValidDays(diffDays || 15);
    } else {
      setBudgetID(`EXP-${Date.now().toString().slice(-6)}`);
      setClient({ name: '', phone: '', observations: '' });
      setItems([]);
      setRequiredMaterials([]);
      setTaxRate(settings.defaultTax);
      setDiscount(0);
      setManualAdjustment(0);
      setValidDays(15);
    }
  }, [initialBudget, settings]);

  // --- LÓGICA DE ITEMS ---
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
    const updatedItem = { ...newItems[idx], [field]: val };
    updatedItem.subtotal = updatedItem.price * updatedItem.quantity;
    newItems[idx] = updatedItem;
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

  // --- CÁLCULOS ECONÓMICOS ---
  const subtotalValue = items.reduce((acc, curr) => acc + curr.subtotal, 0);
  const discountAmount = (subtotalValue * discount) / 100;
  const taxAmount = ((subtotalValue - discountAmount) * taxRate) / 100;
  const totalValue = subtotalValue - discountAmount + taxAmount - manualAdjustment;

  // Cálculos de Rentabilidad (Nuevos)
  const estimatedProfit = useMemo(() => {
    const laborCost = (totalValue * laborCostPercent) / 100;
    const taxes = (totalValue * 0.15); // Estimación impositiva
    return totalValue - laborCost - taxes;
  }, [totalValue, laborCostPercent]);

  // --- GUARDADO ---
  const handleSave = () => {
    if (!client.name || items.length === 0) {
      alert('Error: Debe ingresar un cliente y al menos un rubro para continuar.');
      return;
    }
    if (!termsAccepted && !initialBudget) {
      alert('Debe aceptar que los precios están sujetos a cambios según inflación.');
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

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-4 gap-8 animate-in pb-32">
      
      {/* SECCIÓN PRINCIPAL (COL 3) */}
      <div className="lg:col-span-3 space-y-8">
        
        {/* 1. STATUS BAR & STEPS (NUEVO) */}
        <div className="flex items-center gap-4 bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm overflow-x-auto">
          {[
            { step: 1, label: 'Identificación', icon: User },
            { step: 2, label: 'Planilla Técnica', icon: Construction },
            { step: 3, label: 'Logística', icon: Package },
            { step: 4, label: 'Validación', icon: BadgeCheck }
          ].map((s) => (
            <div key={s.step} className="flex items-center gap-3 min-w-fit">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all ${activeStep >= s.step ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-slate-100 text-slate-400'}`}>
                {activeStep > s.step ? <CheckCircle2 size={20} /> : s.step}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${activeStep >= s.step ? 'text-slate-900' : 'text-slate-300'}`}>{s.label}</span>
              {s.step !== 4 && <div className="w-8 h-0.5 bg-slate-100 mx-2"></div>}
            </div>
          ))}
        </div>

        {/* 2. BANNER EDICIÓN (ORIGINAL) */}
        {initialBudget && (
          <div className="bg-slate-900 p-6 rounded-[2.5rem] flex items-center justify-between shadow-2xl border-l-[12px] border-amber-500 relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-5 rotate-12">
               <ShieldAlert size={120} className="text-white" />
            </div>
            <div className="flex items-center gap-5 text-white relative z-10">
               <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-900 shadow-xl">
                 <Edit2 size={28} />
               </div>
               <div>
                 <p className="text-[11px] font-black uppercase tracking-[0.4em] text-amber-500 mb-1">AUDITORÍA DE EXPEDIENTE</p>
                 <h2 className="text-2xl font-black uppercase italic tracking-tighter">RE-NEGOCIANDO: {budgetID}</h2>
               </div>
            </div>
            <button onClick={onCancel} className="p-4 bg-slate-800 text-white rounded-2xl hover:bg-red-500 transition-all active:scale-95 z-10">
              <X size={24}/>
            </button>
          </div>
        )}

        {/* 3. DATOS CLIENTE (ORIGINAL) */}
        <section className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm transition-all hover:border-slate-200" onClick={() => setActiveStep(1)}>
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-4 uppercase italic tracking-tighter">
              <div className="p-3 bg-slate-900 rounded-xl text-amber-500"><User size={22} /></div>
              Datos del Comitente
            </h3>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Paso 01/04</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nombre del Proyecto / Cliente</label>
              <input type="text" value={client.name} onChange={(e) => setClient({...client, name: e.target.value})} placeholder="EJ: RESIDENCIA GARCÍA - ETAPA I" className="w-full bg-slate-50 px-6 py-5 rounded-2xl border-2 border-slate-100 focus:border-amber-500 outline-none font-bold uppercase text-base shadow-inner transition-all focus:bg-white" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Línea de Contacto Directa</label>
              <input type="text" value={client.phone} onChange={(e) => setClient({...client, phone: e.target.value})} placeholder="+54 9 ..." className="w-full bg-slate-50 px-6 py-5 rounded-2xl border-2 border-slate-100 focus:border-amber-500 outline-none font-bold text-base shadow-inner transition-all focus:bg-white" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Memorándum Técnico y Observaciones</label>
              <textarea value={client.observations} onChange={(e) => setClient({...client, observations: e.target.value})} placeholder="ESPECIFICAR CONDICIONES DE TERRENO, ACCESOS O REQUERIMIENTOS ESPECIALES..." rows={3} className="w-full bg-slate-50 px-6 py-5 rounded-2xl border-2 border-slate-100 focus:border-amber-500 outline-none font-medium text-base shadow-inner transition-all focus:bg-white" />
            </div>
          </div>
        </section>

        {/* 4. BUSCADOR INDUSTRIAL (ORIGINAL) */}
        <section className="bg-slate-950 p-10 rounded-[3.5rem] shadow-2xl relative overflow-visible border-b-[10px] border-amber-600" onClick={() => setActiveStep(2)}>
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Construction size={120} className="text-amber-500" />
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-black text-white mb-8 flex items-center gap-4 uppercase italic tracking-tighter">
              <div className="p-3 bg-amber-500 rounded-xl text-slate-900"><Plus size={22} /></div>
              Inyección de Rubros y Tareas
            </h3>
            <div className="flex flex-col gap-6">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="DIGITE CÓDIGO O NOMBRE DEL INSUMO/SERVICIO..." 
                  value={searchTerm} 
                  onChange={(e) => { setSearchTerm(e.target.value); setSelectedProductId(''); }} 
                  className="w-full bg-slate-900 text-white px-8 py-6 rounded-[2rem] border-2 border-slate-800 focus:border-amber-500 outline-none font-black uppercase italic text-lg placeholder:text-slate-700 shadow-inner transition-all" 
                />
                {searchTerm && !selectedProductId && (
                  <div className="absolute top-full left-0 right-0 z-[100] mt-4 bg-white rounded-[2.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] max-h-80 overflow-y-auto border-4 border-slate-900">
                    {filteredProducts.map(p => (
                      <button key={p.id} onClick={() => { setSelectedProductId(p.id); setSearchTerm(p.name); }} className="w-full text-left p-6 hover:bg-amber-50 border-b border-slate-100 last:border-0 flex justify-between items-center group transition-all">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 group-hover:bg-amber-500 group-hover:text-slate-900">{p.unit}</div>
                           <div>
                              <p className="font-black text-slate-900 uppercase italic text-sm group-hover:text-amber-600 leading-none mb-1">{p.name}</p>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{settings.currency}{p.price.toLocaleString()}</span>
                           </div>
                        </div>
                        <Zap size={20} className="text-slate-200 group-hover:text-amber-500 group-hover:scale-125 transition-all" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 group">
                   <div className="bg-slate-900 rounded-3xl p-2 flex items-center border-2 border-slate-800 focus-within:border-amber-500 transition-all">
                      <span className="px-5 font-black text-slate-600 group-focus-within:text-amber-500 text-xs">CANTIDAD:</span>
                      <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full bg-transparent text-amber-500 py-4 font-black text-3xl outline-none" />
                   </div>
                </div>
                <button onClick={addItem} disabled={!selectedProductId} className="flex-[1.5] bg-amber-500 text-slate-950 font-black rounded-3xl uppercase italic tracking-tighter text-xl border-b-[10px] border-amber-700 active:translate-y-2 active:border-b-4 transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-4 py-4 disabled:opacity-50 disabled:grayscale">
                  <ArrowDownToLine size={24} /> VINCULAR A OBRA
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 5. TABLA DE LIQUIDACIÓN (ORIGINAL) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-6">
             <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] italic flex items-center gap-3">
               <Layers size={18} className="text-amber-500" /> Ingeniería de Costos Aplicada
             </h4>
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400">TOTAL RUBROS:</span>
                <span className="text-sm font-black text-slate-950 bg-white px-4 py-1.5 rounded-full border-2 border-slate-100">{items.length}</span>
             </div>
          </div>

          <div className="bg-white rounded-[3.5rem] border-2 border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900 text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">
                  <tr>
                    <th className="px-8 py-7">Rubro / Especificación</th>
                    <th className="px-8 py-7 text-center">Cant.</th>
                    <th className="px-8 py-7 text-right">Unitario</th>
                    <th className="px-8 py-7 text-right">Subtotal</th>
                    <th className="px-8 py-7 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-8">
                        <div className="flex items-center gap-4">
                           <div className="w-2 h-10 bg-amber-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                           <div>
                              <p className="font-black text-slate-900 uppercase italic text-sm leading-none mb-1.5">{item.name}</p>
                              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1">
                                <Tag size={10} /> UNIDAD: {item.unit}
                              </p>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-8 text-center">
                        <input 
                          type="number" 
                          value={item.quantity} 
                          onChange={(e) => updateItemValue(idx, 'quantity', e.target.value)} 
                          className="w-24 bg-slate-100 border-2 border-transparent rounded-2xl py-3 px-2 text-center text-sm font-black outline-none focus:border-amber-500 focus:bg-white transition-all shadow-inner" 
                        />
                      </td>
                      <td className="px-8 py-8 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs font-black text-slate-300">{settings.currency}</span>
                          <input 
                            type="number" 
                            value={item.price} 
                            onChange={(e) => updateItemValue(idx, 'price', e.target.value)} 
                            className="w-32 bg-slate-100 border-2 border-transparent rounded-2xl py-3 px-3 text-right text-sm font-black outline-none focus:border-amber-500 focus:bg-white transition-all shadow-inner" 
                          />
                        </div>
                      </td>
                      <td className="px-8 py-8 text-right">
                         <span className="text-lg font-black text-slate-900 italic font-mono">{settings.currency}{item.subtotal.toLocaleString()}</span>
                      </td>
                      <td className="px-8 py-8">
                        <button onClick={() => removeItem(idx)} className="p-4 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all group-hover:scale-110">
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {items.length === 0 && (
              <div className="py-32 text-center text-slate-200 italic flex flex-col items-center gap-6">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center animate-pulse">
                    <Hammer size={48} className="text-slate-100" />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.6em]">Aún no hay rubros cargados</p>
                    <p className="text-[10px] font-bold text-slate-300 uppercase mt-2">Utilice el buscador superior para comenzar</p>
                  </div>
              </div>
            )}
          </div>
        </div>

        {/* 6. LOGÍSTICA DE CAMPO (EXPANDIDO) */}
        <section className="bg-slate-50 p-10 rounded-[3.5rem] border-4 border-dashed border-slate-200" onClick={() => setActiveStep(3)}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase italic flex items-center gap-4 tracking-tighter">
                <div className="p-3 bg-white rounded-2xl border-2 border-slate-100 shadow-sm text-amber-600"><Package size={22} /></div>
                Logística de Insumos Críticos
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 ml-[60px]">Listado de materiales necesarios para ejecución</p>
            </div>
            <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border-2 border-slate-100 shadow-sm">
               <Clock size={16} className="text-amber-500" />
               <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Plazo Estimado:</span>
               <input type="number" value={workDuration} onChange={(e) => setWorkDuration(e.target.value)} className="w-12 text-center font-black text-amber-500 outline-none" />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Días</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-white p-4 rounded-[2rem] border-2 border-slate-100 shadow-sm">
            <input type="text" value={matName} onChange={(e) => setMatName(e.target.value)} placeholder="NOMBRE DEL INSUMO (EJ: CEMENTO LOMA NEGRA)" className="flex-1 bg-slate-50 px-6 py-5 rounded-2xl border-2 border-transparent focus:border-amber-500 outline-none font-black text-xs uppercase shadow-inner" />
            <input type="text" value={matQty} onChange={(e) => setMatQty(e.target.value)} placeholder="CANT./U." className="w-full sm:w-32 bg-slate-50 px-6 py-5 rounded-2xl border-2 border-transparent focus:border-amber-500 outline-none font-black text-center text-xs shadow-inner" />
            <button onClick={addMaterial} className="p-5 bg-slate-950 text-amber-500 rounded-2xl shadow-xl hover:bg-amber-500 hover:text-slate-950 transition-all active:scale-95">
              <Plus size={28}/>
            </button>
          </div>

          <div className="flex flex-wrap gap-4">
            {requiredMaterials.map((mat, idx) => (
              <div key={idx} className="bg-white pl-6 pr-3 py-4 rounded-[1.5rem] border-2 border-slate-100 flex items-center gap-6 shadow-sm hover:border-amber-500 transition-all group animate-slide-in">
                <div className="flex flex-col">
                  <span className="text-[11px] font-black uppercase italic text-slate-900 leading-none">{mat.name}</span>
                  <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mt-1">Requerido: {mat.quantity}</span>
                </div>
                <button onClick={() => removeMaterial(idx)} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-300 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all">
                  <X size={18}/>
                </button>
              </div>
            ))}
            {requiredMaterials.length === 0 && (
               <div className="w-full py-10 flex flex-col items-center justify-center text-slate-300">
                  <Info size={32} className="opacity-20 mb-2" />
                  <p className="text-[9px] font-black uppercase tracking-[0.4em]">Sin materiales detallados</p>
               </div>
            )}
          </div>
        </section>

        {/* 7. TÉRMINOS Y CONDICIONES (NUEVO) */}
        <section className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm" onClick={() => setActiveStep(4)}>
          <h3 className="text-base font-black text-slate-900 mb-6 flex items-center gap-4 uppercase italic tracking-tighter">
            <div className="p-2 bg-slate-100 rounded-lg"><ClipboardCheck size={20} className="text-slate-500" /></div>
            Condiciones de Contratación
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                   <div className="mt-1"><AlertCircle size={16} className="text-amber-500" /></div>
                   <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase">
                     Los precios aquí expresados tienen una validez de <span className="text-slate-900 font-black">{validDays} días</span>. 
                     Sujeto a variaciones según índice CAC o inflación mayorista.
                   </p>
                </div>
                <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                   <input 
                      type="checkbox" 
                      id="terms" 
                      checked={termsAccepted} 
                      onChange={(e) => setTermsAccepted(e.target.checked)} 
                      className="w-6 h-6 accent-amber-500 cursor-pointer"
                   />
                   <label htmlFor="terms" className="text-[10px] font-black text-amber-900 uppercase cursor-pointer">
                     Acepto las condiciones comerciales y validez técnica.
                   </label>
                </div>
             </div>
             <div className="bg-slate-900 rounded-[2rem] p-6 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-4">
                   <span className="text-[10px] font-black text-slate-500 uppercase">Prioridad de Obra</span>
                   <div className="flex gap-2">
                      {(['baja', 'media', 'alta'] as const).map(p => (
                        <button key={p} onClick={() => setPriority(p)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${priority === p ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-500'}`}>{p}</button>
                      ))}
                   </div>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Días de Validez</span>
                   <div className="flex items-center gap-4">
                      <button onClick={() => setValidDays(v => Math.max(1, v-1))} className="text-amber-500 font-black text-xl hover:scale-125 transition-transform">-</button>
                      <span className="text-xl font-black text-white italic">{validDays}</span>
                      <button onClick={() => setValidDays(v => v+1)} className="text-amber-500 font-black text-xl hover:scale-125 transition-transform">+</button>
                   </div>
                </div>
             </div>
          </div>
        </section>
      </div>

      {/* PANEL LATERAL - CIERRE ECONÓMICO (COL 1) */}
      <div className="lg:col-span-1">
        <div className="bg-slate-950 text-white p-10 rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-t-[15px] border-amber-500 space-y-8 lg:sticky lg:top-24 transition-all">
          
          <div className="flex justify-between items-center">
             <h3 className="text-2xl font-black flex items-center gap-4 uppercase italic text-amber-500 tracking-tighter">
               <Calculator size={28} /> Resumen
             </h3>
             <button onClick={() => setShowProfitCalc(!showProfitCalc)} className="text-slate-600 hover:text-white transition-colors">
               <Briefcase size={20} />
             </button>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-end border-b-2 border-white/5 pb-4">
              <div className="flex flex-col">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Inversión Bruta</span>
                 <span className="text-slate-400 font-bold text-xs">Antes de ajustes</span>
              </div>
              <span className="text-white font-mono font-black text-2xl tracking-tighter">{settings.currency}{subtotalValue.toLocaleString()}</span>
            </div>
            
            <div className="space-y-3 bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                <label className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                  <TrendingDown size={14} /> Rebaja Directa (Monto)
                </label>
                <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-red-900 font-black">{settings.currency}</span>
                   <input 
                      type="number" 
                      value={manualAdjustment} 
                      onChange={(e) => setManualAdjustment(parseFloat(e.target.value) || 0)} 
                      className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl pl-12 pr-6 py-5 font-black text-red-400 text-2xl outline-none focus:border-red-500/30 transition-all" 
                      placeholder="0.00" 
                   />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Bonif. (%)</span>
                 <div className="bg-slate-900 rounded-2xl p-4 border border-white/5 flex items-center justify-center gap-2">
                    <input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} className="bg-transparent w-full text-center font-black text-amber-500 text-xl outline-none" />
                    <Percent size={14} className="text-slate-700" />
                 </div>
              </div>
              <div className="space-y-2">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">IVA/Gastos (%)</span>
                 <div className="bg-slate-900 rounded-2xl p-4 border border-white/5 flex items-center justify-center gap-2">
                    <input type="number" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} className="bg-transparent w-full text-center font-black text-amber-500 text-xl outline-none" />
                    <Percent size={14} className="text-slate-700" />
                 </div>
              </div>
            </div>

            {/* MÓDULO RENTABILIDAD (NUEVO) */}
            {showProfitCalc && (
               <div className="bg-emerald-950/30 p-6 rounded-3xl border border-emerald-500/20 animate-in fade-in zoom-in duration-300">
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-4">Estimación de Utilidad Neta</p>
                  <div className="space-y-3">
                     <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Mano de Obra ({laborCostPercent}%)</span>
                        <span className="text-white font-black">-{settings.currency}{((totalValue * laborCostPercent)/100).toLocaleString()}</span>
                     </div>
                     <input type="range" min="10" max="70" value={laborCostPercent} onChange={(e) => setLaborCostPercent(parseInt(e.target.value))} className="w-full accent-emerald-500" />
                     <div className="pt-3 border-t border-emerald-500/20 flex justify-between items-center">
                        <span className="text-xs font-black text-emerald-400">GANANCIA EST.</span>
                        <span className="text-xl font-black text-emerald-500 italic">{settings.currency}{estimatedProfit.toLocaleString()}</span>
                     </div>
                  </div>
               </div>
            )}

            <div className="pt-10 text-right border-t-4 border-amber-500 relative">
              <div className="absolute -top-5 right-0 bg-slate-950 px-5 text-[11px] font-black text-amber-500 uppercase tracking-[0.5em] italic">Inversión Final Obra</div>
              <div className="flex items-baseline justify-end gap-2">
                 <span className="text-2xl font-black text-amber-600 italic tracking-tighter">{settings.currency}</span>
                 <p className="text-6xl font-black text-white italic font-mono tracking-tighter leading-none">{totalValue.toLocaleString()}</p>
              </div>
              <p className="text-[9px] text-slate-500 font-bold uppercase mt-4 tracking-widest">Documento Técnico Provisorio No Vinculante</p>
            </div>
          </div>

          <div className="space-y-4 pt-4">
             <button 
                onClick={handleSave} 
                disabled={!termsAccepted && !initialBudget}
                className="w-full bg-amber-500 text-slate-950 font-black py-7 rounded-[2.5rem] shadow-2xl flex items-center justify-center gap-4 uppercase italic text-xl border-b-[10px] border-amber-700 active:translate-y-2 active:border-b-4 transition-all hover:bg-amber-400 disabled:opacity-50 disabled:grayscale"
             >
                <Save size={28} />
                {initialBudget ? 'ACTUALIZAR OBRA' : 'EMITIR CERTIFICADO'}
             </button>
             
             {initialBudget && (
               <button onClick={onCancel} className="w-full bg-slate-800 text-slate-400 font-black py-4 rounded-[2rem] text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                 DESCARTAR CAMBIOS
               </button>
             )}
          </div>

          <div className="flex justify-center gap-6 opacity-20">
             <Construction size={24} />
             <Hammer size={24} />
             <FileText size={24} />
          </div>
        </div>
      </div>

      {/* FOOTER DECORATIVO */}
      <div className="lg:col-span-4 mt-12 border-t-2 border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-amber-500 font-black italic">E</div>
            <div>
               <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">Engineering Pro System</p>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Terminal de Expedición v4.0.2</p>
            </div>
         </div>
         <div className="flex gap-8">
            <div className="text-center">
               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Cifrado</p>
               <BadgeCheck size={18} className="text-emerald-500 mx-auto" />
            </div>
            <div className="text-center">
               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Nube</p>
               <Zap size={18} className="text-amber-500 mx-auto" />
            </div>
         </div>
      </div>
    </div>
  );
};

export default BudgetGenerator;
