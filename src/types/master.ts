// src/types/master.ts
export interface MasterSemester {
  id: number;
  tipe_semester: string; // 'Ganjil' | 'Genap'
  tahun_ajaran: string;  // e.g. '2024/2025'
  is_active: boolean;
  created_at?: string;
}

export interface Prodi {
  id: number;
  nama_prodi: string;
  created_at?: string;
}

export interface SemesterItem {
  id: number;
  semester: number; // 1, 2, 3, dst.
}

export interface TipeRuang {
  id: number;
  tipe_ruang: string; // e.g. 'Teori', 'Laboratorium'
}

export interface MataKuliah {
  id: number;
  kode_mk: string | null;
  nama_mk: string;
  sks: number;
  prodi_id: number;
  smt_id: number;
  prodi?: Prodi;
  semester?: SemesterItem;
}

export interface Ruangan {
  id: number;
  nama_ruang: string;
  tipe_ruang_id: number;
  kapasitas: number;
  tipe_ruang?: TipeRuang;
}