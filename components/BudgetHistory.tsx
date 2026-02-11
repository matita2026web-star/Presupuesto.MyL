
import React, { useState } from 'react';
import { 
  Search, Eye, Trash2, Send, Download, X, Calendar, 
  CheckCircle2, XCircle, Clock, AlertCircle, FileText, Filter, HardHat, Edit3
} from 'lucide-react';
import { Budget, BusinessSettings, BudgetStatus } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BudgetHistoryProps {
  budgets: Budget[];
  settings: BusinessSettings;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: BudgetStatus) => void;
  onEdit: (budget: Budget) => void;
}

const BudgetHistory: React.FC<BudgetHistoryProps> = ({ budgets, settings, onDelete, onUpdateStatus, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BudgetStatus | 'todos'>('todos');

  const filtered = budgets.filter(b => {
    const matchesSearch = b.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const generatePDF = (budget: Budget) => {
    try {
      const doc = new jsPDF();
      const margin = 15;
      const pageWidth = doc.internal.pageSize.width;
      
      // ESTILO DE PLANO INDUSTRIAL (HEADER)
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      // LÍNEA DE ACENTO AMBER
      doc.setFillColor(245, 158, 11); // amber-500
      doc.rect(0, 45, pageWidth, 2.5, 'F');

      // LOGOTIPO / NOMBRE EMPRESA
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(settings.name?.toUpperCase() || 'MI EMPRESA', margin, 22);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`${settings.ownerName.toUpperCase()} | TEL: ${settings.phone}`, margin, 30);
      doc.text(settings.address?.toUpperCase() || '', margin, 35);

      // TÍTULO DEL DOCUMENTO Y NRO DE EXPEDIENTE
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('CERTIFICACIÓN DE OBRA', pageWidth - margin, 22, { align: 'right' });
      doc.setFontSize(11);
      doc.setTextColor(245, 158, 11);
      doc.text(`EXPEDIENTE: ${budget.id}`, pageWidth - margin, 31, { align: 'right' });

      // BLOQUE DE DATOS TÉCNICOS (CLIENTE / PROYECTO)
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMACIÓN DEL PROYECTO:', margin, 65);
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.line(margin, 67, pageWidth - margin, 67);

      doc.setFont('helvetica', 'normal');
      doc.text(`CLIENTE: ${budget.client.name.toUpperCase()}`, margin, 75);
      doc.text(`WHATSAPP DE CONTACTO: ${budget.client.phone}`, margin, 81);

      doc.setFont('helvetica', 'bold');
      doc.text('CRONOGRAMA Y VALIDEZ:', 130, 75);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`FECHA DE EMISIÓN: ${new Date(budget.date).toLocaleDateString()}`, 130, 81);
      doc.text(`VALIDEZ TÉCNICA HASTA: ${new Date(budget.validUntil).toLocaleDateString()}`, 130, 86);

      // TABLA MAESTRA DE RUBROS
      autoTable(doc, {
        startY: 95,
        margin: { left: margin, right: margin },
        head: [['DESCRIPCIÓN DE TAREA / RUBRO TÉCNICO', 'UNID.', 'CANT.', 'P. UNITARIO', 'SUBTOTAL']],
        body: budget.items.map(i => [
          i.name.toUpperCase(),
          i.unit.toUpperCase(),
          i.quantity.toFixed(2),
          `${settings.currency}${i.price.toLocaleString()}`,
          `${settings.currency}${i.subtotal.toLocaleString()}`
        ]),
        headStyles: { 
          fillColor: [15, 23, 42], 
          textColor: [245, 158, 11], 
          fontSize: 9, 
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: { 
          0: { cellWidth: 'auto' }, 
          1: { halign: 'center', cellWidth: 15 },
          2: { halign: 'center', cellWidth: 15 },
          3: { halign: 'right', cellWidth: 30 },
          4: { halign: 'right', fontStyle: 'bold', cellWidth: 35 } 
        },
        styles: { fontSize: 8, cellPadding: 5, font: 'helvetica' },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });

      let finalY = (doc as any).lastAutoTable.finalY;

      // INSUMOS DE CAMPO (SI EXISTEN)
      if (budget.requiredMaterials && budget.requiredMaterials.length > 0) {
        if (finalY + 45 > doc.internal.pageSize.height) { doc.addPage(); finalY = 15; }
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('REQUERIMIENTOS DE MATERIALES:', margin, finalY + 15);
        
        autoTable(doc, {
          startY: finalY + 20,
          margin: { left: margin, right: 80 },
          head: [['INSUMO / MATERIAL REQUERIDO', 'CANTIDAD']],
          body: budget.requiredMaterials.map(m => [m.name.toUpperCase(), m.quantity]),
          headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontSize: 8 },
          styles: { fontSize: 7.5, cellPadding: 3 }
        });
        finalY = (doc as any).lastAutoTable.finalY;
      }

      // RESUMEN ECONÓMICO FINAL
      if (finalY + 60 > doc.internal.pageSize.height) { doc.addPage(); finalY = 15; }
      
      const sumX = 120;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100);
      
      doc.text('SUBTOTAL PLANILLA:', sumX, finalY + 20);
      doc.setFont('helvetica', 'normal');
      doc.text(`${settings.currency}${budget.subtotal.toLocaleString()}`, pageWidth - margin, finalY + 20, { align: 'right' });

      if (budget.discount > 0) {
        doc.text(`BONIFICACIÓN (${budget.discount}%):`, sumX, finalY + 26);
        doc.text(`-${settings.currency}${(budget.subtotal * budget.discount / 100).toLocaleString()}`, pageWidth - margin, finalY + 26, { align: 'right' });
      }

      if (budget.taxRate > 0) {
        doc.text(`IVA / GASTOS (${budget.taxRate}%):`, sumX, finalY + 32);
        const taxVal = budget.total - (budget.subtotal * (1 - budget.discount/100));
        doc.text(`${settings.currency}${taxVal.toLocaleString()}`, pageWidth - margin, finalY + 32, { align: 'right' });
      }

      // TOTAL DESTACADO (CAJA BLUEPRINT)
      doc.setFillColor(15, 23, 42);
      doc.rect(sumX - 5, finalY + 38, pageWidth - margin - sumX + 10, 16, 'F');
      doc.setTextColor(245, 158, 11);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('INVERSIÓN DE OBRA:', sumX, finalY + 49);
      doc.text(`${settings.currency}${budget.total.toLocaleString()}`, pageWidth - margin, finalY + 49, { align: 'right' });

      // FIRMA Y PIE DE PÁGINA
      const footerY = doc.internal.pageSize.height - 20;
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
      
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.setFont('helvetica', 'italic');
      doc.text('Este documento oficial es una certificación técnica de costos sujetos a revisión por condiciones de mercado.', margin, footerY + 3);
      doc.setFont('helvetica', 'bold');
      doc.text(`CERTIFICACIÓN MyL ID: ${budget.id}`, pageWidth - margin, footerY + 3, { align: 'right' });

      doc.save(`Certificacion_Obra_${budget.id}_${budget.client.name.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Error crítico al generar PDF. Verifique los datos del expediente.");
    }
  };

  const sendWhatsApp = (b: Budget) => {
    const text = `👷 *${settings.name.toUpperCase()}*
📋 *COTIZACIÓN DE OBRA*
🏗️ *Proyecto:* ${b.client.name.toUpperCase()}
📄 *Expediente:* ${b.id}
💰 *TOTAL CERTIFICADO:* ${settings.currency}${b.total.toLocaleString()}

_Válido hasta el ${new Date(b.validUntil).toLocaleDateString()}._
Saludos, ${settings.ownerName}.`;
    window.open(`https://wa.me/${b.client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const statusColors = {
    aceptado: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    rechazado: 'text-red-600 bg-red-50 border-red-100',
    pendiente: 'text-amber-600 bg-amber-50 border-amber-100'
  };

  return (
    <div className="space-y-6 animate-in pb-20">
      {/* Header del Archivo Histórico */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-slate-200 pb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
            ARCHIVO <span className="text-amber-500">TÉCNICO</span>
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 italic">Control y Gestión de Obras Emitidas</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="BUSCAR EXPEDIENTE..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-12 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-xs font-black uppercase outline-none focus:border-amber-500 w-full sm:w-64 shadow-sm transition-all" 
            />
          </div>
          <div className="flex bg-white rounded-2xl border-2 border-slate-100 p-1.5 shadow-sm">
             {(['todos', 'pendiente', 'aceptado', 'rechazado'] as const).map(f => (
               <button 
                key={f} 
                onClick={() => setStatusFilter(f)} 
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${statusFilter === f ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 {f}
               </button>
             ))}
          </div>
        </div>
      </div>

      {/* Grid de Expedientes */}
      {filtered.length === 0 ? (
        <div className="py-32 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
           <AlertCircle size={64} className="mx-auto text-slate-100 mb-6" />
           <p className="text-xs font-black text-slate-300 uppercase tracking-[0.4em] italic">Sin expedientes en el archivo</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(b => (
            <div key={b.id} className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group overflow-hidden flex flex-col">
              <div className="p-8 flex-1">
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-black bg-slate-100 px-4 py-1.5 rounded-xl text-slate-500 font-mono italic tracking-tighter">{b.id}</span>
                  <div className="relative group/status">
                    <span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full border shadow-sm ${statusColors[b.status]}`}>{b.status}</span>
                    <div className="absolute right-0 top-full mt-2 bg-slate-900 shadow-2xl rounded-2xl p-2 hidden group-hover/status:block z-30 animate-in zoom-in-95">
                      {(['pendiente', 'aceptado', 'rechazado'] as BudgetStatus[]).map(s => (
                        <button key={s} onClick={() => onUpdateStatus(b.id, s)} className="w-full text-left px-4 py-2 text-[10px] font-black uppercase text-slate-400 hover:text-amber-500 hover:bg-white/5 rounded-xl transition-colors">{s}</button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <h4 className="text-xl font-black text-slate-900 uppercase italic truncate tracking-tighter mb-4 leading-tight">{b.client.name}</h4>
                
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase mb-8">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-300" /> 
                    {new Date(b.date).toLocaleDateString()}
                  </div>
                  <div className={`flex items-center gap-2 ${new Date(b.validUntil) < new Date() ? 'text-red-500' : ''}`}>
                    <Clock size={14} className={new Date(b.validUntil) < new Date() ? 'text-red-500' : 'text-slate-300'} />
                    {new Date(b.validUntil).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-end justify-between border-t border-slate-50 pt-6">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Liquidación Obra</p>
                    <p className="text-3xl font-black text-slate-900 italic font-mono tracking-tighter leading-none">{settings.currency}{b.total.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onEdit(b)} title="Editar Expediente" className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-amber-500 hover:text-slate-900 transition-all shadow-xl active:scale-90">
                      <Edit3 size={20}/>
                    </button>
                    <button onClick={() => generatePDF(b)} title="Exportar PDF Técnico" className="p-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-900 hover:text-amber-500 transition-all border border-slate-200">
                      <Download size={20}/>
                    </button>
                    <button onClick={() => sendWhatsApp(b)} title="Enviar por WhatsApp" className="p-4 bg-emerald-500 text-white rounded-2xl shadow-xl active:scale-90 transition-transform">
                      <Send size={20}/>
                    </button>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => { if(confirm('¿BORRAR EXPEDIENTE DEFINITIVAMENTE?')) onDelete(b.id) }} 
                className="w-full py-4 bg-slate-50 text-[10px] font-black text-slate-300 uppercase hover:bg-red-50 hover:text-red-600 border-t border-slate-100 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={14} /> Eliminar Registro
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BudgetHistory;
