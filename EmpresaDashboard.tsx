import React, { useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/db';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Building2,
  Scale,
  Leaf,
  CheckCircle2,
  TreeDeciduous,
  FileCheck2,
  ShieldCheck,
  Award,
} from 'lucide-react';

const COLORS = ['#059669', '#0d9488', '#0284c7', '#6366f1', '#d97706', '#dc2626'];

interface EmpresaDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const EmpresaDashboard: React.FC<EmpresaDashboardProps> = ({ onNavigateTab }) => {
  const { currentUser, currentCompany } = useAuth();

  // RLS applied: getRecords(currentUser) returns ONLY approved records of currentCompany
  const approvedRecords = useMemo(() => {
    return db.getRecords(currentUser);
  }, [currentUser]);

  const wasteTypes = useMemo(() => db.getWasteTypes(), []);
  const reports = useMemo(() => db.getMonthlyReports(currentUser), [currentUser]);

  const totalKg = useMemo(() => {
    return approvedRecords.reduce((sum, r) => sum + r.weight_kg, 0);
  }, [approvedRecords]);

  const totalTons = (totalKg / 1000).toFixed(2);
  const co2AvoidedKg = (totalKg * 1.54).toFixed(1);
  const treesEquivalent = Math.round(totalKg * 0.018);

  // Waste breakdown data
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

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-5 sm:p-6 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-emerald-300 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold">
                {currentCompany?.commercial_name || 'Portal del Operador Comercial'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                Punto Autorizado UIO
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 mt-0.5">
              Ubicación: <strong>{currentCompany?.airport_area}</strong> · RUC: {currentCompany?.ruc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('mis-actas')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-emerald-950 text-xs font-bold shadow hover:bg-emerald-50 transition whitespace-nowrap"
          >
            <FileCheck2 className="w-4 h-4 text-emerald-800" />
            <span>Consultar Actas Mensuales ({reports.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Entregado
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {totalTons}
            </span>
            <span className="text-sm font-bold text-emerald-800">Toneladas</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {totalKg.toFixed(1)} kg aprobados oficialmente
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Retiros Validados
            </span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {approvedRecords.length}
            </span>
            <span className="text-sm font-semibold text-slate-400">pesajes</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Con fotografía de báscula verificada
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
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
            Aporte a la neutralidad de carbono del aeropuerto
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Bosque Protegido
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
            Equivalencia en conservación forestal
          </p>
        </div>
      </div>

      {/* Chart and Sustainability Badge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Waste Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Composición de Residuos Reciclables Generados
              </h3>
              <p className="text-[11px] text-slate-500">
                Distribución por material entregado en puntos de acopio
              </p>
            </div>
            <span className="font-mono font-bold text-xs text-emerald-800">
              {totalKg.toFixed(1)} kg total
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={wasteData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
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

        {/* Environmental Certificate Badge Card */}
        <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 rounded-2xl border border-emerald-300 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-900">
              <Award className="w-6 h-6 text-emerald-700" />
              <h4 className="font-bold text-sm">Compromiso Ambiental Quiport</h4>
            </div>

            <p className="text-xs text-emerald-900/90 mt-3 leading-relaxed">
              <strong>{currentCompany?.commercial_name}</strong> cumple con el protocolo de separación en la fuente y entrega trazable de residuos reciclables en el Aeropuerto Mariscal Sucre.
            </p>

            <div className="mt-4 p-3 bg-white/80 backdrop-blur-xs rounded-xl border border-emerald-200 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Estado de Cumplimiento:</span>
                <span className="font-bold text-emerald-800">100% Trazable</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Destino de Residuos:</span>
                <span className="font-bold text-emerald-800">Economía Circular</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-200">
            <button
              onClick={() => onNavigateTab('mis-actas')}
              className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs transition text-center"
            >
              Descargar Actas Certificadas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
