
import React, { useState } from 'react';
import { 
  Search, Eye, Trash2, Send, Download, X, 
  Calendar, CheckCircle2, XCircle, Clock, FileText, HardHat, Package
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

  const generatePDF = (budget: Budget) => {
    const doc = new jsPDF();
    const pageWidth = 210;
    const margin = 15;
    
    // Header Industrial de MyL
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    // Grilla decorativa en header
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.5);
    for(let i=0; i < pageWidth; i+=10) doc.line(i, 0, i, 45);

    doc.setTextColor(245, 158, 11); // amber-500
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text(settings.name.toUpperCase(), margin, 22);
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`${settings.ownerName} | Responsable Técnico`, margin, 30);
    doc.text(`Contacto: ${settings.phone} | ${settings.email}`, margin, 34);
    doc.text(settings.address || '', margin, 38);

    // Box ID Proyecto
    doc.setFillColor(245, 158, 11);
    doc.rect(pageWidth - margin - 50, 15, 50, 18, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(7);
    doc.text('CÓDIGO EXPEDIENTE', pageWidth - margin - 25, 21, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(budget.id, pageWidth - margin - 25, 28, { align: 'center' });

    // Información del Cliente / Obra
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('ESPECIFICACIONES DEL PROYECTO', margin, 58);
    doc.setDrawColor(15, 23, 42);
    doc.line(margin, 60, pageWidth - margin, 60);

    doc.setFont('helvetica', 'normal');
    doc.text('PROYECTO:', margin, 68);
    doc.setFont('helvetica', 'bold');
    doc.text(budget.client.name.toUpperCase(), 40, 68);
    
    doc.setFont('helvetica', 'normal');
    doc.text('TELÉFONO:', margin, 73);
    doc.text(budget.client.phone, 40, 73);

    doc.text('FECHA EMISIÓN:', pageWidth - margin - 70, 68);
    doc.text(new Date(budget.date).toLocaleDateString(), pageWidth - margin, 68, { align: 'right' });
    doc.text('VÁLIDO HASTA:', pageWidth - margin - 70, 73);
    doc.text(new Date(budget.validUntil).toLocaleDateString(), pageWidth - margin, 73, { align: 'right' });

    // Tabla de Rubros Técnicos
    autoTable(doc, {
      startY: 80,
      margin: { left: margin, right: margin },
      head: [['DESCRIPCIÓN TÉCNICA / RUBRO DE OBRA', 'UNID.', 'CANT.', 'UNITARIO', 'SUBTOTAL']],
      body: budget.items.map(i => [
        i.name.toUpperCase(),
        i.unit.toUpperCase(),
        i.quantity,
        `${settings.currency}${i.price.toLocaleString()}`,
        `${settings.currency}${i.subtotal.toLocaleString()}`
      ]),
      headStyles: { fillColor: [15, 23, 42], textColor: [245, 158, 11], fontStyle: 'bold', fontSize: 7, halign: 'center' },
      styles: { fontSize: 7, cellPadding: 3, lineColor: [226, 232, 240], lineWidth: 0.1 },
      columnStyles: { 0: { cellWidth: 85 }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right', fontStyle: 'bold' } },
    });

    let currentY = (doc as any).lastAutoTable.finalY + 10;

    // Sección de Materiales e Insumos
    if (budget.requiredMaterials && budget.requiredMaterials.length > 0) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('LISTADO DE MATERIALES E INSUMOS REQUERIDOS', margin, currentY);
      doc.line(margin, currentY + 2, margin + 80, currentY + 2);
      
      autoTable(doc, {
        startY: currentY + 5,
        margin: { left: margin, right: 100 },
        head: [['INSUMO REQUERIDO', 'CANT.']],
        body: budget.requiredMaterials.map(m => [m.name.toUpperCase(), m.quantity.toUpperCase()]),
        headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontSize: 6 },
        styles: { fontSize: 6, cellPadding: 2 },
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // Bloque de Liquidación
    const totalsX = 140;
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.text('VALOR NETO OBRA:', totalsX, currentY);
    doc.text(`${settings.currency}${budget.subtotal.toLocaleString()}`, pageWidth - margin, currentY, { align: 'right' });
    
    if (budget.discount > 0) {
      currentY += 5;
      doc.text(`BONIFICACIÓN (${budget.discount}%):`, totalsX, currentY);
      doc.text(`-${settings.currency}${((budget.subtotal * budget.discount)/100).toLocaleString()}`, pageWidth - margin, currentY, { align: 'right' });
    }

    currentY += 10;
    doc.setFillColor(15, 23, 42);
    doc.rect(totalsX - 5, currentY - 7, 75, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL PRESUPUESTO:', totalsX, currentY + 1);
    doc.text(`${settings.currency}${budget.total.toLocaleString()}`, pageWidth - margin, currentY + 1, { align: 'right' });

    // Observaciones y Memoria
    if (budget.client.observations) {
      currentY += 25;
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('CONSIDERACIONES TÉCNICAS ADICIONALES:', margin, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(budget.client.observations, margin, currentY + 5, { maxWidth: 180 });
    }

    // Pie de Firma
    const footerY = 275;
    doc.setDrawColor(15, 23, 42);
    doc.line(margin, footerY, margin + 60, footerY);
    doc.setFontSize(6);
    doc.text('FIRMA Y SELLO RESPONSABLE TÉCNICO', margin, footerY + 4);
    doc.text(settings.ownerName.toUpperCase(), margin, footerY + 8);

    doc.save(`MyL_PROYECTO_${budget.id}.pdf`);
  };

  const sendWhatsApp = (b: Budget) => {
    // Generamos el detalle de cada rubro
    const itemsDetail = b.items
      .map(i => `• *${i.name}*\n  ${i.quantity} ${i.unit} x ${settings.currency}${i.price.toLocaleString()} = _${settings.currency}${i.subtotal.toLocaleString()}_`)
      .join('\n\n');

    const text = `👷 *${settings.name.toUpperCase()}*
📋 *COTIZACIÓN TÉCNICA*

🏗️ *Proyecto:* ${b.client.name.toUpperCase()}
📄 *Expediente:* ${b.id}

*DETALLE DE RUBROS:*
${itemsDetail}

---------------------------------
💰 *TOTAL PRESUPUESTO:* ${settings.currency}${b.total.toLocaleString()}
---------------------------------

_Presupuesto válido hasta el ${new Date(b.validUntil).toLocaleDateString()}._
Saludos, ${settings.ownerName}.`;

    window.open(`https://wa.me/${b.client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <h2 className="text-xl font-black text-slate-900 uppercase italic">Archivo de <span className="text-amber-500">Expedientes</span></h2>
        <div className="relative w-full md:w-80">
          <input type="text" placeholder="Buscar por cliente o código..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-amber-500 outline-none font-bold uppercase transition-all shadow-sm" />
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-20">
        {filtered.map(b => (
          <div key={b.id} className="bg-white p-5 rounded-xl border-l-4 border-slate-900 shadow-sm group hover:border-amber-500 transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200 uppercase">{b.id}</span>
              {b.status === 'aceptado' ? (
                <CheckCircle2 size={18} className="text-emerald-500"/>
              ) : b.status === 'rechazado' ? (
                <XCircle size={18} className="text-red-500"/>
              ) : (
                <Clock size={18} className="text-amber-500 animate-pulse"/>
              )}
            </div>
            <h4 className="text-sm font-black text-slate-900 uppercase italic truncate mb-4">{b.client.name}</h4>
            <div className="flex justify-between items-end border-t border-slate-50 pt-4">
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Monto Total</p>
                <p className="text-xl font-black text-slate-900 italic font-mono">{settings.currency}{b.total.toLocaleString()}</p>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => setSelectedBudget(b)} className="p-2.5 bg-slate-50 text-slate-500 rounded-lg hover:bg-slate-100"><Eye size={18}/></button>
                <button onClick={() => generatePDF(b)} className="p-2.5 bg-slate-900 text-amber-500 rounded-lg shadow-lg active:scale-90 transition-transform"><Download size={18}/></button>
                <button onClick={() => sendWhatsApp(b)} className="p-2.5 bg-emerald-500 text-white rounded-lg shadow-lg active:scale-90 transition-transform"><Send size={18}/></button>
              </div>
            </div>
            <button onClick={() => onDelete(b.id)} className="w-full mt-4 py-2 text-[9px] font-black text-slate-300 uppercase hover:text-red-500 transition-colors">Eliminar Registro</button>
          </div>
        ))}
      </div>

      {/* Modal Detalle Expediente */}
      {selectedBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 md:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border-b-[10px] border-slate-900 animate-in">
            <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <div>
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Detalle Técnico</span>
                  <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mt-1">{selectedBudget.client.name}</h3>
               </div>
               <button onClick={() => setSelectedBudget(null)} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-400"><X size={24}/></button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Rubros */}
                  <div className="space-y-4">
                     <div className="flex items-center gap-2">
                        <FileText size={16} className="text-amber-500" />
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Planilla de Rubros</h4>
                     </div>
                     <div className="space-y-2">
                        {selectedBudget.items.map((i, idx) => (
                          <div key={idx} className="p-3 rounded-xl border border-slate-100 flex justify-between items-center bg-slate-50/50">
                             <div>
                                <p className="font-black text-slate-800 uppercase italic text-[11px] leading-tight">{i.name}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{i.quantity} {i.unit} x {settings.currency}{i.price.toLocaleString()}</p>
                             </div>
                             <p className="font-mono text-xs font-black text-slate-900 italic">{settings.currency}{i.subtotal.toLocaleString()}</p>
                          </div>
                        ))}
                     </div>
                  </div>
                  {/* Insumos */}
                  <div className="space-y-4">
                     <div className="flex items-center gap-2">
                        <Package size={16} className="text-amber-500" />
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Insumos de Ejecución</h4>
                     </div>
                     <div className="bg-slate-900 p-5 rounded-xl shadow-inner">
                        {selectedBudget.requiredMaterials.length > 0 ? (
                          <div className="space-y-3">
                             {selectedBudget.requiredMaterials.map((m, idx) => (
                               <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase italic truncate pr-4">{m.name}</span>
                                  <span className="text-[10px] font-mono font-black text-amber-500 uppercase shrink-0">[{m.quantity}]</span>
                               </div>
                             ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-600 font-black uppercase text-center py-4 italic tracking-widest">Sin insumos listados</p>
                        )}
                     </div>
                  </div>
               </div>

               {/* Resumen Final */}
               <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="text-center md:text-left">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monto de Liquidación</p>
                     <p className="text-5xl font-black text-slate-900 italic tracking-tighter leading-none">{settings.currency}{selectedBudget.total.toLocaleString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => generatePDF(selectedBudget)} className="px-8 py-4 bg-slate-900 text-amber-500 rounded-xl font-black uppercase italic shadow-lg active:scale-95 transition-all text-sm flex items-center gap-3">
                      <Download size={18}/> Descargar PDF
                    </button>
                    <button onClick={() => sendWhatsApp(selectedBudget)} className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-black uppercase italic shadow-lg active:scale-95 transition-all text-sm flex items-center gap-3">
                      <Send size={18}/> WhatsApp
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
