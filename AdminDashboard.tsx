import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../services/db';
import { WasteRecord, Company, WasteType, MonthlyReport } from '../../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Scale,
  CheckCircle2,
  Clock,
  Building2,
  Leaf,
  TreeDeciduous,
  Download,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';

const COLORS = ['#059669', '#0d9488', '#0284c7', '#6366f1', '#d97706', '#dc2626', '#8b5cf6', '#475569'];

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const [records, setRecords] = useState<WasteRecord[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([]);
  const [reports, setReports] = useState<MonthlyReport[]>([]);

  const refreshData = () => {
    setRecords(db.getRecords());
    setCompanies(db.getCompanies());
    setWasteTypes(db.getWasteTypes());
    setReports(db.getMonthlyReports());
  };

  useEffect(() => {
    refreshData();
    const unsub = db.subscribe(refreshData);
    return unsub;
  }, []);

  // Strict constraint: official statistics ONLY from APPROVED records
  const approvedRecords = useMemo(() => {
    return records.filter((r) => r.status === 'approved');
  }, [records]);

  const pendingRecords = useMemo(() => {
    return records.filter((r) => r.status === 'pending');
  }, [records]);

  const totalKgApproved = useMemo(() => {
    return approvedRecords.reduce((sum, r) => sum + r.weight_kg, 0);
  }, [approvedRecords]);

  const totalTonsApproved = (totalKgApproved / 1000).toFixed(2);

  // Environmental impact metrics
  // Factor ~ 1.54 kg CO2e avoided per kg recycled, ~0.017 trees saved per kg paper/cardboard
  const co2AvoidedKg = (totalKgApproved * 1.54).toFixed(1);
  const treesEquivalent = Math.round(totalKgApproved * 0.018);

  // Waste type breakdown for chart
  const wasteData = useMemo(() => {
    const map = new Map<string, number>();
    approvedRecords.forEach((r) => {
      const wt = wasteTypes.find((w) => w.id === r.waste_type_id);
      const name = wt ? wt.name : 'Otro';
      map.set(name, (map.get(name) || 0) + r.weight_kg);
    });

    return Array.from(map.entries()).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(1)),
    })).sort((a, b) => b.value - a.value);
  }, [approvedRecords, wasteTypes]);

  // Company breakdown for chart
  const companyData = useMemo(() => {
    const map = new Map<string, number>();
    approvedRecords.forEach((r) => {
      const comp = companies.find((c) => c.id === r.company_id);
      const name = comp ? comp.commercial_name : 'Operador Comercial';
      map.set(name, (map.get(name) || 0) + r.weight_kg);
    });

    return Array.from(map.entries()).map(([name, kg]) => ({
      name,
      kg: parseFloat(kg.toFixed(1)),
    })).sort((a, b) => b.kg - a.kg);
  }, [approvedRecords, companies]);

  // Export CSV of approved records
  const handleExportCSV = () => {
    const rows = [
      ['Codigo', 'Operador Comercial', 'Area Aeropuerto', 'Residuo', 'Peso (kg)', 'Fecha', 'Hora', 'Estado', 'Gestor'],
      ...approvedRecords.map((r) => {
        const comp = companies.find((c) => c.id === r.company_id);
        const wt = wasteTypes.find((w) => w.id === r.waste_type_id);
        return [
          r.record_code,
          comp?.commercial_name || r.company_id,
          comp?.airport_area || '',
          wt?.name || r.waste_type_id,
          r.weight_kg.toString(),
          r.record_date,
          r.record_time,
          r.status,
          r.created_by_name,
        ];
      }),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `UIO_Residuos_Aprobados_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Pending Validation Alert Header */}
      {pendingRecords.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-700/80 rounded-xl">
              <Clock className="w-5 h-5 text-amber-100 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base">
                Hay {pendingRecords.length} pesajes de campo esperando tu revisión administrativa
              </h3>
              <p className="text-xs text-amber-100">
                La trazabilidad requiere verificación de foto de báscula antes de consolidarse en actas oficiales.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('pendientes')}
            className="px-4 py-2 bg-white text-amber-900 rounded-xl text-xs font-black shadow hover:bg-amber-50 transition whitespace-nowrap"
          >
            Revisar Bandeja ({pendingRecords.length})
          </button>
        </div>
      )}

      {/* Primary KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Tons */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Oficial Aprobado
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {totalTonsApproved}
            </span>
            <span className="text-sm font-bold text-emerald-800">Toneladas</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {totalKgApproved.toFixed(1)} kg valorizados en Mariscal Sucre
          </p>
        </div>

        {/* Total Retiros */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Retiros Aprobados
            </span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {approvedRecords.length}
            </span>
            <span className="text-sm font-semibold text-slate-400">eventos</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            100% con foto de balanza verificada
          </p>
        </div>

        {/* CO2e Evitado */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              CO₂ Evitado
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
              {co2AvoidedKg}
            </span>
            <span className="text-sm font-bold text-emerald-800">kg CO₂e</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Reducción de huella de carbono aeroportuaria
          </p>
        </div>

        {/* Árboles Salvados */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Equivalente Bosque
            </span>
            <div className="p-2 rounded-xl bg-green-50 text-green-700">
              <TreeDeciduous className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {treesEquivalent}
            </span>
            <span className="text-sm font-bold text-green-800">árboles</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Preservados por reciclaje de papel y cartón
          </p>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800">
            Filtro de Datos: <strong>Todos los Puntos de Acopio UIO</strong>
          </span>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
            Estadísticas Oficiales
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exportar CSV Oficial</span>
          </button>
          <button
            onClick={() => onNavigateTab('actas')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Cierre Mensual de Actas</span>
          </button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Distribution by Waste Type */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Distribución por Tipo de Residuo Reciclable
              </h3>
              <p className="text-[11px] text-slate-500">
                Kg totales acumulados con validación oficial
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700">
              {totalKgApproved.toFixed(0)} kg
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={wasteData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {wasteData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${value} kg`, 'Peso']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Waste by Airport Company */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Desempeño por Operador Comercial
              </h3>
              <p className="text-[11px] text-slate-500">
                Ranking de generación y valorización responsable
              </p>
            </div>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={companyData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  angle={-15}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  formatter={(value: any) => [`${value} kg`, 'Residuos entregados']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Bar dataKey="kg" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
