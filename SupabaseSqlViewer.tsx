import React, { useState } from 'react';
import { db } from '../../services/db';
import { Database, Copy, Check, ShieldCheck, Terminal } from 'lucide-react';

export const SupabaseSqlViewer: React.FC = () => {
  const sql = db.getSupabaseSchemaSql();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Esquema SQL y Políticas Row Level Security (RLS) para Supabase</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                PostgreSQL
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Script completo listo para ejecutar en el SQL Editor de tu proyecto Supabase en producción.
            </p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition whitespace-nowrap"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? '¡Copiado al Portapapeles!' : 'Copiar Script SQL'}</span>
        </button>
      </div>

      {/* RLS Highlights Banner */}
      <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl border border-slate-800 text-xs space-y-2">
        <div className="flex items-center gap-2 text-emerald-400 font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>Políticas de Seguridad Implementadas a Nivel de Base de Datos:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300 pl-1">
          <li>
            <strong>Operadores Comerciales:</strong> Acceso restringido exclusivamente a registros donde <code>company_id = auth.company_id()</code> y <code>status = 'approved'</code>. No tienen visibilidad de datos de otros operadores comerciales ni de pesajes en revisión.
          </li>
          <li>
            <strong>Gestores Ambientales:</strong> Permiso de inserción con foto obligatoria y lectura de sus propios pesajes registrados.
          </li>
          <li>
            <strong>Administradores Quiport:</strong> Control total para aprobación, auditoría inmutable y cierre de actas mensuales.
          </li>
        </ul>
      </div>

      {/* Code Viewer */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>supabase_schema_circular_uio.sql</span>
          </div>
          <button
            onClick={handleCopy}
            className="text-[11px] text-slate-300 hover:text-white transition flex items-center gap-1"
          >
            <Copy className="w-3 h-3" /> Copiar
          </button>
        </div>
        <pre className="p-4 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed max-h-[500px]">
          {sql}
        </pre>
      </div>
    </div>
  );
};
