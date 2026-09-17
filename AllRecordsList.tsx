import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/db';
import { WasteRecord, Company, WasteType } from '../../types';
import { PhotoViewerModal } from '../common/PhotoViewerModal';
import {
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  Building,
  Recycle,
  Trash2,
} from 'lucide-react';

export const AllRecordsList: React.FC = () => {
  const { currentUser } = useAuth();
  const [records, setRecords] = useState<WasteRecord[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [wasteFilter, setWasteFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedPhotoRecord, setSelectedPhotoRecord] = useState<WasteRecord | null>(null);

  const refreshData = () => {
    setRecords(db.getRecords());
    setCompanies(db.getCompanies());
    setWasteTypes(db.getWasteTypes());
  };

  useEffect(() => {
    refreshData();
    const unsub = db.subscribe(refreshData);
    return unsub;
  }, []);

  const filtered = records.filter((r) => {
    if (companyFilter !== 'all' && r.company_id !== companyFilter) return false;
    if (wasteFilter !== 'all' && r.waste_type_id !== wasteFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const comp = companies.find((c) => c.id === r.company_id);
      const wt = wasteTypes.find((w) => w.id === r.waste_type_id);
      const matchCode = r.record_code.toLowerCase().includes(q);
      const matchComp = comp?.commercial_name.toLowerCase().includes(q) || false;
      const matchWaste = wt?.name.toLowerCase().includes(q) || false;
      if (!matchCode && !matchComp && !matchWaste) return false;
    }
    return true;
  });

  const totalFilteredKg = filtered.reduce((acc, r) => acc + r.weight_kg, 0);

  const handleDelete = (id: string, code: string) => {
    if (!currentUser) return;
    if (window.confirm(`¿Estás seguro de eliminar el registro ${code}? Esta acción se registrará en el registro de auditoría.`)) {
      db.deleteRecord(id, currentUser);
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ['Codigo', 'Operador Comercial', 'Area Aeropuerto', 'Residuo', 'Peso (kg)', 'Fecha', 'Hora', 'Estado', 'Gestor'],
      ...filtered.map((r) => {
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
    link.setAttribute('download', `UIO_Registros_Filtrados_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Filters Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código (ej. UIO-RW-...), operador comercial o residuo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
            />
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Exportar Vista ({filtered.length})</span>
          </button>
        </div>

        {/* Dropdowns row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase">Operador Comercial:</label>
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
            >
              <option value="all">Todos los Operadores Comerciales</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.commercial_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase">Residuo:</label>
            <select
              value={wasteFilter}
              onChange={(e) => setWasteFilter(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
            >
              <option value="all">Todos los Residuos</option>
              {wasteTypes.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase">Estado:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
            >
              <option value="all">Todos los Estados</option>
              <option value="approved">Aprobados</option>
              <option value="pending">Pendientes</option>
              <option value="rejected">Rechazados</option>
            </select>
          </div>
        </div>

        {/* Total indicator */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Mostrando <strong>{filtered.length}</strong> de {records.length} registros</span>
          <span>Peso total filtrado: <strong className="text-slate-900 font-mono">{totalFilteredKg.toFixed(2)} kg</strong></span>
        </div>
      </div>

      {/* Table of Records */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-3.5">Código</th>
                <th className="py-3 px-3.5">Operador Comercial / Área</th>
                <th className="py-3 px-3.5">Residuo</th>
                <th className="py-3 px-3.5 text-right">Peso (kg)</th>
                <th className="py-3 px-3.5 text-center">Balanza</th>
                <th className="py-3 px-3.5">Fecha & Hora</th>
                <th className="py-3 px-3.5 text-center">Estado</th>
                <th className="py-3 px-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filtered.map((rec) => {
                const comp = companies.find((c) => c.id === rec.company_id);
                const wt = wasteTypes.find((w) => w.id === rec.waste_type_id);

                return (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3.5 font-bold text-slate-900">{rec.record_code}</td>
                    <td className="py-2.5 px-3.5 font-sans">
                      <span className="font-bold text-slate-900 block truncate max-w-[140px]">
                        {comp?.commercial_name}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                        {comp?.airport_area}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 font-sans text-slate-800 font-medium">
                      {wt?.name}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-bold text-slate-950">
                      {rec.weight_kg.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      <button
                        onClick={() => setSelectedPhotoRecord(rec)}
                        className="inline-flex items-center gap-1 text-[10px] font-sans font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
                        title="Ver foto de balanza"
                      >
                        <Eye className="w-3.5 h-3.5" /> Ver Foto
                      </button>
                    </td>
                    <td className="py-2.5 px-3.5 font-sans text-slate-500">
                      {rec.record_date} <span className="text-slate-400">{rec.record_time}</span>
                    </td>
                    <td className="py-2.5 px-3.5 text-center font-sans">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
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
                          : 'Pendiente'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-sans">
                      <button
                        onClick={() => handleDelete(rec.id, rec.record_code)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                    No se encontraron registros con los criterios seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Photo modal */}
      {selectedPhotoRecord && (
        <PhotoViewerModal
          record={selectedPhotoRecord}
          onClose={() => setSelectedPhotoRecord(null)}
        />
      )}
    </div>
  );
};
