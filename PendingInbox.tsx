import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/db';
import { WasteRecord, Company, WasteType } from '../../types';
import { PhotoViewerModal } from '../common/PhotoViewerModal';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  AlertTriangle,
  Scale,
  Sparkles,
  CheckCheck,
  Building,
  Calendar,
  X,
} from 'lucide-react';

export const PendingInbox: React.FC = () => {
  const { currentUser } = useAuth();
  const [pendingRecords, setPendingRecords] = useState<WasteRecord[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [inspectRecord, setInspectRecord] = useState<WasteRecord | null>(null);

  // Reject modal state
  const [rejectingRecord, setRejectingRecord] = useState<WasteRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const refreshData = () => {
    const all = db.getRecords();
    setPendingRecords(all.filter((r) => r.status === 'pending'));
    setCompanies(db.getCompanies());
    setWasteTypes(db.getWasteTypes());
  };

  useEffect(() => {
    refreshData();
    const unsub = db.subscribe(refreshData);
    return unsub;
  }, []);

  const handleSelectAll = () => {
    if (selectedIds.length === pendingRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingRecords.map((r) => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Single approve
  const handleApprove = (recordId: string) => {
    if (!currentUser) return;
    db.approveRecord(recordId, currentUser);
    setSelectedIds((prev) => prev.filter((id) => id !== recordId));
  };

  // Bulk approve
  const handleBulkApprove = () => {
    if (!currentUser || selectedIds.length === 0) return;
    if (
      window.confirm(
        `¿Confirmas la APROBACIÓN de ${selectedIds.length} pesajes seleccionados? Pasarán a formar parte de las estadísticas oficiales y actas.`
      )
    ) {
      db.bulkApproveRecords(selectedIds, currentUser);
      setSelectedIds([]);
    }
  };

  // Open rejection modal
  const openRejectModal = (record: WasteRecord) => {
    setRejectingRecord(record);
    setRejectionReason('Foto de balanza borrosa o no legible');
    setCustomReason('');
  };

  // Confirm rejection
  const handleConfirmReject = () => {
    if (!currentUser || !rejectingRecord) return;
    const finalReason =
      rejectionReason === 'Otro' ? customReason.trim() || 'Sin motivo especificado' : rejectionReason;

    db.rejectRecord(rejectingRecord.id, finalReason, currentUser);
    setSelectedIds((prev) => prev.filter((id) => id !== rejectingRecord.id));
    setRejectingRecord(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Bulk Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <span>Bandeja de Validación y Control de Balanzas</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800">
              {pendingRecords.length} pendientes
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspecciona la fotografía de la balanza para garantizar la autenticidad del pesaje en Quito.
          </p>
        </div>

        {pendingRecords.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
            >
              {selectedIds.length === pendingRecords.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </button>

            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkApprove}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow transition animate-in fade-in"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Aprobar Lote ({selectedIds.length})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Empty State */}
      {pendingRecords.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            ¡Bandeja de pesajes al día!
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No existen registros pendientes de aprobación en este momento. Los nuevos retiros que realicen los gestores aparecerán aquí en tiempo real.
          </p>
        </div>
      ) : (
        /* List of Pending Records */
        <div className="space-y-3">
          {pendingRecords.map((rec) => {
            const comp = companies.find((c) => c.id === rec.company_id);
            const wt = wasteTypes.find((w) => w.id === rec.waste_type_id);
            const isSelected = selectedIds.includes(rec.id);

            return (
              <div
                key={rec.id}
                className={`bg-white rounded-2xl border transition-all p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 ${
                  isSelected ? 'border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Left side: Checkbox + Photo + Details */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Select Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(rec.id)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />

                  {/* Photo thumbnail with zoom button */}
                  <div
                    onClick={() => setInspectRecord(rec)}
                    className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-900 border border-slate-300 shrink-0 cursor-pointer group"
                    title="Click para inspeccionar fotografía de la balanza"
                  >
                    <img
                      src={rec.photo_url}
                      alt={rec.record_code}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {rec.record_code}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        Pendiente Revisión
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {comp?.commercial_name} · <span className="font-normal text-slate-500 text-xs">{comp?.airport_area}</span>
                    </h4>

                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <span>Residuo: <strong>{wt?.name}</strong></span>
                      <span>·</span>
                      <span>
                        Peso:{' '}
                        <strong className="text-slate-950 font-mono text-sm">
                          {rec.weight_kg.toFixed(2)} kg
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                      <span>Capturado: {rec.record_date} {rec.record_time}</span>
                      <span>· Gestor: <strong>{rec.created_by_name}</strong></span>
                    </div>

                    {/* AI OCR Flag Alert if available */}
                    {rec.ocr_status && (
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold mt-1 ${
                          rec.ocr_status === 'match'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : rec.ocr_status === 'mismatch'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>
                          {rec.ocr_status === 'match'
                            ? 'IA Balanza: Lectura coincide con peso'
                            : rec.ocr_status === 'mismatch'
                            ? 'Alerta IA: Discrepancia en display de balanza'
                            : 'IA: Inspección visual recomendada'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Actions */}
                <div className="flex sm:flex-row md:flex-col lg:flex-row items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <button
                    onClick={() => setInspectRecord(rec)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ver Balanza</span>
                  </button>

                  <button
                    onClick={() => handleApprove(rec.id)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aprobar</span>
                  </button>

                  <button
                    onClick={() => openRejectModal(rec)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Rechazar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inspect Photo Modal */}
      {inspectRecord && (
        <PhotoViewerModal
          record={inspectRecord}
          onClose={() => setInspectRecord(null)}
        />
      )}

      {/* Mandatory Rejection Reason Modal (#14) */}
      {rejectingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <XCircle className="w-5 h-5" />
                <h3 className="font-bold text-sm text-slate-900">
                  Rechazar Pesaje: {rejectingRecord.record_code}
                </h3>
              </div>
              <button
                onClick={() => setRejectingRecord(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Indica el motivo por el cual este pesaje no cumple con los estándares de trazabilidad de Quiport. El gestor recibirá una notificación con esta justificación.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Motivo del Rechazo:
              </label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
              >
                <option value="Foto de balanza borrosa o no legible">
                  Foto de balanza borrosa o no legible
                </option>
                <option value="El peso digital de la foto no coincide con el declarado">
                  El peso digital de la foto no coincide con el declarado
                </option>
                <option value="Balanza apagada o sin punto de apoyo calibrado">
                  Balanza apagada o sin punto de apoyo calibrado
                </option>
                <option value="Posible registro duplicado de pesaje">
                  Posible registro duplicado de pesaje
                </option>
                <option value="Residuo no corresponde a la categoría declarada">
                  Residuo no corresponde a la categoría declarada
                </option>
                <option value="Otro">Otro motivo personalizado...</option>
              </select>

              {rejectionReason === 'Otro' && (
                <textarea
                  rows={3}
                  placeholder="Detalla el motivo específico del rechazo..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 mt-2"
                  required
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectingRecord(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow transition"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
