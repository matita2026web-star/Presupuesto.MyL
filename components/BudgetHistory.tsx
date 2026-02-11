
import React, { useState } from 'react';
import { 
  Search, Eye, Trash2, Send, Download, X, Calendar, 
  CheckCircle2, XCircle, Clock, AlertCircle, FileText, Filter, HardHat
} from 'lucide-react';
import { Budget, BusinessSettings, BudgetStatus } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BudgetHistoryProps {
  budgets: Budget[];
  settings: BusinessSettings;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: BudgetStatus) => void;
}

const BudgetHistory: React.FC<BudgetHistoryProps> = ({ budgets, settings, onDelete, onUpdateStatus }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BudgetStatus | 'todos'>('todos');
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  const filtered = budgets.filter(b => {
    const matchesSearch = b.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const generatePDF = (budget: Budget) => {
    try {
      const doc = new jsPDF();
      const margin = 20;
      
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 50, 'F');
      
      doc.setFillColor(245, 158, 11); // amber-500
      doc.rect(0, 50, 210, 3, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(settings.name?.toUpperCase() || 'MI EMPRESA', margin, 25);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${settings.ownerName} | ${settings.phone}`, margin, 34);
      doc.text(settings.address || '', margin, 39);

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('COTIZACIÓN DE OBRA', 210 - margin, 25, { align: 'right' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Expediente: ${budget.id}`, 210 - margin, 34, { align: 'right' });

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('CLIENTE / PROYECTO:', margin, 65);
      doc.setFont('helvetica', 'normal');
      doc.text(budget.client.name.toUpperCase(), margin, 72);
      doc.text(`Tel: ${budget.client.phone}`, margin, 78);

      doc.setFont('helvetica', 'bold');
      doc.text('INFORMACIÓN TÉCNICA:', 130, 65);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha Emisión: ${new Date(budget.date).toLocaleDateString()}`, 130, 72);
      doc.text(`Vencimiento: ${new Date(budget.validUntil).toLocaleDateString()}`, 130, 78);

      autoTable(doc, {
        startY: 90,
        margin: { left: margin, right: margin },
        head: [['Descripción de Rubros / Materiales', 'Unid.', 'Cant.', 'Precio Unit.', 'Total Rubro']],
        body: budget.items.map(i => [
          i.name.toUpperCase(),
          i.unit.toUpperCase(),
          i.quantity,
          `${settings.currency}${i.price.toLocaleString()}`,
          `${settings.currency}${i.subtotal.toLocaleString()}`
        ]),
        headStyles: { fillColor: [15, 23, 42], fontStyle: 'bold', textColor: [245, 158, 11] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 8, cellPadding: 4 },
      });

      const finalY = (doc as any).lastAutoTable.finalY;
      const rightOffset = 140;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Total Presupuesto:', rightOffset, finalY + 15);
      doc.setFontSize(14);
      doc.text(`${settings.currency}${budget.total.toLocaleString()}`, 210 - margin, finalY + 15, { align: 'right' });

      doc.save(`Presupuesto_${budget.id}_${budget.client.name.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error("PDF Error:", err);
      alert("Error al generar PDF.");
    }
  };

  const sendWhatsApp = (b: Budget) => {
    // Detalle de los Rubros (Items principales)
    const itemsDetail = b.items
      .map(i => `• *${i.name}*\n  ${i.quantity} ${i.unit} x ${settings.currency}${i.price.toLocaleString()} = _${settings.currency}${i.subtotal.toLocaleString()}_`)
      .join('\n\n');

    // Detalle de los Insumos de Campo (Materiales requeridos)
    const materialsDetail = b.requiredMaterials && b.requiredMaterials.length > 0
      ? `\n\n📦 *INSUMOS DE CAMPO REQUERIDOS:*\n` + b.requiredMaterials.map(m => `• ${m.name} [Cantidad: ${m.quantity}]`).join('\n')
      : '';

    const text = `👷 *${settings.name.toUpperCase()} 🏗️*
📋 *COTIZACIÓN TÉCNICA*

🏗️ *Proyecto:* ${b.client.name.toUpperCase()}
📄 *Expediente:* ${b.id}

*DETALLE DE RUBROS:*
${itemsDetail}${materialsDetail}

---------------------------------
💰 *TOTAL PRESUPUESTO:* ${settings.currency}${b.total.toLocaleString()}
---------------------------------

_Presupuesto válido hasta el ${new Date(b.validUntil).toLocaleDateString()}._
Saludos, ${settings.ownerName}.`;

    window.open(`https://wa.me/${b.client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const statusColors = {
    aceptado: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    rechazado: 'text-red-600 bg-red-50 border-red-100',
    pendiente: 'text-amber-600 bg-amber-50 border-amber-100'
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-slate-200 pb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">
            Archivo Técnico <span className="text-amber-500">MyL</span>
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Histórico de expedientes y cotizaciones</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="BUSCAR EXPEDIENTE..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:border-amber-500 w-full sm:w-64 shadow-sm"
            />
          </div>
          <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
             {(['todos', 'pendiente', 'aceptado', 'rechazado'] as const).map(f => (
               <button 
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all ${statusFilter === f ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-900'}`}
               >
                 {f}
               </button>
             ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
           <AlertCircle size={48} className="mx-auto text-slate-200 mb-4" />
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Sin registros que coincidan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-24">
          {filtered.map(b => (
            <div key={b.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group overflow-hidden flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-lg text-slate-500 font-mono italic border border-slate-200">{b.id}</span>
                  <div className="relative group/status">
                    <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${statusColors[b.status]}`}>
                      {b.status}
                    </span>
                    <div className="absolute right-0 top-full mt-1 bg-white shadow-2xl rounded-xl border border-slate-200 p-1 hidden group-hover/status:block z-20">
                      {(['pendiente', 'aceptado', 'rechazado'] as BudgetStatus[]).map(s => (
                        <button key={s} onClick={() => onUpdateStatus(b.id, s)} className="w-full text-left px-3 py-1.5 text-[9px] font-black uppercase hover:bg-slate-50 rounded-lg">{s}</button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <h4 className="text-lg font-black text-slate-900 uppercase italic truncate tracking-tighter mb-2">{b.client?.name || 'SIN NOMBRE'}</h4>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Calendar size={12} />
                    <span className="text-[9px] font-bold uppercase">{new Date(b.date).toLocaleDateString()}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${new Date(b.validUntil) < new Date() ? 'text-red-500' : 'text-slate-400'}`}>
                    <Clock size={12} />
                    <span className="text-[9px] font-bold uppercase">Vence: {new Date(b.validUntil).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Monto Certificado</p>
                    <p className="text-2xl font-black text-slate-900 italic font-mono">{settings.currency}{b.total?.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => setSelectedBudget(b)} className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-900 hover:text-white transition-all"><Eye size={18}/></button>
                    <button onClick={() => generatePDF(b)} className="p-2.5 bg-slate-900 text-amber-500 rounded-xl shadow-lg active:scale-95 transition-transform"><Download size={18}/></button>
                    <button onClick={() => sendWhatsApp(b)} className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-lg active:scale-90 transition-transform"><Send size={18}/></button>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => { if(confirm('¿ELIMINAR ESTE EXPEDIENTE DE FORMA PERMANENTE?')) onDelete(b.id) }} 
                className="w-full py-3 bg-slate-50 text-[9px] font-black text-slate-300 uppercase hover:bg-red-50 hover:text-red-500 border-t border-slate-100 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={12} />
                Borrar del Historial
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedBudget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border-b-[12px] border-slate-900 animate-in zoom-in-95">
            <header className="p-8 border-b border-slate-100 flex justify-between items-center">
               <div>
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.4em] mb-1 block">Certificación Técnica</span>
                  <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{selectedBudget.client?.name}</h3>
               </div>
               <button onClick={() => setSelectedBudget(null)} className="p-4 bg-slate-100 text-slate-400 rounded-2xl hover:bg-slate-200 transition-colors"><X size={28}/></button>
            </header>

            <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar max-h-[70vh]">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <h4 className="text-xs font-black uppercase text-slate-900 italic border-l-4 border-amber-500 pl-3">Detalle de Rubros</h4>
                     <div className="space-y-2">
                        {selectedBudget.items?.map((i, idx) => (
                          <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                             <div>
                                <p className="font-black text-slate-800 uppercase italic text-[11px] leading-tight tracking-tight">{i.name}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{i.quantity} {i.unit} x {settings.currency}{i.price.toLocaleString()}</p>
                             </div>
                             <p className="font-mono text-xs font-black text-slate-900">{settings.currency}{i.subtotal?.toLocaleString()}</p>
                          </div>
                        ))}
                     </div>
                  </div>
                  <div className="space-y-4">
                     <h4 className="text-xs font-black uppercase text-slate-900 italic border-l-4 border-amber-500 pl-3">Insumos Críticos</h4>
                     <div className="bg-slate-950 p-6 rounded-[2rem] text-white">
                        {selectedBudget.requiredMaterials?.length > 0 ? (
                          <div className="space-y-3">
                             {selectedBudget.requiredMaterials.map((m, idx) => (
                               <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate pr-4">{m.name}</span>
                                  <span className="text-[10px] font-mono font-black text-amber-500">[{m.quantity}]</span>
                               </div>
                             ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-600 font-black uppercase text-center py-6 italic tracking-widest">Sin materiales listados</p>
                        )}
                     </div>
                  </div>
               </div>

               <div className="bg-slate-950 p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
                    <HardHat size={120} className="text-white" />
                  </div>
                  <div className="relative z-10 text-center md:text-left">
                     <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1 italic">Liquidación de Obra Final</p>
                     <p className="text-5xl font-black text-white italic tracking-tighter leading-none font-mono">{settings.currency}{selectedBudget.total?.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-3 relative z-10">
                    <button onClick={() => generatePDF(selectedBudget)} className="px-8 py-4 bg-white text-slate-950 rounded-2xl font-black uppercase italic shadow-lg active:scale-95 transition-all text-xs flex items-center gap-3">
                      <Download size={18}/> Descargar PDF
                    </button>
                    <button onClick={() => sendWhatsApp(selectedBudget)} className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase italic shadow-lg active:scale-95 transition-all text-xs flex items-center gap-3">
                      <Send size={18}/> Compartir
                    </button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetHistory;
