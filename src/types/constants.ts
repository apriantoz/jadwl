export const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export const dayIndex: Record<string, number> = Object.fromEntries(
  DAYS.map((day, index) => [day, index]),
);

export const INPUT_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

export const ERROR_FALLBACK = "Terjadi kesalahan. Silakan coba lagi.";