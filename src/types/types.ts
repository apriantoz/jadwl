import type { ScheduleItem } from "../utils/scheduleHelpers";

export interface JadwalItem extends ScheduleItem {
  id?: number;
  jadwal_id?: number;
  mk_id?: number;
  ruang_id?: number;
  master_semester_id?: number;
  kode_mk?: string;
  nama_prodi?: string;
  tahun_ajaran?: string;
  tipe_semester?: string;
  catatan?: string;
  created_at?: string;
  is_bentrok?: boolean;
}

export interface DropdownOption {
  id: number;
  nama: string;
}

export type ViewMode = "jadwal" | "ruang";
