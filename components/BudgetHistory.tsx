
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
      const pageWidth = doc.internal.pageSize.width;
      
      // HEADER: ESTILO BLUEPRINT INDUSTRIAL
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 45, 'F');
      doc.setFillColor(245, 158, 11); // amber-500
      doc.rect(0, 45, pageWidth, 2, 'F');

      // TÍTULO DE EMPRESA
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(settings.name?.toUpperCase() || 'MI EMPRESA', margin, 25);
      
      // DATOS CONTACTO (SLATE-400)
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184); 
      doc.text(`${settings.ownerName.toUpperCase()} | TEL: ${settings.phone}`, margin, 34);
      doc.text(settings.address?.toUpperCase() || '', margin, 39);

      // TÍTULO DEL DOCUMENTO
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('CERTIFICACIÓN DE OBRA', pageWidth - margin, 25, { align: 'right' });
      doc.setFontSize(10);
      doc.text(`EXPEDIENTE: ${budget.id}`, pageWidth - margin, 34, { align: 'right' });

      // BLOQUE INFORMACIÓN DEL CLIENTE
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMACIÓN DEL PROYECTO:', margin, 65);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`CLIENTE: ${budget.client.name.toUpperCase()}`, margin, 72);
      doc.text(`TELÉFONO DE OBRA: ${budget.client.phone}`, margin, 77);

      // BLOQUE FECHAS Y VALIDEZ
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('DETALLES TÉCNICOS:', 130, 65);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`FECHA EMISIÓN: ${new Date(budget.date).toLocaleDateString()}`, 130, 72);
      doc.text(`VALIDEZ TÉCNICA HASTA: ${new Date(budget.validUntil).toLocaleDateString()}`, 130, 77);

      // TABLA DE RUBROS (MAESTRA)
      autoTable(doc, {
        startY: 90,
        margin: { left: margin, right: margin },
        head: [['RUBRO / DESCRIPCIÓN TÉCNICA', 'UNID.', 'CANT.', 'P. UNITARIO', 'SUBTOTAL']],
        body: budget.items.map(i => [
          i.name.toUpperCase(),
          i.unit.toUpperCase(),
          i.quantity,
          `${settings.currency}${i.price.toLocaleString()}`,
          `${settings.currency}${i.subtotal.toLocaleString()}`
        ]),
        headStyles: { 
          fillColor: [15, 23, 42], 
          fontStyle: 'bold', 
          textColor: [245, 158, 11], 
          fontSize: 9,
          halign: 'center'
        },
        columnStyles: { 
          0: { cellWidth: 80 },
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'right' },
          4: { halign: 'right', fontStyle: 'bold' } 
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 8, cellPadding: 5, font: 'helvetica' },
        didDrawPage: (data) => {
            // Re-dibujar header si hay varias paginas (opcional con autotable)
        }
      });

      let finalY = (doc as any).lastAutoTable.finalY;

      // TABLA DE INSUMOS DE CAMPO (Si existen)
      if (budget.requiredMaterials && budget.requiredMaterials.length > 0) {
        if (finalY + 40 > doc.internal.pageSize.height) { doc.addPage(); finalY = 20; }
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('INSUMOS Y MATERIALES DE CAMPO:', margin, finalY + 15);
        
        autoTable(doc, {
          startY: finalY + 20,
          margin: { left: margin, right: 80 },
          head: [['MATERIAL / INSUMO REQUERIDO', 'CANTIDAD']],
          body: budget.requiredMaterials.map(m => [m.name.toUpperCase(), m.quantity]),
          headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontSize: 8 },
          styles: { fontSize: 7, cellPadding: 3 },
        });
        finalY = (doc as any).lastAutoTable.finalY;
      }

      // BLOQUE DE LIQUIDACIÓN FINAL
      if (finalY + 60 > doc.internal.pageSize.height) { doc.addPage(); finalY = 20; }
      
      const summaryX = 120;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100);
      
      // Subtotal
      doc.text('SUBTOTAL PLANILLA:', summaryX, finalY + 20);
      doc.setFont('helvetica', 'normal');
      doc.text(`${settings.currency}${budget.subtotal.toLocaleString()}`, pageWidth - margin, finalY + 20, { align: 'right' });

      // Descuento
      if (budget.discount > 0) {
        doc.text(`BONIFICACIÓN (${budget.discount}%):`, summaryX, finalY + 26);
        doc.text(`-${settings.currency}${(budget.subtotal * budget.discount / 100).toLocaleString()}`, pageWidth - margin, finalY + 26, { align: 'right' });
      }

      // IVA / Gastos
      if (budget.taxRate > 0) {
        doc.text(`IVA / GASTOS TÉCNICOS (${budget.taxRate}%):`, summaryX, finalY + 32);
        doc.text(`${settings.currency}${(budget.total - (budget.subtotal * (1 - budget.discount/100))).toLocaleString()}`, pageWidth - margin, finalY + 32, { align: 'right' });
      }

      // RECTÁNGULO DE TOTAL
      doc.setFillColor(15, 23, 42);
      doc.rect(summaryX - 5, finalY + 38, pageWidth - margin - summaryX + 10, 15, 'F');
      
      doc.setTextColor(245, 158, 11);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL INVERSIÓN:', summaryX, finalY + 48);
      doc.text(`${settings.currency}${budget.total.toLocaleString()}`, pageWidth - margin, finalY + 48, { align: 'right' });

      // PIE DE PÁGINA
      const footerY = doc.internal.pageSize.height - 15;
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.setFont('helvetica', 'italic');
      doc.text('Documento oficial de cotización técnica. Precios sujetos a cambios sin previo aviso.', margin, footerY);
      doc.text(`CERTIFICACIÓN MyL - ${budget.id}`, pageWidth - margin, footerY, { align: 'right' });

      doc.save(`Presupuesto_${budget.id}_${budget.client.name.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Error crítico al generar PDF. Verifique los datos del presupuesto.");
    }
  };

  const sendWhatsApp = (b: Budget) => {
    const itemsDetail = b.items.map(i => `• *${i.name.toUpperCase()}*\n  ${i.quantity} ${i.unit} x ${settings.currency}${i.price.toLocaleString()} = _${settings.currency}${i.subtotal.toLocaleString()}_`).join('\n\n');
    const matDetail = b.requiredMaterials?.length ? `\n\n📦 *INSUMOS DE CAMPO:*\n` + b.requiredMaterials.map(m => `• ${m.name.toUpperCase()}: ${m.quantity}`).join('\n') : '';
    const text = `👷 *${settings.name.toUpperCase()}*
📋 *COTIZACIÓN DE OBRA*

🏗️ *Proyecto:* ${b.client.name.toUpperCase()}
📄 *Expediente:* ${b.id}

*RUBROS DETALLADOS:*
${itemsDetail}${matDetail}

---------------------------------
💰 *TOTAL:* ${settings.currency}${b.total.toLocaleString()}
---------------------------------

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
    <div className="space-y-6 animate-in">
      {/* HEADER ARCHIVO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-slate-200 pb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
            ARCHIVO <span className="text-amber-500">TÉCNICO</span>
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2 italic">Gestión Integral de Expedientes</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="BUSCAR PROYECTO O ID..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-[1.25rem] text-xs font-black uppercase outline-none focus:border-amber-500 w-full sm:w-72 shadow-sm transition-all" 
            />
          </div>
          <div className="flex bg-white rounded-2xl border border-slate-200 p-1.5 shadow-sm">
             {(['todos', 'pendiente', 'aceptado', 'rechazado'] as const).map(f => (
               <button 
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${statusFilter === f ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}
               >
                 {f}
               </button>
             ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-32 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
           <AlertCircle size={64} className="mx-auto text-slate-100 mb-6" />
           <p className="text-xs font-black text-slate-300 uppercase tracking-[0.5em] italic">Historial de obra vacío</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
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
                
                <h4 className="text-xl font-black text-slate-900 uppercase italic truncate tracking-tighter mb-3 leading-tight">{b.client.name}</h4>
                
                <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 uppercase mb-8">
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
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Liquidación</p>
                    <p className="text-3xl font-black text-slate-900 italic font-mono tracking-tighter leading-none">{settings.currency}{b.total.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onEdit(b)} title="Negociar Precio" className="p-3.5 bg-slate-900 text-white rounded-2xl hover:bg-amber-500 hover:text-slate-900 transition-all shadow-xl active:scale-90"><Edit3 size={20}/></button>
                    <button onClick={() => generatePDF(b)} title="Descargar PDF" className="p-3.5 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-900 hover:text-amber-500 transition-all"><Download size={20}/></button>
                    <button onClick={() => sendWhatsApp(b)} title="Enviar WhatsApp" className="p-3.5 bg-emerald-500 text-white rounded-2xl shadow-xl active:scale-90 transition-transform"><Send size={20}/></button>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => { if(confirm('¿ELIMINAR ESTE EXPEDIENTE DE FORMA PERMANENTE?')) onDelete(b.id) }} 
                className="w-full py-4 bg-slate-50 text-[10px] font-black text-slate-300 uppercase hover:bg-red-50 hover:text-red-600 border-t border-slate-100 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={14} />
                Eliminar Registro
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BudgetHistory;
