
import React, { useState } from 'react';
import { 
  Search, Eye, Trash2, Send, Download, X, 
  Calendar, CheckCircle2, XCircle, Clock, Package, HardHat, FileText
} from 'lucide-react';
import { Budget, BusinessSettings } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BudgetHistoryProps {
  budgets: Budget[];
  settings: BusinessSettings;
  onDelete: (id: string) => void;
}

const BudgetHistory: React.FC<BudgetHistoryProps> = ({ budgets, settings, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  const filtered = budgets.filter(b => b.client.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Eliminar expediente de ${name}?`)) onDelete(id);
  };

  const generatePDF = (budget: Budget) => {
    const doc = new jsPDF();
    const pageWidth = 210;
    const primaryColor = [2, 6, 23]; // slate-950
    const accentColor = [245, 158, 11]; // amber-500
    const grayColor = [148, 163, 184]; // slate-400
    
    // Marco Técnico y Membrete Superior
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 10, 297, 'F'); // Barra lateral estilo plano
    doc.rect(10, 0, 200, 40, 'F');
    
    // Título Documento
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text(settings.name.toUpperCase(), 20, 20);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`${settings.ownerName} | ${settings.phone}`, 20, 28);
    doc.text(settings.address || '', 20, 33);

    // Box ID Expediente
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(150, 10, 50, 20, 'F');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(7);
    doc.text('ID PROYECTO', 175, 16, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(budget.id, 175, 24, { align: 'center' });

    // Información del Cliente / Proyecto
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(10);
    doc.text('ESPECIFICACIONES TÉCNICAS DEL PROYECTO', 20, 55);
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(20, 57, 195, 57);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('CLIENTE:', 20, 65);
    doc.setFont('helvetica', 'bold');
    doc.text(budget.client.name.toUpperCase(), 45, 65);
    
    doc.setFont('helvetica', 'normal');
    doc.text('CONTACTO:', 20, 71);
    doc.text(budget.client.phone, 45, 71);

    doc.text('FECHA EMISIÓN:', 140, 65);
    doc.text(new Date(budget.date).toLocaleDateString(), 195, 65, { align: 'right' });
    doc.text('VALIDEZ HASTA:', 140, 71);
    doc.text(new Date(budget.validUntil).toLocaleDateString(), 195, 71, { align: 'right' });

    // Tabla de Rubros
    autoTable(doc, {
      startY: 85,
      margin: { left: 20, right: 15 },
      head: [['DESCRIPCIÓN DE TAREAS / RUBROS DE INGENIERÍA', 'UNID.', 'CANT.', 'UNITARIO', 'SUBTOTAL']],
      body: budget.items.map(i => [
        i.name.toUpperCase(),
        i.unit.toUpperCase(),
        i.quantity,
        `${settings.currency}${i.price.toLocaleString()}`,
        `${settings.currency}${i.subtotal.toLocaleString()}`
      ]),
      headStyles: { fillColor: primaryColor, textColor: accentColor, fontStyle: 'bold', fontSize: 8, halign: 'center' },
      styles: { fontSize: 8, cellPadding: 4, lineColor: [200, 200, 200], lineWidth: 0.1 },
      columnStyles: { 0: { cellWidth: 80 }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right', fontStyle: 'bold' } },
    });

    let lastY = (doc as any).lastAutoTable.finalY + 10;

    // Sección de Materiales
    if (budget.requiredMaterials && budget.requiredMaterials.length > 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('REQUERIMIENTOS TÉCNICOS DE MATERIALES (INSUMOS)', 20, lastY);
      doc.setDrawColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.line(20, lastY + 2, 120, lastY + 2);
      
      autoTable(doc, {
        startY: lastY + 5,
        margin: { left: 20, right: 90 },
        head: [['ÍTEM INSUMO', 'CANTIDAD']],
        body: budget.requiredMaterials.map(m => [m.name.toUpperCase(), m.quantity.toUpperCase()]),
        headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontSize: 7 },
        styles: { fontSize: 7, cellPadding: 2 },
      });
      lastY = (doc as any).lastAutoTable.finalY + 10;
    }

    // Bloque de Totales al final
    const totalsX = 140;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('SUBTOTAL OBRA:', totalsX, lastY);
    doc.text(`${settings.currency}${budget.subtotal.toLocaleString()}`, 195, lastY, { align: 'right' });
    
    if (budget.discount > 0) {
      lastY += 5;
      doc.text(`BONIFICACIÓN (${budget.discount}%):`, totalsX, lastY);
      doc.text(`-${settings.currency}${((budget.subtotal * budget.discount)/100).toLocaleString()}`, 195, lastY, { align: 'right' });
    }

    lastY += 10;
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(totalsX - 5, lastY - 6, 60, 12, 'F');
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', totalsX, lastY + 2);
    doc.text(`${settings.currency}${budget.total.toLocaleString()}`, 195, lastY + 2, { align: 'right' });

    // Observaciones Legales / Técnicas
    if (budget.client.observations) {
      lastY += 25;
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('CONSIDERACIONES TÉCNICAS:', 20, lastY);
      doc.setFont('helvetica', 'normal');
      doc.text(budget.client.observations, 20, lastY + 5, { maxWidth: 175 });
    }

    // Firma
    const footerY = 280;
    doc.setDrawColor(0);
    doc.line(20, footerY, 80, footerY);
    doc.setFontSize(7);
    doc.text('FIRMA RESPONSABLE TÉCNICO', 20, footerY + 5);
    doc.text(settings.ownerName.toUpperCase(), 20, footerY + 9);

    doc.save(`PROYECTO_${budget.id}.pdf`);
  };

  const sendWhatsApp = (b: Budget) => {
    const text = `👷 *${settings.name.toUpperCase()}* \n\nHola *${b.client.name}*, envío cotización oficial.\n\n🏗️ *ID:* ${b.id}\n💰 *TOTAL:* ${settings.currency}${b.total.toLocaleString()}\n\nAguardamos confirmación.`;
    window.open(`https://wa.me/${b.client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex flex-col gap-6 md:flex-row md:items-center justify-between border-b-2 border-slate-200 pb-8">
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic">ARCHIVO <span className="text-amber-500">OBRAS</span></h2>
        <div className="relative w-full md:w-80">
          <input type="text" placeholder="Buscar expediente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-amber-500 outline-none font-black uppercase italic transition-all shadow-sm" />
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {filtered.map(b => (
          <div key={b.id} className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-200 shadow-sm relative overflow-hidden group flex flex-col h-full hover:border-amber-500 transition-all">
             <div className="flex justify-between items-start mb-6">
                <span className="bg-slate-950 text-amber-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase italic shadow-lg">{b.id}</span>
                {b.status === 'aceptado' ? (
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-full"><CheckCircle2 size={16}/></div>
                ) : b.status === 'rechazado' ? (
                  <div className="p-2 bg-red-50 text-red-600 rounded-full"><XCircle size={16}/></div>
                ) : (
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-full animate-pulse"><Clock size={16}/></div>
                )}
             </div>

             <div className="flex-1">
                <h4 className="text-2xl font-black text-slate-900 uppercase italic leading-none truncate group-hover:text-amber-600 transition-colors">{b.client.name}</h4>
                <div className="mt-4 flex items-center gap-2 text-slate-400 font-bold uppercase text-[9px] tracking-widest">
                  <Calendar size={12}/> {new Date(b.date).toLocaleDateString()}
                </div>
             </div>

             <div className="mt-8 pt-6 border-t border-slate-50">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Inversión Obra</p>
                <p className="text-3xl font-black text-slate-900 italic tracking-tighter leading-none mb-6">{settings.currency}{b.total.toLocaleString()}</p>
                
                <div className="grid grid-cols-3 gap-2">
                   <button onClick={() => setSelectedBudget(b)} className="p-4 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors flex justify-center"><Eye size={18}/></button>
                   <button onClick={() => generatePDF(b)} className="p-4 bg-slate-900 text-amber-500 rounded-xl hover:bg-slate-800 transition-colors flex justify-center shadow-lg"><Download size={18}/></button>
                   <button onClick={() => sendWhatsApp(b)} className="p-4 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors flex justify-center shadow-lg shadow-emerald-100"><Send size={18}/></button>
                </div>
                <button onClick={() => handleDelete(b.id, b.client.name)} className="w-full mt-2 py-2 text-[9px] font-black text-slate-300 uppercase hover:text-red-500 transition-colors">Eliminar Expediente</button>
             </div>
          </div>
        ))}
      </div>

      {/* DETALLE COMPLETO (Modal Pantalla Completa en Móvil) */}
      {selectedBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-0 md:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl md:rounded-[3rem] shadow-2xl h-full md:h-auto overflow-hidden animate-slide-up flex flex-col border-x-[10px] border-slate-950">
            <header className="p-6 md:p-10 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
               <div>
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Expediente Técnico</span>
                  <h3 className="text-3xl md:text-5xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mt-1">{selectedBudget.client.name}</h3>
               </div>
               <button onClick={() => setSelectedBudget(null)} className="p-4 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"><X size={28}/></button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 custom-scrollbar">
               {/* Resumen de Costos */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 md:p-10 rounded-[2rem] border border-slate-100">
                  <div className="space-y-1">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Costo Bruto</p>
                     <p className="text-2xl font-black text-slate-900 italic">{settings.currency}{selectedBudget.subtotal.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bonificación</p>
                     <p className="text-2xl font-black text-red-500 italic">-${((selectedBudget.subtotal * selectedBudget.discount)/100).toLocaleString()}</p>
                  </div>
                  <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
                     <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">TOTAL A PAGAR</p>
                     <p className="text-4xl font-black text-slate-900 italic tracking-tighter leading-none">{settings.currency}{selectedBudget.total.toLocaleString()}</p>
                  </div>
               </div>

               {/* Detalle Items y Materiales */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-4">
                     <h4 className="font-black uppercase italic tracking-widest text-xs flex items-center gap-2"><FileText size={14} className="text-amber-500"/> Planilla de Rubros</h4>
                     <div className="space-y-3">
                        {selectedBudget.items.map((i, idx) => (
                          <div key={idx} className="p-4 rounded-2xl border border-slate-100 flex justify-between items-center hover:bg-slate-50 transition-colors">
                             <div>
                                <p className="font-black text-slate-800 uppercase italic text-sm leading-tight">{i.name}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{i.quantity} {i.unit}</p>
                             </div>
                             <p className="font-mono text-sm font-black text-slate-900 leading-none">{settings.currency}{i.subtotal.toLocaleString()}</p>
                          </div>
                        ))}
                     </div>
                  </div>
                  <div className="space-y-4">
                     <h4 className="font-black uppercase italic tracking-widest text-xs flex items-center gap-2"><Package size={14} className="text-amber-500"/> Insumos de Ejecución</h4>
                     <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl">
                        {selectedBudget.requiredMaterials.length > 0 ? (
                          <div className="grid grid-cols-1 gap-3">
                             {selectedBudget.requiredMaterials.map((m, idx) => (
                               <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                  <span className="text-[11px] font-black text-white uppercase italic truncate pr-4">{m.name}</span>
                                  <span className="text-[10px] font-mono font-black text-amber-500 uppercase shrink-0">{m.quantity}</span>
                               </div>
                             ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-600 font-black uppercase text-center py-4">Sin insumos listados</p>
                        )}
                     </div>
                  </div>
               </div>
            </div>

            <footer className="p-6 md:p-10 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-4 justify-end sticky bottom-0">
                <button onClick={() => generatePDF(selectedBudget)} className="flex-1 md:flex-none py-5 px-10 bg-slate-950 text-amber-500 rounded-2xl font-black uppercase italic shadow-xl flex items-center justify-center gap-3">
                  <Download size={20}/> PDF TÉCNICO
                </button>
                <button onClick={() => sendWhatsApp(selectedBudget)} className="flex-1 md:flex-none py-5 px-10 bg-emerald-600 text-white rounded-2xl font-black uppercase italic shadow-xl flex items-center justify-center gap-3">
                  <Send size={20}/> WHATSAPP
                </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetHistory;
