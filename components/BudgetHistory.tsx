import React, { useState, useMemo } from 'react';
import { 
  Search, Trash2, Send, Download, Calendar, Clock, 
  AlertCircle, Edit3, CheckCircle, XCircle, Filter, 
  ChevronRight, FileText, Phone, User, Hash, MoreVertical,
  ArrowUpRight, ExternalLink, Copy, Check
} from 'lucide-react';
import { Budget, BusinessSettings, BudgetStatus, BudgetItem } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BudgetHistoryProps {
  budgets: Budget[];
  settings: BusinessSettings;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: BudgetStatus) => void;
  onEdit: (budget: Budget) => void;
}

const BudgetHistory: React.FC<BudgetHistoryProps> = ({ 
  budgets, 
  settings, 
  onDelete, 
  onUpdateStatus, 
  onEdit 
}) => {
  // --- ESTADOS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BudgetStatus | 'todos'>('todos');
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isCopying, setIsCopying] = useState<string | null>(null);

  // --- LÓGICA DE FILTRADO Y CÁLCULOS ---
  const filtered = useMemo(() => {
    return budgets.filter(b => {
      const searchStr = searchTerm.toLowerCase();
      const matchesSearch = 
        b.client?.name?.toLowerCase().includes(searchStr) || 
        b.id?.toLowerCase().includes(searchStr) ||
        b.client?.phone?.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'todos' || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [budgets, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    return {
      totalAmount: filtered.reduce((acc, b) => acc + b.total, 0),
      count: filtered.length,
      pendingCount: filtered.filter(b => b.status === 'pendiente').length,
      acceptedAmount: filtered.filter(b => b.status === 'aceptado').reduce((acc, b) => acc + b.total, 0)
    };
  }, [filtered]);

  // --- UTILITARIOS DE FORMATO ---
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: settings.currency || 'ARS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const statusColors = {
    aceptado: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    rechazado: 'text-red-600 bg-red-50 border-red-100',
    pendiente: 'text-amber-600 bg-amber-50 border-amber-100'
  };

  // --- EXPORTACIÓN PDF ---
  const handleExportPDF = (budget: Budget) => {
    const doc = new jsPDF();
    const primary = [15, 23, 42]; // Slate 900
    const accent = [245, 158, 11]; // Amber 500

    // Header decorativo
    doc.setFillColor(primary[0], primary[1], primary[2]);
    doc.rect(0, 0, 210, 45, 'F');
    
    // Branding
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.name.toUpperCase(), 20, 25);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('PRESUPUESTO TÉCNICO PROFESIONAL', 20, 32);
    doc.text(`ID: ${budget.id}`, 160, 25);
    doc.text(`FECHA: ${formatDate(budget.date)}`, 160, 32);

    // Datos del Cliente
    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL CLIENTE', 20, 60);
    doc.line(20, 62, 80, 62);
    
    doc.setFontSize(10);
    doc.text(`Nombre: ${budget.client.name}`, 20, 70);
    doc.text(`Teléfono: ${budget.client.phone}`, 20, 76);

    // Tabla de Items
    autoTable(doc, {
      startY: 85,
      head: [['RUBRO / DESCRIPCIÓN', 'CANT.', 'UNITARIO', 'SUBTOTAL']],
      body: budget.items.map(item => [
        item.description.toUpperCase(),
        item.quantity,
        formatCurrency(item.price),
        formatCurrency(item.quantity * item.price)
      ]),
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: primary, textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    });

    // Totales
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFillColor(248, 250, 252);
    doc.rect(130, finalY - 8, 65, 25, 'F');
    
    doc.setFontSize(14);
    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.text('TOTAL FINAL:', 135, finalY + 8);
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.text(formatCurrency(budget.total), 195, finalY + 8, { align: 'right' });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(settings.address || '', 105, 285, { align: 'center' });
    doc.text('Documento generado por Engineering Pro 2026', 105, 290, { align: 'center' });

    doc.save(`PRESUPUESTO_${budget.client.name.replace(/\s+/g, '_')}.pdf`);
  };

  // --- COMUNICACIÓN WHATSAPP ---
  const handleWhatsApp = (budget: Budget) => {
    const text = `*PRESUPUESTO TÉCNICO - ${settings.name}*\n\n` +
      `Hola *${budget.client.name}*, adjuntamos el detalle de la cotización solicitado.\n\n` +
      `*ID:* ${budget.id}\n` +
      `*Total:* ${formatCurrency(budget.total)}\n\n` +
      `Quedamos a su disposición para cualquier consulta técnica.`;
    
    const phone = budget.client.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // --- FUNCIÓN COPIAR ID ---
  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(id);
    setIsCopying(id);
    setTimeout(() => setIsCopying(null), 2000);
  };

  return (
    <div className="space-y-6 animate-slide-up pb-32">
      {/* 1. SECCIÓN DE ESTADÍSTICAS RÁPIDAS (NUEVO) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl shadow-slate-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white/10 rounded-2xl"><FileText className="text-amber-500" size={20}/></div>
            <ArrowUpRight size={16} className="text-slate-500" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Volumen Filtrado</p>
          <h3 className="text-2xl font-black italic tracking-tighter">{formatCurrency(stats.totalAmount)}</h3>
        </div>
        
        <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 rounded-2xl"><Clock className="text-amber-500" size={20}/></div>
            <span className="text-[10px] font-black bg-amber-100 text-amber-600 px-3 py-1 rounded-full">{stats.pendingCount}</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Por Aprobar</p>
          <h3 className="text-2xl font-black italic tracking-tighter text-slate-900">{stats.count} <span className="text-xs font-normal text-slate-400">Proyectos</span></h3>
        </div>

        <div className="bg-emerald-600 p-6 rounded-[2rem] text-white shadow-xl shadow-emerald-100">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white/20 rounded-2xl"><CheckCircle size={20}/></div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Aprobado Real</p>
          <h3 className="text-2xl font-black italic tracking-tighter">{formatCurrency(stats.acceptedAmount)}</h3>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm flex flex-col justify-center items-center group cursor-pointer hover:border-amber-500 transition-all">
          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-2 group-hover:bg-amber-500 group-hover:text-white transition-all">
            <Filter size={20} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Limpiar Filtros</p>
        </div>
      </div>

      {/* 2. HEADER DE CONTROL */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-2 h-12 bg-amber-500 rounded-full"></div>
          <div>
            <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">ARCHIVO <span className="text-amber-500">TÉCNICO</span></h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Historical Construction Database</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" 
              placeholder="BUSCAR POR CLIENTE O CÓDIGO..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-2xl text-[11px] font-black uppercase outline-none focus:border-amber-500 focus:bg-white transition-all shadow-inner"
            />
          </div>

          <div className="flex bg-slate-50 rounded-[1.5rem] p-2 border-2 border-slate-100">
            {(['todos', 'pendiente', 'aceptado', 'rechazado'] as const).map(f => (
              <button 
                key={f} 
                onClick={() => setStatusFilter(f)} 
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${statusFilter === f ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. GRID DE PRESUPUESTOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map(b => (
          <div 
            key={b.id} 
            className="group bg-white rounded-[3rem] border-2 border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col relative overflow-hidden"
          >
            {/* Overlay decorativo de estado */}
            <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-5 transition-transform group-hover:scale-150 ${b.status === 'aceptado' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>

            <div className="p-10 flex-1 relative z-10">
              {/* Header de Tarjeta */}
              <div className="flex justify-between items-start mb-8">
                <div 
                  onClick={() => copyToClipboard(b.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-all border border-slate-100"
                >
                  <Hash size={12} className="text-amber-500" />
                  <span className="text-[10px] font-black text-slate-500 font-mono tracking-tighter uppercase italic">{b.id}</span>
                  {isCopying === b.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-slate-300" />}
                </div>
                <div className="flex gap-1 items-center">
                  <button 
                    onClick={() => onUpdateStatus(b.id, 'aceptado')}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-emerald-50 text-slate-300 hover:text-emerald-500 transition-all"
                  >
                    <CheckCircle size={18} />
                  </button>
                  <span className={`text-[10px] font-black uppercase px-5 py-2 rounded-full border shadow-sm ${statusColors[b.status]}`}>
                    {b.status}
                  </span>
                </div>
              </div>

              {/* Información Cliente */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-black italic">
                      {b.client.name.charAt(0)}
                   </div>
                   <h4 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter truncate leading-none">
                     {b.client.name}
                   </h4>
                </div>
                <div className="flex flex-wrap gap-4 mt-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar size={14} className="text-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{formatDate(b.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone size={14} className="text-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{b.client.phone}</span>
                  </div>
                </div>
              </div>

              {/* Acciones de Exportación */}
              <div className="grid grid-cols-2 gap-3 mb-10">
                <button 
                  onClick={() => handleExportPDF(b)}
                  className="flex items-center justify-center gap-3 py-4 bg-slate-50 text-slate-900 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-900 hover:text-white transition-all border border-slate-100 group/btn"
                >
                  <Download size={16} className="text-amber-500 group-hover/btn:text-white" /> EXPORTAR PDF
                </button>
                <button 
                  onClick={() => handleWhatsApp(b)}
                  className="flex items-center justify-center gap-3 py-4 bg-slate-50 text-slate-900 rounded-2xl text-[10px] font-black uppercase hover:bg-emerald-500 hover:text-white transition-all border border-slate-100 group/btn"
                >
                  <Send size={16} className="text-emerald-500 group-hover/btn:text-white" /> WHATSAPP
                </button>
              </div>

              {/* Footer de Tarjeta / Totales */}
              <div className="flex items-end justify-between border-t-2 border-slate-50 pt-8">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Presupuesto Final</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-black text-amber-500">{settings.currency}</span>
                    <p className="text-3xl font-black text-slate-900 italic tracking-tighter leading-none">
                      {b.total.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => onEdit(b)} 
                    title="EDITAR ESTRUCTURA" 
                    className="w-14 h-14 bg-slate-900 text-white rounded-[1.2rem] flex items-center justify-center hover:bg-amber-500 hover:text-slate-950 transition-all shadow-lg active:scale-90 group/edit"
                  >
                    <Edit3 size={24} className="group-hover/edit:rotate-12 transition-transform" />
                  </button>
                  <button 
                    onClick={() => {
                      if(window.confirm('¿ELIMINAR ESTE REGISTRO DEL ARCHIVO TÉCNICO?')) onDelete(b.id);
                    }} 
                    title="ELIMINAR" 
                    className="w-14 h-14 bg-red-50 text-red-500 rounded-[1.2rem] flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm group/del"
                  >
                    <Trash2 size={24} className="group-hover/del:animate-bounce" />
                  </button>
                </div>
              </div>
            </div>

            {/* Indicador de Hover lateral */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
          </div>
        ))}
      </div>

      {/* 4. ESTADO VACÍO (NUEVO) */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[4rem] border-4 border-dashed border-slate-100">
          <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-8">
             <AlertCircle size={64} className="text-slate-200" />
          </div>
          <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter mb-4">No hay registros</h3>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Ajusta los filtros o realiza una nueva búsqueda</p>
          <button 
            onClick={() => { setSearchTerm(''); setStatusFilter('todos'); }}
            className="mt-10 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase italic text-xs hover:bg-amber-500 hover:text-slate-900 transition-all shadow-xl"
          >
            RESETEAR ARCHIVO
          </button>
        </div>
      )}

      {/* 5. RESUMEN TÉCNICO AL FINAL (NUEVO) */}
      <div className="bg-slate-950 rounded-[3rem] p-12 mt-12 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-10 opacity-10">
            <HardHat size={180} className="text-white" />
         </div>
         <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
               <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-6">REPORTE <span className="text-amber-500">CONSOLIDADO</span></h3>
               <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-md">
                 Sistema de gestión técnica optimizado para la trazabilidad de obras y control de presupuestos. 
                 Todos los montos incluyen impuestos según la configuración de la constructora.
               </p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 grid grid-cols-2 gap-8">
               <div>
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">Proyectos Totales</p>
                  <p className="text-4xl font-black text-white italic">{budgets.length}</p>
               </div>
               <div>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Tasa Aprobación</p>
                  <p className="text-4xl font-black text-white italic">
                    {budgets.length > 0 ? Math.round((budgets.filter(b => b.status === 'aceptado').length / budgets.length) * 100) : 0}%
                  </p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

// Icono decorativo HardHat
const HardHat = ({ size, className }: { size: number, className: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z" />
    <path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" />
    <path d="M4 15v-3a6 6 0 0 1 12 0v3" />
  </svg>
);

export default BudgetHistory;
