import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { AuditLog } from '../../types';
import { History, Shield, Search, UserCheck } from 'lucide-react';

export const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');

  const refresh = () => {
    setLogs(db.getAuditLogs());
  };

  useEffect(() => {
    refresh();
    const unsub = db.subscribe(refresh);
    return unsub;
  }, []);

  const filtered = logs.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const actor = (log.actor_name || log.user_name || '').toLowerCase();
    const details = (log.details || '').toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      actor.includes(q) ||
      log.entity.toLowerCase().includes(q) ||
      details.includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-700" />
            <span>Registro Oficial de Auditoría Inmutable (Audit Trail)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Trazabilidad rigurosa de cada aprobación, pesaje, rechazo y emisión de acta en el aeropuerto.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar por acción o usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Fecha & Hora</th>
                <th className="py-3 px-4">Usuario / Rol</th>
                <th className="py-3 px-4">Acción Realizada</th>
                <th className="py-3 px-4">Entidad Afectada</th>
                <th className="py-3 px-4">Detalles y Justificación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at || log.timestamp).toLocaleDateString()}{' '}
                    <span className="text-slate-400">
                      {new Date(log.created_at || log.timestamp).toLocaleTimeString()}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans whitespace-nowrap">
                    <span className="font-bold text-slate-900 block">
                      {log.actor_name || log.user_name}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {log.actor_role || 'Personal Autorizado'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action.includes('Aprobación')
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.action.includes('Rechazo')
                          ? 'bg-rose-100 text-rose-800'
                          : log.action.includes('Acta')
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-sans">
                    <span className="font-mono text-slate-700 font-semibold">{log.entity}</span>
                    {log.entity_id && (
                      <span className="block text-[10px] text-slate-400 truncate max-w-[120px]">
                        ID: {log.entity_id}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-600 max-w-md">
                    <p className="line-clamp-2">{log.details}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
