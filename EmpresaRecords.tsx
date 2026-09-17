import React, { useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/db';
import { WasteRecord, WasteType } from '../../types';
import { PhotoViewerModal } from '../common/PhotoViewerModal';
import { Search, Download, Eye, CheckCircle2, Scale, Filter } from 'lucide-react';

export const EmpresaRecords: React.FC = () => {
  const { currentUser, currentCompany } = useAuth();
  const [search, setSearch] = useState('');
  const [wasteFilter, setWasteFilter] = useState('all');
  const [selectedPhotoRecord, setSelectedPhotoRecord] = useState<WasteRecord | null>(null);

  // Strictly enforced RLS: getRecords(currentUser) filters only approved records of current company
  const records = useMemo(() => {
    return db.getRecords(currentUser);
  }, [currentUser]);

  const wasteTypes = useMemo(() => db.getWasteTypes(), []);

  const filtered = records.filter((r) => {
    if (wasteFilter !== 'all' && r.waste_type_id !== wasteFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const wt = wasteTypes.find((w) => w.id === r.waste_type_id);
      const matchCode = r.record_code.toLowerCase().includes(q);
      const matchWaste = wt?.name.toLowerCase().includes(q) || false;
      if (!matchCode && !matchWaste) return false;
    }
    return true;
  });

  const totalKg = filtered.reduce((acc, r) => acc + r.weight_kg, 0);

  const handleExportCSV = () => {
    const rows = [
      ['Codigo', 'Operador Comercial', 'Area Aeropuerto', 'Residuo', 'Peso (kg)', 'Fecha', 'Hora', 'Estado'],
      ...filtered.map((r) => {
        const wt = wasteTypes.find((w) => w.id === r.waste_type_id);
        return [
          r.record_code,
          currentCompany?.commercial_name || '',
          currentCompany?.airport_area || '',
          wt?.name || r.waste_type_id,
          r.weight_kg.toString(),
          r.record_date,
          r.record_time,
          'Aprobado',
        ];
      }),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Mis_Residuos_${currentCompany?.commercial_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código de pesaje o residuo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={wasteFilter}
            onChange={(e) => setWasteFilter(e.target.value)}
            className="text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
          >
            <option value="all">Todos los Residuos</option>
            {wasteTypes.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Descargar CSV</span>
          </button>
        </div>
      </div>

      {/* RLS Policy Notice */}
      <div className="px-4 py-2 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 flex items-center justify-between">
        <span>
          Mostrando únicamente <strong>pesajes aprobados</strong> para {currentCompany?.commercial_name} (Total: {totalKg.toFixed(2)} kg).
        </span>
        <span className="font-bold text-emerald-800">RLS Activo</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Código Oficial</th>
                <th className="py-3 px-4">Fecha & Hora</th>
                <th className="py-3 px-4">Tipo de Residuo</th>
                <th className="py-3 px-4 text-right">Peso (kg)</th>
                <th className="py-3 px-4 text-center">Evidencia Báscula</th>
                <th className="py-3 px-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filtered.map((rec) => {
                const wt = wasteTypes.find((w) => w.id === rec.waste_type_id);
                return (
                  <tr key={rec.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{rec.record_code}</td>
                    <td className="py-2.5 px-4 font-sans text-slate-500">
                      {rec.record_date} <span className="text-slate-400">{rec.record_time}</span>
                    </td>
                    <td className="py-2.5 px-4 font-sans text-slate-900 font-medium">
                      {wt?.name || rec.waste_type_id}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-950">
                      {rec.weight_kg.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedPhotoRecord(rec)}
                        className="inline-flex items-center gap-1 text-[11px] font-sans font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" /> Ver Balanza
                      </button>
                    </td>
                    <td className="py-2.5 px-4 text-center font-sans">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Aprobado
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                    No se encontraron retiros aprobados para el filtro seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
