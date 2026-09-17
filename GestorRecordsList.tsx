import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/db';
import { WasteRecord, WasteType, Company } from '../../types';
import { PhotoViewerModal } from '../common/PhotoViewerModal';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Scale,
  Calendar,
  Building,
} from 'lucide-react';

export const GestorRecordsList: React.FC = () => {
  const { currentUser } = useAuth();
  const [records, setRecords] = useState<WasteRecord[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhotoRecord, setSelectedPhotoRecord] = useState<WasteRecord | null>(null);

  const refreshData = () => {
    setRecords(db.getRecords(currentUser));
    setCompanies(db.getCompanies());
    setWasteTypes(db.getWasteTypes());
  };

  useEffect(() => {
    refreshData();
    const unsub = db.subscribe(refreshData);
    return unsub;
  }, [currentUser]);

  const filteredRecords = records.filter((rec) => {
    if (statusFilter !== 'all' && rec.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const comp = companies.find((c) => c.id === rec.company_id);
      const wt = wasteTypes.find((w) => w.id === rec.waste_type_id);
      const matchCode = rec.record_code.toLowerCase().includes(q);
      const matchComp = comp?.commercial_name.toLowerCase().includes(q) || false;
      const matchWaste = wt?.name.toLowerCase().includes(q) || false;
      if (!matchCode && !matchComp && !matchWaste) return false;
    }
    return true;
  });

  const pendingCount = records.filter((r) => r.status === 'pending').length;
  const approvedCount = records.filter((r) => r.status === 'approved').length;
  const rejectedCount = records.filter((r) => r.status === 'rejected').length;
  const totalKg = records.reduce((acc, r) => acc + r.weight_kg, 0);

  return (
    <div className="space-y-4">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Retiros
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1 block">
            {records.length}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">{totalKg.toFixed(1)} kg registrados</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Pendientes
          </span>
          <span className="text-xl sm:text-2xl font-black text-amber-600 font-mono mt-1 block">
            {pendingCount}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">En espera de Quiport</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Aprobados
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono mt-1 block">
            {approvedCount}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Oficiales para acta</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Rechazados
          </span>
          <span className="text-xl sm:text-2xl font-black text-rose-700 font-mono mt-1 block">
            {rejectedCount}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Excluidos con motivo</span>
        </div>
      </div>

      {/* Filters and search bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código, operador comercial o tipo de residuo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Status Pill Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { key: 'all', label: 'Todos' },
              { key: 'pending', label: 'Pendientes' },
              { key: 'approved', label: 'Aprobados' },
              { key: 'rejected', label: 'Rechazados' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => setStatusFilter(item.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === item.key
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Records List / Cards */}
      <div className="space-y-2.5">
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            No se encontraron registros que coincidan con los filtros seleccionados.
          </div>
        ) : (
          filteredRecords.map((rec) => {
            const comp = companies.find((c) => c.id === rec.company_id);
            const wt = wasteTypes.find((w) => w.id === rec.waste_type_id);

            return (
              <div
                key={rec.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                {/* Left info: code, company, waste, time */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Photo thumbnail */}
                  <div
                    onClick={() => setSelectedPhotoRecord(rec)}
                    className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shrink-0 cursor-pointer group"
                    title="Click para ver fotografía de balanza"
                  >
                    <img
                      src={rec.photo_url}
                      alt={rec.record_code}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-slate-950 bg-slate-100 px-2 py-0.5 rounded">
                        {rec.record_code}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          rec.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rec.status === 'approved'
                          ? 'Aprobado'
                          : rec.status === 'rejected'
                          ? 'Rechazado'
                          : 'Pendiente Revisión'}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-900 truncate">
                      {comp?.commercial_name || rec.company_id} · <span className="font-normal text-slate-500">{comp?.airport_area}</span>
                    </p>

                    <p className="text-xs text-slate-600">
                      Residuo: <strong>{wt?.name || rec.waste_type_id}</strong> · Peso:{' '}
                      <strong className="text-slate-900 font-mono">{rec.weight_kg.toFixed(2)} kg</strong>
                    </p>

                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                      <span>{rec.record_date} a las {rec.record_time}</span>
                      {rec.observations && <span>· Obs: {rec.observations}</span>}
                    </div>

                    {rec.rejection_reason && (
                      <div className="mt-1 p-2 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-800">
                        <strong>Motivo rechazo:</strong> {rec.rejection_reason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right action button */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <span className="text-lg font-black text-slate-900 font-mono sm:text-right">
                    {rec.weight_kg.toFixed(2)} <span className="text-xs font-bold text-slate-500">kg</span>
                  </span>
                  <button
                    onClick={() => setSelectedPhotoRecord(rec)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Balanza</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Photo Viewer Modal */}
      {selectedPhotoRecord && (
        <PhotoViewerModal
          record={selectedPhotoRecord}
          onClose={() => setSelectedPhotoRecord(null)}
        />
      )}
    </div>
  );
};
