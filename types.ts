export type UserRole = 'admin' | 'gestor' | 'empresa';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  company_id: string | null;
  phone?: string;
  position?: string;
  active: boolean;
  created_at: string;
}

export interface Company {
  id: string;
  business_name: string;
  commercial_name: string;
  ruc: string;
  airport_area: string;
  responsible_name: string;
  responsible_position: string;
  email: string;
  phone: string;
  responsible_email?: string;
  responsible_phone?: string;
  active: boolean;
  observations?: string;
  created_at?: string;
}

export interface WasteType {
  id: string;
  name: string;
  category: string;
  unit: string; // 'kg'
  code: string;
  description?: string;
  color?: string;
  active: boolean;
}

export type RecordStatus = 'pending' | 'approved' | 'rejected';
export type OcrStatus = 'match' | 'mismatch' | 'manual_review' | 'not_scanned';

export interface RecordCorrection {
  previous_weight: number;
  new_weight: number;
  reason: string;
  corrected_by: string;
  corrected_at: string;
}

export interface WasteRecord {
  id: string;
  record_code: string; // e.g. UIO-RW-YYYY-######
  company_id: string;
  waste_type_id: string;
  weight_kg: number;
  photo_url: string;
  record_date: string; // YYYY-MM-DD
  record_time: string; // HH:mm
  created_by: string; // Gestor profile ID
  created_by_name?: string;
  status: RecordStatus;
  observations?: string;
  rejection_reason?: string;
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  ocr_detected_weight?: number | null;
  ocr_status?: OcrStatus;
  ocr_notes?: string;
  corrections_history?: RecordCorrection[];
  is_sync_pending?: boolean; // PWA offline queue
  monthly_report_id?: string;
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by?: string;
  created_at: string;
  updated_at: string;
}

export interface MonthlyReport {
  id: string;
  company_id: string;
  year: number;
  month: number; // 1-12
  report_number: string; // e.g. ACTA-YYYY-MM-OPERADOR-001
  total_weight_kg: number;
  status: 'draft' | 'closed';
  version: number;
  pdf_url?: string;
  generated_at: string;
  generated_by: string;
  generated_by_name?: string;
  closed_at?: string;
  observations?: string;
  signer_gestor: string;
  signer_company: string;
  signer_airport: string;
}

export interface MonthlyReportItem {
  id: string;
  report_id: string;
  record_id: string;
  weight_kg: number;
}

export interface AuditLogEntry {
  id: string;
  user_id: string;
  user_name: string;
  actor_name?: string;
  actor_role?: string;
  action: string; // 'Creación', 'Aprobación', 'Rechazo', 'Corrección', 'Cierre mensual', etc.
  entity: 'waste_records' | 'monthly_reports' | 'companies' | 'waste_types' | 'auth' | 'users' | string;
  entity_id: string;
  old_value?: any;
  new_value?: any;
  timestamp: string;
  created_at?: string;
  details?: string;
}

export type AuditLog = AuditLogEntry;

export interface NotificationItem {
  id: string;
  target_user_id?: string;
  target_role?: UserRole;
  target_company_id?: string;
  title: string;
  message: string;
  type: 'acta' | 'approval' | 'rejection' | 'pending' | 'info';
  read: boolean;
  created_at: string;
  link_target?: string;
}

export interface BalanceOcrResult {
  detected_weight: number | null;
  confidence: number;
  display_readable: boolean;
  visual_notes: string;
  ocr_status: OcrStatus;
  match: boolean;
  alert_message: string;
}
