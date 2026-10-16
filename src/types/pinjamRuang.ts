export type StatusPinjamRuang = "pending" | "terima" | "tolak";

export interface PinjamRuang {
  id: number;
  created_at: string;
  ruang_id: number;
  prodi_id: number;
  nama: string;
  nim: string;
  wa: string;
  tujuan: string;
  status: StatusPinjamRuang;

  // Jadwal peminjaman
  tanggal_pinjam: string;
  jam_mulai: string;
  jam_selesai: string;
}

export interface CreatePinjamRuang {
  ruang_id: number;
  prodi_id: number;
  nama: string;
  wa: string;
  nim: string;
  tujuan: string;
  tanggal_pinjam: string;
  jam_mulai: string;
  jam_selesai: string;
}

export interface UpdateStatusPinjamRuang {
  id: number;
  status: StatusPinjamRuang;
}
