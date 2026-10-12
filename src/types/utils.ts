import { ERROR_FALLBACK } from "./constants";
import type { JadwalItem } from "./types";

export const getErrorMessage = (error: unknown, fallback = ERROR_FALLBACK) => {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return fallback;
};

export const getSemesterLabel = (semester: any): string => {
  return (
    semester.nama_semester ||
    semester.semester ||
    semester.nama ||
    [semester.tahun_ajaran, semester.tipe_semester].filter(Boolean).join(" ") ||
    `Semester #${semester.id}`
  );
};

export const getItemId = (item: JadwalItem): number | null => {
  const id = Number(item.id ?? item.jadwal_id);
  return Number.isFinite(id) && id > 0 ? id : null;
};

export const toTimeValue = (value?: string | null): string => {
  if (!value) return "";
  return value.slice(0, 5);
};