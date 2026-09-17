import React from 'react';
import { X, CheckCircle2, AlertTriangle, Scale, Eye } from 'lucide-react';
import { WasteRecord } from '../../types';

interface PhotoViewerModalProps {
  record: WasteRecord | null;
  onClose: () => void;
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({ record, onClose }) => {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <Scale className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                Evidencia de Balanza — {record.record_code}
              </h3>
              <p className="text-xs text-slate-400">
                Aeropuerto Internacional Mariscal Sucre de Quito · Cadena de Custodia
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Display */}
        <div className="p-4 bg-slate-950 flex items-center justify-center min-h-[300px]">
          <img
            src={record.photo_url}
            alt={`Balanza para ${record.record_code}`}
            className="max-h-[380px] w-auto max-w-full object-contain rounded-lg shadow-md border border-slate-800"
          />
        </div>

        {/* Metadata & OCR Inspection */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                Peso Declarado
              </span>
              <span className="text-slate-900 font-extrabold text-base">
                {record.weight_kg.toFixed(2)} kg
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                Fecha & Hora
              </span>
              <span className="text-slate-900 font-semibold text-xs">
                {record.record_date} {record.record_time}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                Gestor Ambiental
              </span>
              <span className="text-slate-900 font-semibold text-xs truncate block">
                {record.created_by_name || 'Gestor ambiental no identificado'}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                Estado
              </span>
              <span
                className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-bold ${
                  record.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : record.status === 'rejected'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {record.status === 'approved'
                  ? 'Aprobado'
                  : record.status === 'rejected'
                  ? 'Rechazado'
                  : 'Pendiente'}
              </span>
            </div>
          </div>

          {/* OCR AI Analysis Banner */}
          {record.ocr_status && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-3 text-xs ${
                record.ocr_status === 'match'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : record.ocr_status === 'mismatch'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              {record.ocr_status === 'match' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <p className="font-bold">
                  {record.ocr_status === 'match'
                    ? 'Análisis IA / OCR de Balanza: Coincidencia de Lectura'
                    : record.ocr_status === 'mismatch'
                    ? 'Alerta de Inconsistencia IA en Balanza'
                    : 'Revisión Manual Requerida por Administración'}
                </p>
                <p className="text-[11px] opacity-90">
                  {record.ocr_notes ||
                    `Peso detectado en display: ${
                      record.ocr_detected_weight !== null && record.ocr_detected_weight !== undefined
                        ? record.ocr_detected_weight.toFixed(2) + ' kg'
                        : 'No legible por reflejo'
                    }`}
                </p>
              </div>
            </div>
          )}

          {record.rejection_reason && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
              <strong className="block font-bold">Motivo de Rechazo Registrado:</strong>
              <span>{record.rejection_reason}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Cerrar Vista
          </button>
        </div>
      </div>
    </div>
  );
};
