import {
  Profile,
  Company,
  WasteType,
  WasteRecord,
  MonthlyReport,
  MonthlyReportItem,
  AuditLogEntry,
  NotificationItem,
} from '../types';

const STORAGE_KEYS = {
  PROFILES: 'circular_uio_profiles_v1',
  COMPANIES: 'circular_uio_companies_v1',
  WASTE_TYPES: 'circular_uio_waste_types_v1',
  RECORDS: 'circular_uio_records_v1',
  REPORTS: 'circular_uio_reports_v1',
  REPORT_ITEMS: 'circular_uio_report_items_v1',
  AUDIT: 'circular_uio_audit_v1',
  NOTIFICATIONS: 'circular_uio_notifications_v1',
  CURRENT_USER: 'circular_uio_current_user_v1',
};

// Production-safe initial state: no seeded companies, users, waste types, records, reports, audit entries, or notifications.
const INITIAL_COMPANIES: Company[] = [];
const INITIAL_WASTE_TYPES: WasteType[] = [];
const INITIAL_PROFILES: Profile[] = [];
const INITIAL_REPORTS: MonthlyReport[] = [];
const INITIAL_AUDIT: AuditLogEntry[] = [];
const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

function createInitialRecords(): WasteRecord[] {
  return [];
}

// In-memory / Storage Database Class
class LocalDatabase {
  private listeners: Array<() => void> = [];

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // One-time cleanup of legacy seeded prototype data from earlier builds.
    const cleanupFlag = 'circular_uio_legacy_cleanup_v2';
    if (!localStorage.getItem(cleanupFlag)) {
      Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
      localStorage.removeItem('circular_uio_current_user_id');
      localStorage.setItem(cleanupFlag, 'done');
    }

    if (!localStorage.getItem(STORAGE_KEYS.COMPANIES)) {
      localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(INITIAL_COMPANIES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.WASTE_TYPES)) {
      localStorage.setItem(STORAGE_KEYS.WASTE_TYPES, JSON.stringify(INITIAL_WASTE_TYPES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(INITIAL_PROFILES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RECORDS)) {
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(createInitialRecords()));
    }
    if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(INITIAL_REPORTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT)) {
      localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(INITIAL_AUDIT));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // --- CRUD: Companies ---
  public getCompanies(): Company[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPANIES) || '[]');
    } catch {
      return INITIAL_COMPANIES;
    }
  }

  public getCompany(id: string): Company | undefined {
    return this.getCompanies().find((c) => c.id === id);
  }

  public saveCompany(company: Company, adminUser: Profile): Company {
    const companies = this.getCompanies();
    const existingIndex = companies.findIndex((c) => c.id === company.id);
    let updated: Company;

    if (existingIndex >= 0) {
      const oldCompany = companies[existingIndex];
      updated = { ...oldCompany, ...company };
      companies[existingIndex] = updated;
      this.addAuditLog(adminUser, 'Edición', 'companies', updated.id, oldCompany, updated, `Actualizado operador comercial ${updated.commercial_name}`);
    } else {
      updated = {
        ...company,
        id: company.id || `comp-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      companies.push(updated);
      this.addAuditLog(adminUser, 'Creación', 'companies', updated.id, null, updated, `Creado nuevo operador comercial ${updated.commercial_name}`);
    }

    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
    this.notify();
    return updated;
  }

  public addCompany(company: Omit<Company, 'id' | 'created_at'>, adminUser: Profile): Company {
    return this.saveCompany({ ...company, id: `comp-${Date.now()}` }, adminUser);
  }

  public updateCompany(id: string, updates: Partial<Company>, adminUser: Profile): Company | null {
    const existing = this.getCompany(id);
    if (!existing) return null;
    return this.saveCompany({ ...existing, ...updates }, adminUser);
  }

  public toggleCompanyActive(id: string, adminUser: Profile): boolean {
    const companies = this.getCompanies();
    const comp = companies.find((c) => c.id === id);
    if (!comp) return false;
    const oldState = comp.active;
    comp.active = !comp.active;
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
    this.addAuditLog(adminUser, 'Edición', 'companies', id, { active: oldState }, { active: comp.active }, `${comp.active ? 'Activado' : 'Desactivado'} operador comercial ${comp.commercial_name}`);
    this.notify();
    return comp.active;
  }

  // --- CRUD: Waste Types ---
  public getWasteTypes(): WasteType[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.WASTE_TYPES) || '[]');
    } catch {
      return INITIAL_WASTE_TYPES;
    }
  }

  public getWasteType(id: string): WasteType | undefined {
    return this.getWasteTypes().find((w) => w.id === id);
  }

  public saveWasteType(wasteType: WasteType, adminUser: Profile): WasteType {
    const types = this.getWasteTypes();
    const idx = types.findIndex((w) => w.id === wasteType.id);
    let saved: WasteType;

    if (idx >= 0) {
      const old = types[idx];
      saved = { ...old, ...wasteType };
      types[idx] = saved;
      this.addAuditLog(adminUser, 'Edición', 'waste_types', saved.id, old, saved, `Modificado tipo de residuo ${saved.name}`);
    } else {
      saved = {
        ...wasteType,
        id: wasteType.id || `waste-${Date.now()}`,
      };
      types.push(saved);
      this.addAuditLog(adminUser, 'Creación', 'waste_types', saved.id, null, saved, `Creado nuevo tipo de residuo ${saved.name}`);
    }

    localStorage.setItem(STORAGE_KEYS.WASTE_TYPES, JSON.stringify(types));
    this.notify();
    return saved;
  }

  public addWasteType(wasteType: Omit<WasteType, 'id'>, adminUser: Profile): WasteType {
    return this.saveWasteType({ ...wasteType, id: `waste-${Date.now()}` }, adminUser);
  }

  public updateWasteType(id: string, updates: Partial<WasteType>, adminUser: Profile): WasteType | null {
    const existing = this.getWasteType(id);
    if (!existing) return null;
    return this.saveWasteType({ ...existing, ...updates }, adminUser);
  }

  // --- CRUD: Profiles / Users ---
  public getProfiles(): Profile[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '[]');
    } catch {
      return INITIAL_PROFILES;
    }
  }

  public saveProfile(profile: Profile, adminUser: Profile): Profile {
    const profiles = this.getProfiles();
    const idx = profiles.findIndex((p) => p.id === profile.id);
    let saved: Profile;

    if (idx >= 0) {
      const old = profiles[idx];
      saved = { ...old, ...profile };
      profiles[idx] = saved;
      this.addAuditLog(adminUser, 'Edición', 'users', saved.id, old, saved, `Usuario ${saved.full_name} actualizado`);
    } else {
      saved = {
        ...profile,
        id: profile.id || `usr-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      profiles.push(saved);
      this.addAuditLog(adminUser, 'Creación', 'users', saved.id, null, saved, `Nuevo usuario ${saved.full_name} creado`);
    }

    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
    this.notify();
    return saved;
  }

  // --- Row Level Security Enforced Records Retrieval ---
  public getRecords(currentUser?: Profile | null): WasteRecord[] {
    let records: WasteRecord[] = [];
    try {
      records = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECORDS) || '[]');
    } catch {
      records = createInitialRecords();
    }

    records = records.filter((r) => !r.is_deleted);

    // Local role filtering only. Real authorization will be enforced with Supabase RLS.
    if (currentUser?.role === 'empresa') {
      if (!currentUser.company_id) return [];
      // Company users strictly only see APPROVED records belonging to their company
      return records.filter((r) => r.company_id === currentUser.company_id && r.status === 'approved');
    }

    // Gestor can see all records or filter by their own
    return records;
  }

  // Check possible duplicate records (Requirement #25)
  public checkDuplicate(
    companyId: string,
    wasteTypeId: string,
    weightKg: number,
    dateStr: string
  ): WasteRecord | null {
    const records = this.getRecords();
    const duplicate = records.find((r) => {
      if (r.company_id !== companyId || r.waste_type_id !== wasteTypeId || r.record_date !== dateStr) {
        return false;
      }
      // Weight matches within 0.5 kg
      return Math.abs(r.weight_kg - weightKg) < 0.5;
    });

    return duplicate || null;
  }

  // Add new waste record (Field Gestor)
  public addRecord(
    data: Omit<WasteRecord, 'id' | 'record_code' | 'created_at' | 'updated_at' | 'status' | 'created_by'>,
    currentUser: Profile
  ): WasteRecord {
    const records = this.getRecords();
    const currentYear = new Date().getFullYear();
    const prefix = `UIO-RW-${currentYear}-`;
    const maxSequence = records.reduce((max, record) => {
      if (!record.record_code.startsWith(prefix)) return max;
      const seq = Number(record.record_code.slice(prefix.length));
      return Number.isFinite(seq) ? Math.max(max, seq) : max;
    }, 0);
    const recordCode = `${prefix}${String(maxSequence + 1).padStart(6, '0')}`;

    const newRecord: WasteRecord = {
      ...data,
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      record_code: recordCode,
      status: 'pending',
      created_by: currentUser.id,
      created_by_name: currentUser.full_name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    records.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));

    // Audit log
    this.addAuditLog(currentUser, 'Creación', 'waste_records', newRecord.id, null, newRecord, `Registro en campo ${recordCode} creado (${newRecord.weight_kg} kg)`);

    // Notification to Admin
    this.addNotification({
      target_role: 'admin',
      title: 'Nuevo pesaje pendiente de aprobación',
      message: `El gestor ${currentUser.full_name} ingresó ${newRecord.weight_kg} kg con código ${recordCode}.`,
      type: 'pending',
      link_target: 'pendientes',
    });

    this.notify();
    return newRecord;
  }

  // Bulk approve records
  public bulkApproveRecords(recordIds: string[], adminUser: Profile): WasteRecord[] {
    const approvedList: WasteRecord[] = [];
    recordIds.forEach((id) => {
      const rec = this.approveRecord(id, adminUser);
      if (rec) approvedList.push(rec);
    });
    return approvedList;
  }

  // Logical deletion only: records remain available in storage/audit history.
  public deleteRecord(recordId: string, adminUser: Profile): boolean {
    const allRecords: WasteRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECORDS) || '[]');
    const record = allRecords.find((r) => r.id === recordId && !r.is_deleted);
    if (!record) return false;

    const previous = { ...record };
    record.is_deleted = true;
    record.deleted_at = new Date().toISOString();
    record.deleted_by = adminUser.id;
    record.updated_at = new Date().toISOString();

    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(allRecords));
    this.addAuditLog(
      adminUser,
      'Anulación',
      'waste_records',
      record.id,
      previous,
      { is_deleted: true, deleted_at: record.deleted_at, deleted_by: adminUser.id },
      `Pesaje ${record.record_code} anulado lógicamente; se conserva para trazabilidad`
    );
    this.notify();
    return true;
  }

  // Approve a waste record (Admin only)
  public approveRecord(recordId: string, adminUser: Profile): WasteRecord | null {
    const records = this.getRecords();
    const record = records.find((r) => r.id === recordId);
    if (!record) return null;

    const oldStatus = record.status;
    record.status = 'approved';
    record.approved_by = adminUser.id;
    record.approved_by_name = adminUser.full_name;
    record.approved_at = new Date().toISOString();
    record.updated_at = new Date().toISOString();

    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));

    // Audit
    this.addAuditLog(adminUser, 'Aprobación', 'waste_records', record.id, { status: oldStatus }, { status: 'approved' }, `Pesaje ${record.record_code} aprobado por administración`);

    // Notification to Gestor
    this.addNotification({
      target_user_id: record.created_by,
      title: 'Tu pesaje fue aprobado',
      message: `El registro ${record.record_code} (${record.weight_kg} kg) fue aprobado por ${adminUser.full_name}.`,
      type: 'approval',
      link_target: 'mis-registros',
    });

    // Notification to Company
    this.addNotification({
      target_company_id: record.company_id,
      title: 'Nuevo retiro registrado y validado',
      message: `Se ha acreditado el pesaje oficial ${record.record_code} de ${record.weight_kg} kg a su cuenta ambiental.`,
      type: 'approval',
      link_target: 'retiros',
    });

    this.notify();
    return record;
  }

  // Reject a waste record (Admin only)
  public rejectRecord(recordId: string, reason: string, adminUser: Profile): WasteRecord | null {
    const records = this.getRecords();
    const record = records.find((r) => r.id === recordId);
    if (!record) return null;

    const oldStatus = record.status;
    record.status = 'rejected';
    record.rejection_reason = reason;
    record.approved_by = adminUser.id;
    record.approved_by_name = adminUser.full_name;
    record.updated_at = new Date().toISOString();

    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));

    // Audit
    this.addAuditLog(adminUser, 'Rechazo', 'waste_records', record.id, { status: oldStatus }, { status: 'rejected', reason }, `Pesaje ${record.record_code} rechazado. Motivo: ${reason}`);

    // Notification to Gestor
    this.addNotification({
      target_user_id: record.created_by,
      title: 'Tu pesaje fue rechazado',
      message: `El registro ${record.record_code} fue rechazado. Motivo: "${reason}". Puedes corregirlo si corresponde.`,
      type: 'rejection',
      link_target: 'mis-registros',
    });

    this.notify();
    return record;
  }

  // Correct a record with full traceability (Admin / Gestor permitted)
  public correctRecord(
    recordId: string,
    newWeight: number,
    reason: string,
    user: Profile,
    newObservations?: string
  ): WasteRecord | null {
    const records = this.getRecords();
    const record = records.find((r) => r.id === recordId);
    if (!record) return null;

    const oldWeight = record.weight_kg;
    if (!record.corrections_history) {
      record.corrections_history = [];
    }

    record.corrections_history.push({
      previous_weight: oldWeight,
      new_weight: newWeight,
      reason,
      corrected_by: user.full_name,
      corrected_at: new Date().toISOString(),
    });

    record.weight_kg = newWeight;
    if (newObservations) {
      record.observations = newObservations;
    }
    // If was rejected and corrected by gestor, send back to pending
    if (record.status === 'rejected') {
      record.status = 'pending';
      record.rejection_reason = undefined;
    }
    record.updated_at = new Date().toISOString();

    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));

    this.addAuditLog(user, 'Corrección', 'waste_records', record.id, { weight_kg: oldWeight }, { weight_kg: newWeight, reason }, `Pesaje ${record.record_code} corregido de ${oldWeight} kg a ${newWeight} kg`);

    this.notify();
    return record;
  }

  // --- Monthly Reports & Monthly Closing ---
  public getMonthlyReports(currentUser?: Profile | null): MonthlyReport[] {
    let reports: MonthlyReport[] = [];
    try {
      reports = JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS) || '[]');
    } catch {
      reports = INITIAL_REPORTS;
    }

    if (currentUser?.role === 'empresa') {
      if (!currentUser.company_id) return [];
      return reports.filter((r) => r.company_id === currentUser.company_id && r.status === 'closed');
    }

    return reports;
  }

  public getMonthlyReport(id: string): MonthlyReport | undefined {
    return this.getMonthlyReports().find((r) => r.id === id);
  }

  public generateMonthlyReport(
    companyId: string,
    month: number,
    year: number,
    adminUser: Profile
  ): MonthlyReport | null {
    const res = this.closeMonthlyPeriod(year, month, adminUser, companyId);
    return res.generatedReports.find((r) => r.company_id === companyId) || null;
  }

  // "Cerrar Período Mensual" (Requirement #23)
  public closeMonthlyPeriod(
    year: number,
    month: number,
    adminUser: Profile,
    companyIdFilter?: string
  ): { generatedReports: MonthlyReport[]; companiesClosed: number } {
    const records = this.getRecords();
    const companies = this.getCompanies();
    const existingReports = this.getMonthlyReports();

    // 1. Identify approved records for this year and month
    const approvedInPeriod = records.filter((r) => {
      if (r.status !== 'approved') return false;
      if (companyIdFilter && r.company_id !== companyIdFilter) return false;
      const recDate = new Date(`${r.record_date}T12:00:00`);
      return recDate.getFullYear() === year && recDate.getMonth() + 1 === month;
    });

    // 2. Group by company
    const companyGroups = new Map<string, WasteRecord[]>();
    for (const rec of approvedInPeriod) {
      const group = companyGroups.get(rec.company_id) || [];
      group.push(rec);
      companyGroups.set(rec.company_id, group);
    }

    const generatedReports: MonthlyReport[] = [];

    companyGroups.forEach((compRecords, companyId) => {
      const company = companies.find((c) => c.id === companyId);
      const companyShortCode = company?.commercial_name
        ? company.commercial_name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase()
        : 'EMP';

      const totalWeight = compRecords.reduce((acc, r) => acc + r.weight_kg, 0);

      // Preserve every historical version instead of overwriting the previous one.
      const previousVersions = existingReports.filter(
        (r) => r.company_id === companyId && r.year === year && r.month === month
      );
      const nextVersion = previousVersions.reduce((max, r) => Math.max(max, r.version), 0) + 1;

      const monthPadded = String(month).padStart(2, '0');
      const reportNumber = `ACTA-${year}-${monthPadded}-${companyShortCode}-001`;
      const nowIso = new Date().toISOString();

      const report: MonthlyReport = {
        id: `rep-${companyId}-${year}-${monthPadded}-v${nextVersion}-${Date.now()}`,
        company_id: companyId,
        year,
        month,
        report_number: reportNumber,
        total_weight_kg: parseFloat(totalWeight.toFixed(2)),
        status: 'closed',
        version: nextVersion,
        generated_at: nowIso,
        generated_by: adminUser.id,
        generated_by_name: adminUser.full_name,
        closed_at: nowIso,
        observations: `Cierre del período mensual ${monthPadded}/${year}. Trazabilidad verificada y actas emitidas por Gestión Ambiental Aeroportuaria.`,
        signer_gestor: Array.from(new Set(compRecords.map((r) => r.created_by_name).filter(Boolean))).join(', ') || 'Gestor ambiental',
        signer_company: company?.responsible_name || 'Representante del Operador Comercial',
        signer_airport: adminUser.full_name,
      };
      existingReports.unshift(report);

      // Link records to this report
      compRecords.forEach((r) => {
        r.monthly_report_id = report.id;
      });

      generatedReports.push(report);

      // Audit Log
      this.addAuditLog(adminUser, 'Cierre mensual', 'monthly_reports', report.id, null, report, `Acta mensual ${report.report_number} cerrada para ${company?.commercial_name || companyId}`);

      // Internal Notification to Company
      const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      const monthName = monthNames[month - 1] || `${month}`;
      this.addNotification({
        target_company_id: companyId,
        title: 'Nueva acta mensual disponible',
        message: `Ya se encuentra disponible su Acta de Gestión de Residuos correspondiente a ${monthName} de ${year}. Peso total: ${report.total_weight_kg.toFixed(2)} kg.`,
        type: 'acta',
        link_target: 'actas',
      });
    });

    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(existingReports));
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
    this.notify();

    return {
      generatedReports,
      companiesClosed: companyGroups.size,
    };
  }

  // --- Notifications ---
  public getNotifications(currentUser?: Profile | null): NotificationItem[] {
    let list: NotificationItem[] = [];
    try {
      list = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
    } catch {
      list = INITIAL_NOTIFICATIONS;
    }

    if (!currentUser) return list;

    return list.filter((n) => {
      if (n.target_user_id && n.target_user_id === currentUser.id) return true;
      if (n.target_role && n.target_role === currentUser.role) return true;
      if (n.target_company_id && n.target_company_id === currentUser.company_id) return true;
      if (!n.target_user_id && !n.target_role && !n.target_company_id) return true;
      return false;
    });
  }

  public addNotification(item: Omit<NotificationItem, 'id' | 'created_at' | 'read'>): NotificationItem {
    const notifications: NotificationItem[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
    const newNotif: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      read: false,
      created_at: new Date().toISOString(),
    };
    notifications.unshift(newNotif);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    this.notify();
    return newNotif;
  }

  public markNotificationAsRead(id: string) {
    const notifications: NotificationItem[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
    const notif = notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
      this.notify();
    }
  }

  public markAllNotificationsAsRead(currentUser: Profile) {
    const notifications: NotificationItem[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
    notifications.forEach((n) => {
      if (
        n.target_user_id === currentUser.id ||
        n.target_role === currentUser.role ||
        n.target_company_id === currentUser.company_id
      ) {
        n.read = true;
      }
    });
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    this.notify();
  }

  // --- Audit Log ---
  public getAuditLog(): AuditLogEntry[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT) || '[]');
    } catch {
      return INITIAL_AUDIT;
    }
  }

  public getAuditLogs(): AuditLogEntry[] {
    return this.getAuditLog();
  }

  public addAuditLog(
    user: Profile,
    action: string,
    entity: AuditLogEntry['entity'],
    entity_id: string,
    old_value?: any,
    new_value?: any,
    details?: string
  ) {
    const list = this.getAuditLog();
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      user_id: user.id,
      user_name: user.full_name,
      action,
      entity,
      entity_id,
      old_value,
      new_value,
      timestamp: new Date().toISOString(),
      details,
    };
    list.unshift(entry);
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(list));
  }


  // Supabase PostgreSQL & RLS SQL Script Generator
  public getSupabaseSchemaSql(): string {
    return this.generateSupabaseSQL();
  }

  public generateSupabaseSQL(): string {
    return `-- ==============================================================================
-- AEROPUERTO INTERNACIONAL MARISCAL SUCRE DE QUITO (UIO)
-- SISTEMA DE TRAZABILIDAD Y CADENA DE CUSTODIA DE RESIDUOS RECICLABLES
-- ESQUEMA SUPABASE POSTGRESQL + ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: profiles (Vinculada a auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'gestor', 'empresa')),
    company_id TEXT,
    position TEXT,
    phone TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA: companies (Catálogo de operadores comerciales que operan en el aeropuerto)
CREATE TABLE IF NOT EXISTS public.companies (
    id TEXT PRIMARY KEY,
    business_name TEXT NOT NULL,
    commercial_name TEXT NOT NULL,
    ruc VARCHAR(13) NOT NULL UNIQUE,
    airport_area TEXT NOT NULL,
    responsible_name TEXT NOT NULL,
    responsible_position TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    observations TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA: waste_types (Catálogo de residuos aprovechables)
CREATE TABLE IF NOT EXISTS public.waste_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit VARCHAR(10) DEFAULT 'kg',
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(20),
    active BOOLEAN DEFAULT true
);

-- 5. TABLA: waste_records (Trazabilidad y pesaje de residuos)
CREATE TABLE IF NOT EXISTS public.waste_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    record_code VARCHAR(30) UNIQUE NOT NULL,
    company_id TEXT NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    waste_type_id TEXT NOT NULL REFERENCES public.waste_types(id) ON DELETE RESTRICT,
    weight_kg NUMERIC(10, 2) NOT NULL CHECK (weight_kg > 0),
    photo_url TEXT NOT NULL,
    record_date DATE NOT NULL,
    record_time TIME NOT NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    observations TEXT,
    rejection_reason TEXT,
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    ocr_detected_weight NUMERIC(10, 2),
    ocr_status TEXT DEFAULT 'not_scanned',
    corrections_history JSONB DEFAULT '[]'::jsonb,
    monthly_report_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA: monthly_reports (Actas mensuales de gestión de residuos)
CREATE TABLE IF NOT EXISTS public.monthly_reports (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    year INT NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    report_number VARCHAR(50) UNIQUE NOT NULL,
    total_weight_kg NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'closed')),
    version INT NOT NULL DEFAULT 1,
    pdf_url TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    generated_by UUID REFERENCES public.profiles(id),
    closed_at TIMESTAMPTZ,
    observations TEXT,
    signer_gestor TEXT,
    signer_company TEXT,
    signer_airport TEXT
);

-- 7. TABLA: audit_log (Auditoría completa e inmutable)
CREATE TABLE IF NOT EXISTS public.audit_log (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id UUID REFERENCES public.profiles(id),
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    details TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function: obtener rol del usuario autenticado
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Helper function: obtener company_id del usuario autenticado
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

-- POLITICAS PARA: waste_records
-- 1. Admin y Gestor pueden consultar todos los registros
CREATE POLICY "Admin_Gestor_Select_WasteRecords" ON public.waste_records
    FOR SELECT USING (public.get_my_role() IN ('admin', 'gestor'));

-- 2. Operador Comercial SOLO puede consultar registros APROBADOS de su propia organización
CREATE POLICY "Empresa_Select_Own_Approved_WasteRecords" ON public.waste_records
    FOR SELECT USING (
        public.get_my_role() = 'empresa' 
        AND company_id = public.get_my_company_id() 
        AND status = 'approved'
    );

-- 3. Gestor y Admin pueden insertar registros
CREATE POLICY "Gestor_Admin_Insert_WasteRecords" ON public.waste_records
    FOR INSERT WITH CHECK (public.get_my_role() IN ('gestor', 'admin'));

-- 4. Únicamente Admin puede modificar o aprobar registros
CREATE POLICY "Admin_Update_WasteRecords" ON public.waste_records
    FOR UPDATE USING (public.get_my_role() = 'admin');

-- POLITICAS PARA: monthly_reports
-- 1. Admin y Gestor pueden ver todas las actas
CREATE POLICY "Admin_Gestor_Select_Reports" ON public.monthly_reports
    FOR SELECT USING (public.get_my_role() IN ('admin', 'gestor'));

-- 2. Operador Comercial SOLO puede consultar actas CERRADAS de su propia organización
CREATE POLICY "Empresa_Select_Own_Closed_Reports" ON public.monthly_reports
    FOR SELECT USING (
        public.get_my_role() = 'empresa' 
        AND company_id = public.get_my_company_id() 
        AND status = 'closed'
    );

-- 3. Únicamente Admin puede crear y cerrar actas
CREATE POLICY "Admin_Manage_Reports" ON public.monthly_reports
    FOR ALL USING (public.get_my_role() = 'admin');

-- POLITICAS PARA: companies
CREATE POLICY "Everyone_Select_Companies" ON public.companies
    FOR SELECT USING (true);
CREATE POLICY "Admin_Manage_Companies" ON public.companies
    FOR ALL USING (public.get_my_role() = 'admin');

-- POLITICAS PARA: waste_types
CREATE POLICY "Everyone_Select_WasteTypes" ON public.waste_types
    FOR SELECT USING (true);
CREATE POLICY "Admin_Manage_WasteTypes" ON public.waste_types
    FOR ALL USING (public.get_my_role() = 'admin');

-- ÍNDICES PARA RENDIMIENTO ÓPTIMO
CREATE INDEX IF NOT EXISTS idx_waste_records_company_status ON public.waste_records (company_id, status);
CREATE INDEX IF NOT EXISTS idx_waste_records_date ON public.waste_records (record_date);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_company_period ON public.monthly_reports (company_id, year, month);
`;
  }
}

export const db = new LocalDatabase();
