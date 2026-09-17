import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/db';
import { Company } from '../../types';
import { Building2, Plus, CheckCircle, XCircle, Search, Edit2, X } from 'lucide-react';

export const CompaniesManager: React.FC = () => {
  const { currentUser } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');

  // Modal create/edit
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [ruc, setRuc] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [commercialName, setCommercialName] = useState('');
  const [airportArea, setAirportArea] = useState('Zona de Carga Internacional');
  const [responsibleName, setResponsibleName] = useState('');
  const [responsibleEmail, setResponsibleEmail] = useState('');
  const [responsiblePhone, setResponsiblePhone] = useState('');

  const refresh = () => {
    setCompanies(db.getCompanies());
  };

  useEffect(() => {
    refresh();
    const unsub = db.subscribe(refresh);
    return unsub;
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setRuc('');
    setBusinessName('');
    setCommercialName('');
    setAirportArea('Terminal de Pasajeros - Nivel 2');
    setResponsibleName('');
    setResponsibleEmail('');
    setResponsiblePhone('');
    setShowModal(true);
  };

  const openEditModal = (c: Company) => {
    setEditingId(c.id);
    setRuc(c.ruc);
    setBusinessName(c.business_name);
    setCommercialName(c.commercial_name);
    setAirportArea(c.airport_area);
    setResponsibleName(c.responsible_name);
    setResponsibleEmail(c.responsible_email || c.email);
    setResponsiblePhone(c.responsible_phone || c.phone);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!ruc.trim() || !businessName.trim() || !commercialName.trim()) {
      alert('RUC, Razón Social y Nombre Comercial son requeridos.');
      return;
    }

    if (editingId) {
      db.updateCompany(
        editingId,
        {
          ruc: ruc.trim(),
          business_name: businessName.trim(),
          commercial_name: commercialName.trim(),
          airport_area: airportArea.trim(),
          responsible_name: responsibleName.trim(),
          responsible_position: 'Coordinador Ambiental',
          email: responsibleEmail.trim(),
          phone: responsiblePhone.trim(),
          responsible_email: responsibleEmail.trim(),
          responsible_phone: responsiblePhone.trim(),
        },
        currentUser
      );
    } else {
      db.addCompany(
        {
          ruc: ruc.trim(),
          business_name: businessName.trim(),
          commercial_name: commercialName.trim(),
          airport_area: airportArea.trim(),
          responsible_name: responsibleName.trim(),
          responsible_position: 'Coordinador Ambiental',
          email: responsibleEmail.trim(),
          phone: responsiblePhone.trim(),
          responsible_email: responsibleEmail.trim(),
          responsible_phone: responsiblePhone.trim(),
          active: true,
        },
        currentUser
      );
    }

    setShowModal(false);
  };

  const handleToggleActive = (c: Company) => {
    if (!currentUser) return;
    db.updateCompany(c.id, { active: !c.active }, currentUser);
  };

  const filtered = companies.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.commercial_name.toLowerCase().includes(q) ||
      c.business_name.toLowerCase().includes(q) ||
      c.ruc.includes(q) ||
      c.airport_area.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header action bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, RUC o área del aeropuerto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
          />
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Operador Comercial</span>
        </button>
      </div>

      {/* Grid of Companies */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((comp) => (
          <div
            key={comp.id}
            className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between gap-3 transition ${
              comp.active ? 'border-slate-200 hover:border-slate-300' : 'border-slate-200 opacity-60 bg-slate-50'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold text-slate-500">
                  RUC: {comp.ruc}
                </span>
                <button
                  onClick={() => handleToggleActive(comp)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    comp.active
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {comp.active ? 'Activa' : 'Inactiva'}
                </button>
              </div>

              <h4 className="text-sm font-bold text-slate-900 mt-1">
                {comp.commercial_name}
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                {comp.business_name}
              </p>
              <div className="pt-1 text-xs text-emerald-900 bg-emerald-50/60 px-2 py-1 rounded-lg">
                📍 {comp.airport_area}
              </div>

              <div className="pt-2 text-[11px] text-slate-600 space-y-0.5">
                <p>
                  Responsable: <strong>{comp.responsible_name}</strong>
                </p>
                <p className="text-slate-500">{comp.responsible_email || comp.email}</p>
                <p className="text-slate-500">{comp.responsible_phone || comp.phone}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => openEditModal(comp)}
                className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-emerald-700"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar Operador Comercial</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal create / edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                {editingId ? 'Editar Operador Comercial' : 'Registrar Nuevo Operador Comercial'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase">RUC (13 dígitos):</label>
                  <input
                    type="text"
                    required
                    maxLength={13}
                    placeholder="1790012345001"
                    value={ruc}
                    onChange={(e) => setRuc(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 mt-1 font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase">Nombre Comercial:</label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre del operador comercial"
                    value={commercialName}
                    onChange={(e) => setCommercialName(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 mt-1 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase">Razón Social:</label>
                <input
                  type="text"
                  required
                  placeholder="Razón social registrada"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 mt-1"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase">Área del Aeropuerto:</label>
                <input
                  type="text"
                  required
                  placeholder="Área o ubicación dentro del aeropuerto"
                  value={airportArea}
                  onChange={(e) => setAirportArea(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 uppercase">Contacto Responsable:</label>
                  <input
                    type="text"
                    placeholder="Nombre y Apellido"
                    value={responsibleName}
                    onChange={(e) => setResponsibleName(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 mt-1"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase">Correo Electrónico:</label>
                  <input
                    type="email"
                    placeholder="ambiental@operador.com"
                    value={responsibleEmail}
                    onChange={(e) => setResponsibleEmail(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase">Teléfono de Contacto:</label>
                <input
                  type="text"
                  placeholder="+593 99 123 4567"
                  value={responsiblePhone}
                  onChange={(e) => setResponsiblePhone(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 mt-1"
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
                  Guardar Operador Comercial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
