import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePWA } from '../../hooks/usePWA';
import { db } from '../../services/db';
import { analyzeScaleImage } from '../../services/ocrService';
import { Company, WasteType, BalanceOcrResult, WasteRecord } from '../../types';
import {
  Camera,
  Upload,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Scale,
  RefreshCw,
  Send,
  Building2,
  Recycle,
  Info,
} from 'lucide-react';

interface NewRecordFormProps {
  onSuccess: (newRecord: WasteRecord) => void;
}

export const NewRecordForm: React.FC<NewRecordFormProps> = ({ onSuccess }) => {
  const { currentUser } = useAuth();
  const { isOnline, saveOfflineRecord } = usePWA();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([]);

  // Form State
  const [companyId, setCompanyId] = useState('');
  const [wasteTypeId, setWasteTypeId] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [observations, setObservations] = useState('');

  // Auxiliary state
  const [duplicateWarning, setDuplicateWarning] = useState<WasteRecord | null>(null);
  const [isAnalyzingOcr, setIsAnalyzingOcr] = useState(false);
  const [ocrResult, setOcrResult] = useState<BalanceOcrResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const comps = db.getCompanies().filter((c) => c.active);
    const types = db.getWasteTypes().filter((w) => w.active);
    setCompanies(comps);
    setWasteTypes(types);

    if (comps.length > 0) setCompanyId(comps[0].id);
    if (types.length > 0) setWasteTypeId(types[0].id);
  }, []);

  // Check duplicate dynamically whenever company, wasteType, or weight changes
  useEffect(() => {
    const weightNum = parseFloat(weightKg);
    if (companyId && wasteTypeId && !isNaN(weightNum) && weightNum > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const dup = db.checkDuplicate(companyId, wasteTypeId, weightNum, todayStr);
      setDuplicateWarning(dup);
    } else {
      setDuplicateWarning(null);
    }
  }, [companyId, wasteTypeId, weightKg]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPhotoBase64(result);
      setOcrResult(null); // Reset previous OCR
    };
    reader.readAsDataURL(file);
  };


  // Run AI OCR on the scale photo
  const handleRunOcr = async () => {
    if (!photoBase64) return;
    setIsAnalyzingOcr(true);
    const declared = parseFloat(weightKg) || undefined;
    const result = await analyzeScaleImage(photoBase64, declared);
    setOcrResult(result);
    setIsAnalyzingOcr(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) return;
    const weightNum = parseFloat(weightKg);

    if (!companyId) {
      alert('Por favor selecciona el operador comercial donde se realiza el retiro.');
      return;
    }
    if (!wasteTypeId) {
      alert('Por favor selecciona el tipo de residuo.');
      return;
    }
    if (isNaN(weightNum) || weightNum <= 0) {
      alert('Por favor ingresa un peso válido mayor a 0 kg.');
      return;
    }
    if (!photoBase64) {
      alert('La fotografía de la balanza es OBLIGATORIA como evidencia de trazabilidad.');
      return;
    }

    setIsSubmitting(true);

    const now = new Date();
    const recordDate = now.toISOString().split('T')[0];
    const recordTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    const recordPayload = {
      company_id: companyId,
      waste_type_id: wasteTypeId,
      weight_kg: parseFloat(weightNum.toFixed(2)),
      photo_url: photoBase64,
      record_date: recordDate,
      record_time: recordTime,
      observations: observations.trim() || undefined,
      ocr_detected_weight: ocrResult?.detected_weight ?? null,
      ocr_status: ocrResult?.ocr_status ?? 'not_scanned',
      ocr_notes: ocrResult?.alert_message ?? undefined,
    };

    if (!isOnline) {
      // Save in PWA offline queue
      saveOfflineRecord({
        ...recordPayload,
        offline_created_by: currentUser.id,
        offline_created_by_name: currentUser.full_name,
      });
      setIsSubmitting(false);
      setSuccessMessage(
        'Registro guardado en modo sin conexión (PENDIENTE DE SINCRONIZACIÓN). Se enviará al restablecerse la red.'
      );
      // Reset form
      setWeightKg('');
      setPhotoBase64('');
      setObservations('');
      setOcrResult(null);
      return;
    }

    // Save directly in database
    const saved = db.addRecord(recordPayload, currentUser);
    setIsSubmitting(false);
    setSuccessMessage(`¡Registro ${saved.record_code} enviado correctamente! Se encuentra PENDIENTE DE APROBACIÓN.`);

    // Reset form
    setWeightKg('');
    setPhotoBase64('');
    setObservations('');
    setOcrResult(null);

    setTimeout(() => {
      onSuccess(saved);
    }, 1200);
  };

  const selectedCompany = companies.find((c) => c.id === companyId);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Mobile-first card container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-900 text-white p-4 sm:p-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-800 border border-emerald-700">
              <Scale className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg text-white">
                Nuevo Registro de Residuos
              </h2>
              <p className="text-xs text-emerald-200">
                Pesaje en campo · Aeropuerto Internacional Mariscal Sucre
              </p>
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 m-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">¡Operación exitosa!</p>
              <p className="text-[11px] mt-0.5">{successMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Step 1: Operador Comercial & Área */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              1. Operador Comercial / Punto de Acopio
            </label>
            <select
              id="select-company"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full text-xs sm:text-sm font-semibold p-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              required
            >
              {companies.map((comp) => (
                <option key={comp.id} value={comp.id}>
                  {comp.commercial_name} — ({comp.airport_area})
                </option>
              ))}
            </select>
            {selectedCompany && (
              <p className="text-[11px] text-slate-500 px-1">
                📍 Ubicación: <strong>{selectedCompany.airport_area}</strong> · RUC: {selectedCompany.ruc}
              </p>
            )}
          </div>

          {/* Step 2: Tipo de Residuo */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Recycle className="w-3.5 h-3.5 text-emerald-600" />
              2. Tipo de Residuo Reciclable
            </label>
            <select
              id="select-waste-type"
              value={wasteTypeId}
              onChange={(e) => setWasteTypeId(e.target.value)}
              className="w-full text-xs sm:text-sm font-semibold p-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              required
            >
              {wasteTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} [{type.code}] — {type.category}
                </option>
              ))}
            </select>
          </div>

          {/* Step 3: Peso (kg) con teclado numérico */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-emerald-600" />
              3. Peso de Balanza (kg)
            </label>
            <div className="relative">
              <input
                id="input-weight-kg"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Ej. 38.50"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full text-lg sm:text-xl font-mono font-bold p-3 pr-16 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-500 pointer-events-none">
                kg
              </span>
            </div>

          </div>

          {/* Duplicate Detection Warning Banner (#25) */}
          {duplicateWarning && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">POSIBLE REGISTRO DUPLICADO DETECTADO</strong>
                <span>
                  Ya se registró hoy un pesaje para este operador comercial y residuo con peso de{' '}
                  <strong>{duplicateWarning.weight_kg.toFixed(2)} kg</strong> a las{' '}
                  {duplicateWarning.record_time} (Código: {duplicateWarning.record_code}).
                  Verifica que no estés registrando el mismo bulto dos veces.
                </span>
              </div>
            </div>
          )}

          {/* Step 4: Fotografía Obligatoria de la Balanza (#11) */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-emerald-600" />
                4. Fotografía de la Balanza <span className="text-rose-600">*</span>
              </label>
              <span className="text-[10px] text-slate-400">Evidencia obligatoria</span>
            </div>

            {/* Camera / Upload buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Native Mobile Camera Trigger */}
              <button
                type="button"
                id="btn-take-photo"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition"
              >
                <Camera className="w-4 h-4" />
                <span>Tomar Foto de la Balanza</span>
              </button>

              {/* Upload file */}
              <button
                type="button"
                id="btn-upload-photo"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
              >
                <Upload className="w-4 h-4" />
                <span>Subir Fotografía</span>
              </button>

              {/* Hidden Inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>


            {/* Image Preview & OCR verification */}
            {photoBase64 ? (
              <div className="mt-2 p-3 bg-slate-900 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-white text-xs">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Fotografía Cargada
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoBase64('');
                      setOcrResult(null);
                    }}
                    className="text-[11px] text-rose-300 hover:underline"
                  >
                    Eliminar
                  </button>
                </div>

                <div className="relative rounded-lg overflow-hidden bg-black flex justify-center max-h-56">
                  <img
                    src={photoBase64}
                    alt="Evidencia balanza"
                    className="object-contain max-h-56 w-auto"
                  />
                </div>

                {/* AI / OCR Analysis trigger (#16) */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-slate-800">
                  <div className="text-[11px] text-slate-300">
                    IA de Inspección de Balanza:
                  </div>
                  <button
                    type="button"
                    onClick={handleRunOcr}
                    disabled={isAnalyzingOcr}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition disabled:opacity-50"
                  >
                    {isAnalyzingOcr ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Analizando Balanza...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Verificar Peso con IA (OCR)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* OCR Result Pill */}
                {ocrResult && (
                  <div
                    className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                      ocrResult.match
                        ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-200'
                        : ocrResult.ocr_status === 'mismatch'
                        ? 'bg-rose-950/80 border border-rose-700 text-rose-200'
                        : 'bg-amber-950/80 border border-amber-700 text-amber-200'
                    }`}
                  >
                    {ocrResult.match ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div className="text-[11px] leading-tight">
                      <p className="font-bold">
                        {ocrResult.match
                          ? 'Coincidencia confirmada por OCR'
                          : ocrResult.ocr_status === 'mismatch'
                          ? 'Alerta de peso no coincidente'
                          : 'Revisión manual requerida'}
                      </p>
                      <p className="opacity-90 mt-0.5">{ocrResult.alert_message}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 border-2 border-dashed border-slate-300 rounded-xl text-center bg-slate-50 text-slate-400 text-xs">
                Captura o sube la fotografía nítida del visor de la báscula mostrando el peso.
              </div>
            )}
          </div>

          {/* Step 5: Observaciones */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              5. Observaciones en Campo (Opcional)
            </label>
            <textarea
              id="input-observations"
              rows={2}
              placeholder="Ej. Bultos limpios, embalaje estándar en fardo, etc."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              id="btn-submit-record"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Enviando pesaje a validación...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>
                    {!isOnline
                      ? 'GUARDAR PESAJE SIN CONEXIÓN'
                      : 'REGISTRAR PESAJE Y ENVIAR A APROBACIÓN'}
                  </span>
                </>
              )}
            </button>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              Gestor Ambiental Responsable: <strong>{currentUser?.full_name}</strong> · Código único generado automáticamente
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
