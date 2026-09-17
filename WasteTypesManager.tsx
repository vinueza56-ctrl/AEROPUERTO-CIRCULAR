import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/db';
import { WasteType } from '../../types';
import { Recycle, Plus, Edit2, X, CheckCircle } from 'lucide-react';

export const WasteTypesManager: React.FC = () => {
  const { currentUser } = useAuth();
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Papel y Cartón');
  const [description, setDescription] = useState('');

  const refresh = () => {
    setWasteTypes(db.getWasteTypes());
  };

  useEffect(() => {
    refresh();
    const unsub = db.subscribe(refresh);
    return unsub;
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setCode('');
    setName('');
    setCategory('Plásticos');
    setDescription('');
    setShowModal(true);
  };

  const openEditModal = (w: WasteType) => {
    setEditingId(w.id);
    setCode(w.code);
    setName(w.name);
    setCategory(w.category);
    setDescription(w.description || '');
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !code.trim() || !name.trim()) return;

    if (editingId) {
      db.updateWasteType(
        editingId,
        {
          code: code.trim().toUpperCase(),
          name: name.trim(),
          category,
          description: description.trim() || undefined,
        },
        currentUser
      );
    } else {
      db.addWasteType(
        {
          code: code.trim().toUpperCase(),
          name: name.trim(),
          category,
          unit: 'kg',
          description: description.trim() || undefined,
          active: true,
        },
        currentUser
      );
    }
    setShowModal(false);
  };

  const handleToggleActive = (w: WasteType) => {
    if (!currentUser) return;
    db.updateWasteType(w.id, { active: !w.active }, currentUser);
  };

  return (
    <div className="space-y-4">
      {/* Header action bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Recycle className="w-5 h-5 text-emerald-600" />
            <span>Catálogo Oficial de Residuos Reciclables UIO</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Materiales aprovechables clasificados conforme al Plan de Manejo Ambiental de Quiport.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Nuevo Material</span>
        </button>
      </div>

      {/* Grid of Waste Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {wasteTypes.map((wt) => (
          <div
            key={wt.id}
            className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between gap-3 transition ${
              wt.active ? 'border-slate-200 hover:border-slate-300' : 'border-slate-200 opacity-60 bg-slate-50'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  {wt.code}
                </span>
                <button
                  onClick={() => handleToggleActive(wt)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    wt.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {wt.active ? 'Activo' : 'Inactivo'}
                </button>
              </div>

              <h4 className="text-sm font-bold text-slate-900 mt-1">{wt.name}</h4>
              <p className="text-xs font-semibold text-emerald-700">{wt.category}</p>
              <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                {wt.description || 'Sin descripción adicional'}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-slate-500">Unidad: {wt.unit}</span>
              <button
                onClick={() => openEditModal(wt)}
                className="flex items-center gap-1 text-slate-600 hover:text-emerald-700 font-semibold"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">
                {editingId ? 'Editar Residuo Reciclable' : 'Nuevo Tipo de Residuo'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase">Código Único:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. PLAS-03"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold mt-1"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase">Categoría:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 mt-1 font-semibold"
                  >
                    <option value="Papel y Cartón">Papel y Cartón</option>
                    <option value="Plásticos">Plásticos</option>
                    <option value="Vidrio">Vidrio</option>
                    <option value="Metales">Metales</option>
                    <option value="Madera y Pallets">Madera y Pallets</option>
                    <option value="Orgánicos Compostables">Orgánicos Compostables</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase">Nombre del Residuo:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Plástico Termoencogible Film"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 mt-1 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase">Descripción y Lineamientos:</label>
                <textarea
                  rows={3}
                  placeholder="Especificaciones para acopio y pesaje limpio en campo..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl shadow transition"
                >
                  Guardar Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
