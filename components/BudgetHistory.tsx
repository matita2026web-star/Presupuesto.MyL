
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
      
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 45, 'F');
      doc.setFillColor(245, 158, 11); // amber-500
      doc.rect(0, 45, pageWidth, 2, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(settings.name?.toUpperCase() || 'MI EMPRESA', margin, 25);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184); 
      doc.text(`${settings.ownerName.toUpperCase()} | ${settings.phone}`, margin, 34);
      doc.text(settings.address?.toUpperCase() || '', margin, 39);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text('PRESUPUESTO TÉCNICO', pageWidth - margin, 25, { align: 'right' });
      doc.setFontSize(10);
      doc.text(`EXP: ${budget.id}`, pageWidth - margin, 34, { align: 'right' });

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('CLIENTE / PROYECTO:', margin, 65);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(budget.client.name.toUpperCase(), margin, 72);
      doc.text(`CONTACTO: ${budget.client.phone}`, margin, 77);

      doc.setFont('helvetica', 'bold');
      doc.text('DETALLES DE EMISIÓN:', 130, 65);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`FECHA: ${new Date(budget.date).toLocaleDateString()}`, 130, 72);
      doc.text(`VALIDEZ: ${new Date(budget.validUntil).toLocaleDateString()}`, 130, 77);

      autoTable(doc, {
        startY: 90,
        margin: { left: margin, right: margin },
        head: [['DESCRIPCIÓN DE RUBRO / TAREA', 'UNID.', 'CANT.', 'UNITARIO', 'SUBTOTAL']],
        body: budget.items.map(i => [
          i.name.toUpperCase(),
          i.unit.toUpperCase(),
          i.quantity,
          `${settings.currency}${i.price.toLocaleString()}`,
          `${settings.currency}${i.subtotal.toLocaleString()}`
        ]),
        headStyles: { fillColor: [15, 23, 42], fontStyle: 'bold', textColor: [245, 158, 11], fontSize: 9 },
        columnStyles: { 4: { halign: 'right', fontStyle: 'bold' }, 3: { halign: 'right' }, 2: { halign: 'center' } },
        styles: { fontSize: 8, cellPadding: 5 },
      });

      let finalY = (doc as any).lastAutoTable.finalY;

      if (budget.requiredMaterials && budget.requiredMaterials.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('INSUMOS REQUERIDOS:', margin, finalY + 15);
        autoTable(doc, {
          startY: finalY + 20,
          margin: { left: margin, right: 60 },
          body: budget.requiredMaterials.map(m => [m.name.toUpperCase(), m.quantity]),
          styles: { fontSize: 7, cellPadding: 3 },
        });
        finalY = (doc as any).lastAutoTable.finalY;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL FINAL:', 130, finalY + 20);
      doc.text(`${settings.currency}${budget.total.toLocaleString()}`, pageWidth - margin, finalY + 20, { align: 'right' });

      doc.save(`Presupuesto_${budget.id}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Error al generar PDF.");
    }
  };

  const sendWhatsApp = (b: Budget) => {
    const itemsDetail = b.items.map(i => `• *${i.name}*: ${i.quantity} x ${settings.currency}${i.price.toLocaleString()}`).join('\n');
    const matDetail = b.requiredMaterials?.length ? `\n\n*INSUMOS:*\n` + b.requiredMaterials.map(m => `• ${m.name}: ${m.quantity}`).join('\n') : '';
    const text = `👷 *${settings.name.toUpperCase()}*\n📋 *EXPEDIENTE:* ${b.id}\n🏗️ *PROYECTO:* ${b.client.name.toUpperCase()}\n\n*RUBROS:*\n${itemsDetail}${matDetail}\n\n💰 *TOTAL:* ${settings.currency}${b.total.toLocaleString()}\n\n_Saludos, ${settings.ownerName}_`;
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
          <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Archivo Técnico <span className="text-amber-500">MyL</span></h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Gestión de expedientes históricos</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="BUSCAR..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:border-amber-500 w-48 shadow-sm" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-24">
        {filtered.map(b => (
          <div key={b.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group overflow-hidden flex flex-col">
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-lg text-slate-500 font-mono italic">{b.id}</span>
                <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${statusColors[b.status]}`}>{b.status}</span>
              </div>
              <h4 className="text-lg font-black text-slate-900 uppercase italic truncate tracking-tighter mb-2">{b.client.name}</h4>
              <div className="flex items-center gap-4 text-[9px] font-bold text-slate-400 uppercase mb-6">
                <Calendar size={12} /> {new Date(b.date).toLocaleDateString()}
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Obra</p>
                  <p className="text-2xl font-black text-slate-900 italic font-mono">{settings.currency}{b.total.toLocaleString()}</p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => onEdit(b)} className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-amber-500 hover:text-slate-900 transition-all"><Edit3 size={18}/></button>
                  <button onClick={() => generatePDF(b)} className="p-2.5 bg-slate-900 text-amber-500 rounded-xl shadow-lg"><Download size={18}/></button>
                  <button onClick={() => sendWhatsApp(b)} className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-lg"><Send size={18}/></button>
                </div>
              </div>
            </div>
            <button onClick={() => { if(confirm('¿ELIMINAR EXPEDIENTE?')) onDelete(b.id) }} className="w-full py-3 bg-slate-50 text-[9px] font-black text-slate-300 uppercase hover:bg-red-50 hover:text-red-500 border-t border-slate-100 transition-all">Borrar Registro</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BudgetHistory;
