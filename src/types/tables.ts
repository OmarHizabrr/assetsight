// أنواع البيانات للجداول المستخرجة من Tables.dart

export interface Department {
  id?: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  notes?: string;
  timestamp?: string;
}

export interface Office {
  id?: string;
  department_id?: string;
  name: string;
  floor?: string;
  room?: string;
  created_at?: string;
  updated_at?: string;
  notes?: string;
  timestamp?: string;
}

export interface AssetType {
  id?: string;
  name: string;
  category?: string;
  description?: string;
  created_at?: string;
  notes?: string;
  timestamp?: string;
}

export interface AssetStatus {
  id?: string;
  name: string;
  description?: string;
  notes?: string;
  timestamp?: string;
}

export interface AssetName {
  id?: string;
  name: string;
  category?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  notes?: string;
  timestamp?: string;
}

export interface Category {
  id?: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  notes?: string;
  timestamp?: string;
}

export interface User {
  id?: string;
  username: string;
  full_name: string;
  email?: string;
  phone?: string;
  office_id?: string;
  role?: string;
  password?: string;
  permissions?: string[];
  is_active?: number | boolean;
  created_at?: string;
  updated_at?: string;
  notes?: string;
  timestamp?: string;
}

export interface Asset {
  id?: string;
  asset_name_id: string;
  asset_tag: string;
  serial_number?: string;
  type_id: string;
  status_id: string;
  category?: string;
  description?: string;
  purchase_date?: string;
  purchase_value?: number;
  current_value?: number;
  location_office_id: string;
  custodian_user_id?: string;
  warranty_end?: string;
  depreciation_method?: string;
  expected_lifetime_years?: number;
  residual_value?: number;
  supplier?: string;
  invoice_number?: string;
  last_maintenance_date?: string;
  is_active?: number | boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  notes?: string;
  timestamp?: string;
}

export interface AssetAttachment {
  id?: string;
  asset_id: string;
  file_path: string;
  file_type?: string;
  note?: string;
  uploaded_by?: string;
  uploaded_at?: string;
  notes?: string;
  timestamp?: string;
}

export interface AssetHistory {
  id?: string;
  asset_id: string;
  event_type: string;
  from_status?: string;
  to_status?: string;
  from_office?: string;
  to_office?: string;
  performed_by?: string;
  performed_at?: string;
  comment?: string;
  related_document?: string;
  notes?: string;
  timestamp?: string;
}

export interface InventoryCycle {
  id?: string;
  name: string;
  start_date?: string;
  end_date?: string;
  department_id?: string;
  created_by?: string;
  created_at?: string;
  notes?: string;
  timestamp?: string;
}

export interface InventoryItem {
  id?: string;
  cycle_id: string;
  asset_id?: string;
  scanned_tag?: string;
  scanned_office_id?: string;
  found?: number | boolean;
  note?: string;
  scanned_by?: string;
  scanned_at?: string;
  notes?: string;
  timestamp?: string;
}

