// src/utils/scheduleHelpers.ts

export interface ScheduleItem {
  id?: number;
  jadwal_id?: number;

  hari?: string;
  jam_mulai?: string;
  jam_selesai?: string;

  ruang_id?: number;
  nama_ruang?: string;

  master_semester_id?: number;

  is_bentrok?: boolean;

  // Mata kuliah
  mk_id?: number;
  nama_mk?: string;
  kode_mk?: string;

  // Program studi
  nama_prodi?: string;

  // Relasi nested
  mk?: {
    nama_mk?: string;
    nama?: string;
  };

  ruang?: {
    nama_ruang?: string;
    nama?: string;
  };

  // Informasi tambahan
  catatan?: string;
  tahun_ajaran?: string;
  tipe_semester?: string;

  created_at?: string;
}

/**
 * Ambil ID jadwal secara konsisten.
 *
 * Beberapa sumber data menggunakan `id`,
 * sedangkan view menggunakan `jadwal_id`.
 */
export const getScheduleId = (
  item: ScheduleItem
): number | undefined => {
  return item.id ?? item.jadwal_id;
};

/**
 * Ambil nama mata kuliah.
 *
 * Prioritas:
 * 1. nama_mk dari view
 * 2. nested mk.nama_mk
 * 3. nested mk.nama
 * 4. fallback berdasarkan mk_id
 */
export const getMkName = (
  item: ScheduleItem
): string => {
  return (
    item.nama_mk ||
    item.mk?.nama_mk ||
    item.mk?.nama ||
    (item.mk_id
      ? `MK #${item.mk_id}`
      : '-')
  );
};

/**
 * Ambil nama ruangan.
 *
 * Prioritas:
 * 1. nama_ruang dari view
 * 2. nested ruang.nama_ruang
 * 3. nested ruang.nama
 * 4. fallback berdasarkan ruang_id
 */
export const getRuangName = (
  item: ScheduleItem
): string => {
  return (
    item.nama_ruang ||
    item.ruang?.nama_ruang ||
    item.ruang?.nama ||
    (item.ruang_id
      ? `Ruang #${item.ruang_id}`
      : '-')
  );
};

/**
 * Konversi waktu HH:MM menjadi total menit.
 *
 * Contoh:
 * "07:30" -> 450
 * "13.45" -> 825
 */
export const parseToMinutes = (
  timeStr?: string
): number => {
  if (!timeStr) return 0;

  const cleanTime = timeStr
    .trim()
    .replace('.', ':');

  const [hours, minutes] = cleanTime
    .split(':')
    .map(Number);

  return (
    (hours || 0) * 60 +
    (minutes || 0)
  );
};

/**
 * Deteksi seluruh jadwal yang bentrok
 * dengan jadwal tertentu.
 *
 * Kriteria bentrok:
 * - bukan jadwal yang sama
 * - semester yang sama
 * - hari yang sama
 * - ruangan yang sama
 * - waktu saling beririsan
 *
 * IMPORTANT:
 * Fungsi ini mengembalikan OBJECT JADWAL ASLI,
 * bukan object hasil mapping baru.
 *
 * Dengan begitu data seperti:
 * - id
 * - jadwal_id
 * - nama_prodi
 * - kode_mk
 * - mk_id
 * - ruang_id
 * - master_semester_id
 * - catatan
 * dll
 *
 * tetap tersedia untuk modal detail dan proses EDIT.
 */
export const getBentrokDetails = <
  T extends ScheduleItem
>(
  currentItem: T,
  list: T[]
): T[] | null => {
  const currentId =
    getScheduleId(currentItem);

  const start1 = parseToMinutes(
    currentItem.jam_mulai
  );

  const end1 = parseToMinutes(
    currentItem.jam_selesai
  );

  const conflictingItems = list.filter(
    (otherItem) => {
      const otherId =
        getScheduleId(otherItem);

      // ==========================================
      // 1. Jangan membandingkan dengan dirinya sendiri
      // ==========================================
      if (
        currentId !== undefined &&
        otherId !== undefined &&
        otherId === currentId
      ) {
        return false;
      }

      // ==========================================
      // 2. Hari harus sama
      // ==========================================
      const currentHari =
        currentItem.hari
          ?.trim()
          .toLowerCase();

      const otherHari =
        otherItem.hari
          ?.trim()
          .toLowerCase();

      if (
        currentHari !== otherHari
      ) {
        return false;
      }

      // ==========================================
      // 3. Semester harus sama
      // ==========================================
      //
      // Jika kedua jadwal memiliki
      // master_semester_id, maka harus sama.
      //
      // Jika salah satu tidak tersedia,
      // pengecekan tetap dilanjutkan sebagai
      // fallback untuk data lama / data manual.
      //
      if (
        currentItem.master_semester_id !==
          undefined &&
        otherItem.master_semester_id !==
          undefined &&
        Number(
          currentItem.master_semester_id
        ) !==
          Number(
            otherItem.master_semester_id
          )
      ) {
        return false;
      }

      // ==========================================
      // 4. Ruangan harus sama
      // ==========================================

      // Prioritas utama: ID ruangan
      const sameRuangId =
        currentItem.ruang_id !==
          undefined &&
        otherItem.ruang_id !==
          undefined &&
        Number(
          currentItem.ruang_id
        ) ===
          Number(
            otherItem.ruang_id
          );

      // Fallback: nama ruangan
      const currentRuang =
        currentItem.nama_ruang
          ?.trim()
          .toLowerCase();

      const otherRuang =
        otherItem.nama_ruang
          ?.trim()
          .toLowerCase();

      const sameRuangName =
        Boolean(currentRuang) &&
        Boolean(otherRuang) &&
        currentRuang === otherRuang;

      if (
        !sameRuangId &&
        !sameRuangName
      ) {
        return false;
      }

      // ==========================================
      // 5. Cek irisan waktu
      // ==========================================

      const start2 =
        parseToMinutes(
          otherItem.jam_mulai
        );

      const end2 =
        parseToMinutes(
          otherItem.jam_selesai
        );

      return (
        start1 < end2 &&
        end1 > start2
      );
    }
  );

  // Tidak ada bentrok
  if (
    conflictingItems.length === 0
  ) {
    return null;
  }

  // Kembalikan object jadwal ASLI
  // supaya seluruh properti tetap tersedia.
  return conflictingItems;
};