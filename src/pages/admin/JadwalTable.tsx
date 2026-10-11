// src/pages/JadwalTable.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import {
  getBentrokDetails,
  getMkName,
  getRuangName,
  type ScheduleItem,
} from "../../utils/scheduleHelpers";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit,
  FileText,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";

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

interface DropdownOption {
  id: number;
  nama: string;
}

type ViewMode = "jadwal" | "ruang";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

const dayIndex: Record<string, number> = Object.fromEntries(
  DAYS.map((day, index) => [day, index]),
);

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

const ERROR_FALLBACK = "Terjadi kesalahan. Silakan coba lagi.";

const getErrorMessage = (error: unknown, fallback = ERROR_FALLBACK) => {
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

const getSemesterLabel = (semester: any): string => {
  return (
    semester.nama_semester ||
    semester.semester ||
    semester.nama ||
    [semester.tahun_ajaran, semester.tipe_semester].filter(Boolean).join(" ") ||
    `Semester #${semester.id}`
  );
};

const getItemId = (item: JadwalItem): number | null => {
  const id = Number(item.id ?? item.jadwal_id);

  return Number.isFinite(id) && id > 0 ? id : null;
};

const toTimeValue = (value?: string | null): string => {
  if (!value) return "";

  // Mendukung format TIME "08:00:00" dari PostgreSQL.
  return value.slice(0, 5);
};

const JadwalTable: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const editIdParam = searchParams.get("edit");

  const [jadwalList, setJadwalList] = useState<JadwalItem[]>([]);
  const [mkOptions, setMkOptions] = useState<DropdownOption[]>([]);
  const [ruangOptions, setRuangOptions] = useState<DropdownOption[]>([]);
  const [semesterOptions, setSemesterOptions] = useState<DropdownOption[]>([]);

  const [activeSemesterId, setActiveSemesterId] = useState<number | null>(null);
  const [activeSemesterName, setActiveSemesterName] =
    useState("Semester aktif");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [dayFilter, setDayFilter] = useState("Semua Hari");
  const [roomFilter, setRoomFilter] = useState("Semua Ruang");

  const [viewMode, setViewMode] = useState<ViewMode>("jadwal");

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [showConflictModal, setShowConflictModal] = useState(false);
  const [selectedConflictItem, setSelectedConflictItem] =
    useState<JadwalItem | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [mkSearch, setMkSearch] = useState("");
  const [mkOpen, setMkOpen] = useState(false);

  const [formData, setFormData] = useState({
    mk_id: "",
    ruang_id: "",
    master_semester_id: "",
    hari: "Senin",
    jam_mulai: "08:00",
    jam_selesai: "10:00",
    catatan: "",
  });

  // =========================================================
  // FETCH MASTER DATA
  // =========================================================

  const fetchMasterData = useCallback(async () => {
    const [mkRes, roomRes, semRes] = await Promise.all([
      supabase.from("mk").select("*"),
      supabase.from("ruang").select("*"),
      supabase.from("master_semester").select("*"),
    ]);

    if (mkRes.error) throw mkRes.error;
    if (roomRes.error) throw roomRes.error;
    if (semRes.error) throw semRes.error;

    setMkOptions(
      (mkRes.data || []).map((item: any) => ({
        id: Number(item.id),
        nama: item.nama_mk || item.nama || `MK ID ${item.id}`,
      })),
    );

    setRuangOptions(
      (roomRes.data || []).map((item: any) => ({
        id: Number(item.id),
        nama: item.nama_ruang || item.nama || `Ruang ID ${item.id}`,
      })),
    );

    const semesters = semRes.data || [];

    setSemesterOptions(
      semesters.map((item: any) => ({
        id: Number(item.id),
        nama: getSemesterLabel(item),
      })),
    );

    const active = semesters.find(
      (item: any) =>
        item.is_active === true ||
        item.aktif === true ||
        item.status === "aktif",
    );

    const fallback = active || semesters[0];

    if (fallback) {
      setActiveSemesterId(Number(fallback.id));
      setActiveSemesterName(getSemesterLabel(fallback));
    } else {
      setActiveSemesterId(null);
      setActiveSemesterName("Belum ada semester");
    }
  }, []);

  // =========================================================
  // FETCH JADWAL
  // =========================================================

  const fetchJadwal = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from("view_jadwal_detail")
      .select("*");

    if (queryError) throw queryError;

    setJadwalList(
      (data || []).map((item: any) => ({
        ...item,
        id: item.jadwal_id ?? item.id,
      })),
    );
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([fetchJadwal(), fetchMasterData()]);
    } catch (err: unknown) {
      console.error("Gagal memuat data jadwal:", err);
      setError(getErrorMessage(err, "Gagal memuat data jadwal."));
    } finally {
      setLoading(false);
    }
  }, [fetchJadwal, fetchMasterData]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // =========================================================
  // HELPERS
  // =========================================================

  const getSemesterName = (item: JadwalItem) => {
    if (item.tahun_ajaran && item.tipe_semester) {
      return `${item.tahun_ajaran} (${item.tipe_semester})`;
    }

    if (item.master_semester_id) {
      const semester = semesterOptions.find(
        (option) => option.id === Number(item.master_semester_id),
      );

      return semester?.nama || `Semester #${item.master_semester_id}`;
    }

    return "-";
  };

  const isConflict = useCallback(
    (item: JadwalItem) => {
      const details = getBentrokDetails(item, jadwalList);

      return Boolean(item.is_bentrok || (details && details.length > 0));
    },
    [jadwalList],
  );

  const openConflictDetails = (item: JadwalItem) => {
    setSelectedConflictItem(item);
    setShowConflictModal(true);
  };

  const editConflictSchedule = (item: JadwalItem) => {
    setShowConflictModal(false);

    // Beri waktu agar modal bentrok tertutup sebelum modal edit dibuka.
    window.setTimeout(() => {
      openEdit(item);
    }, 80);
  };

  // =========================================================
  // FILTER DAN PENGELOMPOKAN
  // =========================================================

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return jadwalList
      .filter((item) => {
        const text = [
          getMkName(item),
          getRuangName(item),
          item.kode_mk || "",
          item.nama_prodi || "",
          item.hari || "",
          getSemesterName(item),
          item.catatan || "",
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch = !query || text.includes(query);

        const matchesDay =
          dayFilter === "Semua Hari" || item.hari === dayFilter;

        const matchesRoom =
          roomFilter === "Semua Ruang" || String(item.ruang_id) === roomFilter;

        return matchesSearch && matchesDay && matchesRoom;
      })
      .sort((a, b) => {
        const dayDifference =
          (dayIndex[a.hari || ""] ?? 9) - (dayIndex[b.hari || ""] ?? 9);

        return (
          dayDifference ||
          String(a.jam_mulai || "").localeCompare(String(b.jam_mulai || ""))
        );
      });
  }, [jadwalList, search, dayFilter, roomFilter, semesterOptions]);

  const groupedByDay = useMemo(
    () =>
      DAYS.map((day) => ({
        day,
        items: filtered.filter((item) => item.hari === day),
      })).filter((group) => group.items.length > 0),
    [filtered],
  );

  const roomsInUse = useMemo(
    () =>
      new Set(
        jadwalList
          .map((item) => item.ruang_id)
          .filter((id) => id !== null && id !== undefined),
      ).size,
    [jadwalList],
  );

  const totalConflict = useMemo(
    () => jadwalList.filter(isConflict).length,
    [jadwalList, isConflict],
  );

  const roomGroups = useMemo(() => {
    const rooms =
      roomFilter !== "Semua Ruang"
        ? ruangOptions.filter((room) => String(room.id) === roomFilter)
        : ruangOptions;

    return rooms
      .map((room) => ({
        room,
        items: filtered.filter((item) => Number(item.ruang_id) === room.id),
      }))
      .filter((group) => group.items.length > 0);
  }, [ruangOptions, filtered, roomFilter]);

  // =========================================================
  // FORM TAMBAH DAN EDIT
  // =========================================================

  const openAdd = () => {
    setIsEditing(false);
    setSelectedId(null);
    setFormError("");
    setMkSearch("");
    setMkOpen(false);

    setFormData({
      mk_id: mkOptions[0]?.id ? String(mkOptions[0].id) : "",
      ruang_id:
        roomFilter !== "Semua Ruang"
          ? roomFilter
          : ruangOptions[0]?.id
            ? String(ruangOptions[0].id)
            : "",
      master_semester_id: activeSemesterId
        ? String(activeSemesterId)
        : semesterOptions[0]?.id
          ? String(semesterOptions[0].id)
          : "",
      hari: dayFilter !== "Semua Hari" ? dayFilter : "Senin",
      jam_mulai: "08:00",
      jam_selesai: "10:00",
      catatan: "",
    });

    setShowModal(true);
  };

  const openEdit = (item: JadwalItem) => {
    const id = getItemId(item);

    if (id === null) {
      setError("ID jadwal tidak ditemukan. Data tidak dapat diedit.");
      return;
    }

    setIsEditing(true);
    setSelectedId(id);
    setFormError("");
    setMkSearch(getMkName(item));
    setMkOpen(false);

    setFormData({
      mk_id: String(item.mk_id ?? ""),
      ruang_id: String(item.ruang_id ?? ""),
      master_semester_id: String(item.master_semester_id ?? ""),
      hari: item.hari || "Senin",
      jam_mulai: toTimeValue(item.jam_mulai) || "08:00",
      jam_selesai: toTimeValue(item.jam_selesai) || "10:00",
      catatan: item.catatan || "",
    });

    setShowModal(true);
  };

  // Buka otomatis modal edit dari URL ?edit=ID.
  useEffect(() => {
    if (!editIdParam || loading) return;

    const editId = Number(editIdParam);

    if (!Number.isFinite(editId) || editId <= 0) {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          next.delete("edit");
          return next;
        },
        { replace: true },
      );
      return;
    }

    const item = jadwalList.find((schedule) => getItemId(schedule) === editId);

    if (item) {
      openEdit(item);
    } else {
      setError(`Jadwal dengan ID ${editId} tidak ditemukan.`);
    }

    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete("edit");
        return next;
      },
      { replace: true },
    );
  }, [editIdParam, loading, jadwalList, setSearchParams]);

  // =========================================================
  // SIMPAN JADWAL
  // =========================================================

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (!formData.mk_id || !formData.ruang_id || !formData.master_semester_id) {
      setFormError("Mata kuliah, ruangan, dan semester wajib dipilih.");
      return;
    }

    if (
      !formData.jam_mulai ||
      !formData.jam_selesai ||
      formData.jam_selesai <= formData.jam_mulai
    ) {
      setFormError("Jam selesai harus lebih besar dari jam mulai.");
      return;
    }

    if (isEditing && selectedId === null) {
      setFormError("ID jadwal tidak valid.");
      return;
    }

    setSubmitting(true);

    const payload = {
      mk_id: Number(formData.mk_id),
      ruang_id: Number(formData.ruang_id),
      master_semester_id: Number(formData.master_semester_id),
      hari: formData.hari,
      jam_mulai: formData.jam_mulai,
      jam_selesai: formData.jam_selesai,
      catatan: formData.catatan.trim() || null,
    };

    try {
      if (isEditing) {
        const { error: updateError } = await supabase
          .from("jadwal")
          .update(payload)
          .eq("id", selectedId!);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("jadwal")
          .insert([payload]);

        if (insertError) throw insertError;
      }

      setShowModal(false);
      await refresh();
    } catch (err: unknown) {
      console.error("Gagal menyimpan jadwal:", err);
      setFormError(getErrorMessage(err, "Gagal menyimpan jadwal."));
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // HAPUS JADWAL
  // =========================================================

  const remove = async (id: number) => {
    const confirmed = window.confirm(
      "Apakah Anda yakin ingin menghapus jadwal ini?",
    );

    if (!confirmed) return;

    try {
      const { error: deleteError } = await supabase
        .from("jadwal")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      await refresh();
    } catch (err: unknown) {
      console.error("Gagal menghapus jadwal:", err);

      window.alert(
        "Gagal menghapus data: " + getErrorMessage(err, "Terjadi kesalahan."),
      );
    }
  };

  const selectedMk = mkOptions.find(
    (option) => String(option.id) === formData.mk_id,
  );

  const filteredMkOptions = mkOptions.filter((option) =>
    option.nama.toLowerCase().includes(mkSearch.toLowerCase()),
  );

  // =========================================================
  // KOMPONEN BARIS JADWAL
  // =========================================================

  const ScheduleRow = ({ item }: { item: JadwalItem }) => {
    const conflict = isConflict(item);
    const conflictItems = getBentrokDetails(item, jadwalList) || [];
    const firstConflict = conflictItems[0] as JadwalItem | undefined;
    const id = getItemId(item) ?? 0;

    return (
      <div
        className={`group relative border-b border-slate-100 px-4 py-3.5 transition last:border-b-0 sm:px-5 ${
          conflict ? "bg-red-50/45 hover:bg-red-50" : "hover:bg-slate-50/80"
        }`}
      >
        <div className="grid grid-cols-[72px_1fr_auto] items-center gap-3 sm:grid-cols-[110px_1fr_250px_auto] sm:gap-4">
          {/* WAKTU */}
          <div className="self-start pt-0.5">
            <div
              className={`text-xs font-bold ${
                conflict ? "text-red-600" : "text-slate-700"
              }`}
            >
              {toTimeValue(item.jam_mulai) || "--:--"}
            </div>

            <div className="mt-0.5 text-[11px] text-slate-400">
              {toTimeValue(item.jam_selesai) || "--:--"}
            </div>
          </div>

          {/* INFORMASI JADWAL */}
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  conflict
                    ? "bg-red-100 text-red-600"
                    : "bg-indigo-50 text-indigo-600"
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
              </span>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {getMkName(item)}
                </p>

                <p className="truncate text-[10px] font-medium text-slate-400">
                  {item.nama_prodi || "Prodi belum tersedia"}
                  {item.kode_mk && ` • ${item.kode_mk}`}
                </p>
              </div>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 pl-9 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3 text-slate-400" />
                {getRuangName(item)}
              </span>

              <span className="hidden sm:inline">{getSemesterName(item)}</span>

              {item.catatan && (
                <span className="hidden max-w-[240px] truncate md:inline-flex md:items-center md:gap-1">
                  <FileText className="h-3 w-3 text-slate-300" />
                  {item.catatan}
                </span>
              )}
            </div>
          </div>

          {/* STATUS BENTROK */}
          <div className="hidden sm:block">
            {conflict ? (
              <button
                type="button"
                onClick={() => openConflictDetails(item)}
                className="group/conflict w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-left transition hover:border-red-300 hover:bg-red-100 hover:shadow-sm"
                title="Klik untuk melihat seluruh jadwal yang bentrok"
              >
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                    <AlertTriangle className="h-3.5 w-3.5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide text-red-700">
                        Bentrok dengan
                      </span>

                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-red-400 transition group-hover/conflict:translate-x-0.5" />
                    </div>

                    {firstConflict ? (
                      <>
                        <p className="mt-0.5 truncate text-[11px] font-bold text-red-700">
                          {firstConflict.nama_prodi || "Prodi belum tersedia"}
                        </p>

                        <p className="truncate text-[10px] font-medium text-red-600">
                          {getMkName(firstConflict)}
                        </p>

                        {conflictItems.length > 1 && (
                          <p className="mt-0.5 text-[9px] font-semibold text-red-500">
                            +{conflictItems.length - 1} jadwal lainnya
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="mt-0.5 text-[10px] font-medium text-red-500">
                        Klik untuk melihat detail bentrok
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                <CheckCircle2 className="h-3 w-3" />
                Aman
              </span>
            )}
          </div>

          {/* AKSI: SEMUA PENGGUNA LOGIN */}
          <div className="flex items-center justify-end gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
            <button
              type="button"
              onClick={() => openEdit(item)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-indigo-600 hover:bg-indigo-50"
              title="Edit jadwal"
              aria-label="Edit jadwal"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (id > 0) void remove(id);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
              title="Hapus jadwal"
              aria-label="Hapus jadwal"
              disabled={id <= 0}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* STATUS BENTROK DI MOBILE */}
        {conflict && (
          <div className="mt-2 sm:hidden">
            <button
              type="button"
              onClick={() => openConflictDetails(item)}
              className="flex w-full items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-2.5 py-2 text-left transition hover:bg-red-100"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <AlertTriangle className="h-3.5 w-3.5" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-extrabold uppercase tracking-wide text-red-600">
                  Bentrok dengan
                </p>

                {firstConflict ? (
                  <>
                    <p className="truncate text-[10px] font-bold text-red-700">
                      {firstConflict.nama_prodi || "Prodi belum tersedia"}
                      {" • "}
                      {getMkName(firstConflict)}
                    </p>

                    {conflictItems.length > 1 && (
                      <p className="text-[9px] font-medium text-red-500">
                        +{conflictItems.length - 1} jadwal lainnya
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-[10px] text-red-500">
                    Klik untuk melihat detail
                  </p>
                )}
              </div>

              <ChevronRight className="h-4 w-4 shrink-0 text-red-400" />
            </button>
          </div>
        )}
      </div>
    );
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-full bg-slate-50/60">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* HEADER */}
        <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <CalendarDays className="h-4 w-4" />
              </span>

              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Schedule Workspace
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Kelola Jadwal
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Atur jadwal dengan cepat tanpa harus berhadapan dengan tabel yang
              terlalu padat.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={loading}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={openAdd}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Tambah Jadwal
            </button>
          </div>
        </header>

        {/* TOOLBAR */}
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari mata kuliah, prodi, kode, ruang, atau catatan..."
              className={`${INPUT_CLASS} pl-9`}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            <select
              value={dayFilter}
              onChange={(event) => setDayFilter(event.target.value)}
              className={`${INPUT_CLASS} min-w-0 sm:w-36`}
              aria-label="Filter hari"
            >
              <option>Semua Hari</option>
              {DAYS.map((day) => (
                <option key={day}>{day}</option>
              ))}
            </select>

            <select
              value={roomFilter}
              onChange={(event) => setRoomFilter(event.target.value)}
              className={`${INPUT_CLASS} min-w-0 sm:w-44`}
              aria-label="Filter ruangan"
            >
              <option>Semua Ruang</option>
              {ruangOptions.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.nama}
                </option>
              ))}
            </select>
          </div>

          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setViewMode("jadwal")}
              className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition ${
                viewMode === "jadwal"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Jadwal
            </button>

            <button
              type="button"
              onClick={() => setViewMode("ruang")}
              className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition ${
                viewMode === "ruang"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              Ruang
            </button>
          </div>
        </div>

        {/* STATISTIK */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
            <p className="text-[11px] font-medium text-slate-400">
              Semester aktif
            </p>
            <p className="mt-1 truncate text-sm font-bold text-slate-800">
              {activeSemesterName}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
            <p className="text-[11px] font-medium text-slate-400">
              Jadwal tampil
            </p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {filtered.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
            <p className="text-[11px] font-medium text-slate-400">
              Ruangan terpakai
            </p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {roomsInUse}
            </p>
          </div>

          <div
            className={`rounded-2xl border bg-white p-3.5 shadow-sm ${
              totalConflict ? "border-red-200" : "border-slate-200"
            }`}
          >
            <p className="text-[11px] font-medium text-slate-400">Bentrok</p>
            <p
              className={`mt-1 text-xl font-bold ${
                totalConflict ? "text-red-600" : "text-slate-900"
              }`}
            >
              {totalConflict}
            </p>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Gagal memuat data</p>
              <p className="mt-0.5 break-words text-xs">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="rounded-lg p-1 hover:bg-red-100"
              aria-label="Tutup pesan error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* WORKSPACE UTAMA */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {viewMode === "jadwal"
                  ? "Jadwal Per Hari"
                  : "Pemakaian Ruangan"}
              </h2>

              <p className="mt-0.5 text-xs text-slate-400">
                {viewMode === "jadwal"
                  ? "Urutan waktu otomatis dari pagi hingga sore."
                  : "Lihat kapan setiap ruangan digunakan."}
              </p>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              {filtered.length} jadwal · {roomsInUse} ruangan
            </div>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
              <p className="mt-3 text-sm font-semibold text-slate-700">
                Memuat jadwal...
              </p>
            </div>
          ) : filtered.length === 0 ? (
            /* KOSONG */
            <div className="flex min-h-[340px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <CalendarDays className="h-7 w-7" />
              </div>

              <p className="mt-4 font-semibold text-slate-800">
                Tidak ada jadwal ditemukan
              </p>

              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
                Coba ubah pencarian atau filter. Jika belum ada jadwal,
                tambahkan jadwal baru.
              </p>

              {!search &&
                dayFilter === "Semua Hari" &&
                roomFilter === "Semua Ruang" && (
                  <button
                    type="button"
                    onClick={openAdd}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Jadwal
                  </button>
                )}
            </div>
          ) : viewMode === "jadwal" ? (
            /* TAMPILAN JADWAL */
            <div>
              {groupedByDay.map((group) => (
                <div
                  key={group.day}
                  className="border-b border-slate-200 last:border-b-0"
                >
                  <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-slate-50/95 px-4 py-2.5 backdrop-blur sm:px-5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-indigo-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        {group.day}
                      </span>
                    </div>

                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-400 ring-1 ring-slate-200">
                      {group.items.length} jadwal
                    </span>
                  </div>

                  {group.items.map((item, index) => (
                    <ScheduleRow
                      key={getItemId(item) ?? `${group.day}-${index}`}
                      item={item}
                    />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            /* TAMPILAN RUANG */
            <div>
              {roomGroups.map(({ room, items }) => (
                <div
                  key={room.id}
                  className="border-b border-slate-200 last:border-b-0"
                >
                  <div className="flex items-center justify-between bg-slate-50/95 px-4 py-3 sm:px-5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                        <MapPin className="h-4 w-4" />
                      </span>

                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {room.nama}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {items.length} jadwal penggunaan
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setRoomFilter(String(room.id))}
                      className="hidden rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-500 hover:text-indigo-600 sm:block"
                    >
                      Fokus ruang
                    </button>
                  </div>

                  {DAYS.map((day) => {
                    const dayItems = items.filter((item) => item.hari === day);

                    if (!dayItems.length) return null;

                    return (
                      <div key={day}>
                        <div className="px-4 pt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:px-5">
                          {day}
                        </div>

                        {dayItems.map((item, index) => (
                          <ScheduleRow
                            key={
                              getItemId(item) ?? `${room.id}-${day}-${index}`
                            }
                            item={item}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ===================================================== */}
      {/* MODAL DETAIL BENTROK                                  */}
      {/* ===================================================== */}
      {showConflictModal && selectedConflictItem && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowConflictModal(false);
            }
          }}
        >
          <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-red-200 bg-white shadow-2xl">
            {/* HEADER */}
            <div className="flex items-start justify-between border-b border-red-100 bg-red-50/70 px-5 py-4 sm:px-6">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <h2 className="text-base font-bold text-red-800">
                    Detail Jadwal Bentrok
                  </h2>
                  <p className="mt-0.5 text-xs text-red-500">
                    Jadwal berikut menggunakan ruangan dan waktu yang saling
                    bertabrakan.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowConflictModal(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-red-400 hover:bg-red-100 hover:text-red-600"
                aria-label="Tutup detail bentrok"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto">
              {/* JADWAL TERPILIH */}
              <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Jadwal yang dipilih
                </p>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                      <BookOpen className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-800">
                        {getMkName(selectedConflictItem)}
                      </p>

                      <p className="mt-0.5 truncate text-[10px] font-medium text-slate-500">
                        {selectedConflictItem.nama_prodi ||
                          "Prodi belum tersedia"}
                        {selectedConflictItem.kode_mk &&
                          ` • ${selectedConflictItem.kode_mk}`}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {toTimeValue(selectedConflictItem.jam_mulai) ||
                            "--:--"}{" "}
                          -{" "}
                          {toTimeValue(selectedConflictItem.jam_selesai) ||
                            "--:--"}
                        </span>

                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {getRuangName(selectedConflictItem)}
                        </span>

                        <span>{selectedConflictItem.hari || "-"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* DAFTAR BENTROK */}
              <div className="px-5 py-4 sm:px-6">
                {(() => {
                  const conflictDetails =
                    getBentrokDetails(selectedConflictItem, jadwalList) || [];

                  return (
                    <>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            Bentrok dengan
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            Seluruh jadwal yang terdeteksi bentrok dengan jadwal
                            ini.
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold text-red-700">
                          {conflictDetails.length} jadwal
                        </span>
                      </div>

                      {conflictDetails.length > 0 ? (
                        <div className="space-y-2.5">
                          {conflictDetails.map((rawItem, index) => {
                            const conflictItem =
                              rawItem as unknown as JadwalItem;

                            const conflictId =
                              getItemId(conflictItem) ?? `conflict-${index}`;

                            return (
                              <div
                                key={conflictId}
                                className="rounded-xl border border-slate-200 bg-white p-3.5 transition hover:border-red-200 hover:bg-red-50/30"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                                    <AlertTriangle className="h-4 w-4" />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-slate-800">
                                          {getMkName(conflictItem)}
                                        </p>

                                        <p className="mt-0.5 truncate text-[10px] font-medium text-slate-500">
                                          {conflictItem.nama_prodi ||
                                            "Prodi belum tersedia"}
                                          {conflictItem.kode_mk &&
                                            ` • ${conflictItem.kode_mk}`}
                                        </p>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          editConflictSchedule(conflictItem)
                                        }
                                        className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-indigo-50 px-3 text-[10px] font-bold text-indigo-600 transition hover:bg-indigo-100"
                                      >
                                        <Edit className="h-3 w-3" />
                                        Edit
                                      </button>
                                    </div>

                                    <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                                      <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                                        <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                                          Hari & Waktu
                                        </p>
                                        <p className="mt-0.5 text-[10px] font-semibold text-slate-700">
                                          {conflictItem.hari || "-"} ·{" "}
                                          {toTimeValue(
                                            conflictItem.jam_mulai,
                                          ) || "--:--"}{" "}
                                          -{" "}
                                          {toTimeValue(
                                            conflictItem.jam_selesai,
                                          ) || "--:--"}
                                        </p>
                                      </div>

                                      <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                                        <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                                          Ruangan
                                        </p>
                                        <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-700">
                                          {getRuangName(conflictItem)}
                                        </p>
                                      </div>

                                      <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                                        <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                                          Semester
                                        </p>
                                        <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-700">
                                          {getSemesterName(conflictItem)}
                                        </p>
                                      </div>

                                      {conflictItem.catatan && (
                                        <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                                          <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                                            Catatan
                                          </p>
                                          <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-700">
                                            {conflictItem.catatan}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center">
                          <AlertTriangle className="mx-auto h-6 w-6 text-slate-300" />
                          <p className="mt-2 text-xs font-semibold text-slate-600">
                            Detail bentrok tidak ditemukan
                          </p>
                          <p className="mt-1 text-[10px] text-slate-400">
                            Status bentrok tersedia dari database, tetapi helper
                            tidak mengembalikan detail jadwal terkait.
                          </p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex justify-end border-t border-slate-100 bg-slate-50/70 px-5 py-3.5 sm:px-6">
              <button
                type="button"
                onClick={() => setShowConflictModal(false)}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* MODAL TAMBAH / EDIT JADWAL                            */}
      {/* ===================================================== */}
      {showModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) {
              setShowModal(false);
            }
          }}
        >
          <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  {isEditing ? (
                    <Edit className="h-5 w-5" />
                  ) : (
                    <Plus className="h-5 w-5" />
                  )}
                </div>

                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {isEditing ? "Edit Jadwal" : "Tambah Jadwal Baru"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Atur mata kuliah, ruang, waktu, dan semester.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!submitting) setShowModal(false);
                }}
                disabled={submitting}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 disabled:opacity-50"
                aria-label="Tutup formulir"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submit}>
              <div className="max-h-[70vh] overflow-y-auto px-5 py-5 sm:px-6">
                {formError && (
                  <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* INFORMASI AKADEMIK */}
                <div className="mb-5">
                  <h3 className="text-sm font-bold text-slate-800">
                    Informasi Akademik
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Pilih mata kuliah, ruangan, dan semester.
                  </p>
                </div>

                {/* PENCARIAN MATA KULIAH */}
                <div className="mb-4">
                  <label
                    htmlFor="jadwal-mk"
                    className="mb-1.5 block text-xs font-semibold text-slate-600"
                  >
                    Mata Kuliah
                  </label>

                  <div className="relative">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                      <input
                        id="jadwal-mk"
                        required
                        autoComplete="off"
                        value={mkOpen ? mkSearch : selectedMk?.nama || ""}
                        onFocus={() => {
                          setMkOpen(true);
                          setMkSearch(selectedMk?.nama || "");
                        }}
                        onChange={(event) => {
                          const value = event.target.value;
                          setMkSearch(value);
                          setMkOpen(true);

                          // Jangan gunakan pilihan sebelumnya jika teks diubah.
                          if (selectedMk && value !== selectedMk.nama) {
                            setFormData((previous) => ({
                              ...previous,
                              mk_id: "",
                            }));
                          }
                        }}
                        placeholder="Cari mata kuliah..."
                        className={`${INPUT_CLASS} pl-9 pr-9`}
                      />

                      <ChevronDown
                        className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition ${
                          mkOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>

                    {mkOpen && (
                      <>
                        <button
                          type="button"
                          aria-label="Tutup pilihan mata kuliah"
                          className="fixed inset-0 z-10 cursor-default"
                          onClick={() => setMkOpen(false)}
                        />

                        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                          {filteredMkOptions.length > 0 ? (
                            filteredMkOptions.map((option) => (
                              <button
                                type="button"
                                key={option.id}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => {
                                  setFormData((previous) => ({
                                    ...previous,
                                    mk_id: String(option.id),
                                  }));
                                  setMkSearch(option.nama);
                                  setMkOpen(false);
                                }}
                                className={`w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-indigo-50 ${
                                  String(option.id) === formData.mk_id
                                    ? "bg-indigo-50 font-semibold text-indigo-700"
                                    : "text-slate-700"
                                }`}
                              >
                                {option.nama}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-4 text-center text-xs text-slate-400">
                              Mata kuliah tidak ditemukan.
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* RUANG DAN SEMESTER */}
                <div className="mb-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="jadwal-ruang"
                      className="mb-1.5 block text-xs font-semibold text-slate-600"
                    >
                      Ruangan
                    </label>

                    <select
                      id="jadwal-ruang"
                      required
                      value={formData.ruang_id}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          ruang_id: event.target.value,
                        }))
                      }
                      className={INPUT_CLASS}
                    >
                      <option value="" disabled>
                        -- Pilih Ruang --
                      </option>
                      {ruangOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.nama}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="jadwal-semester"
                      className="mb-1.5 block text-xs font-semibold text-slate-600"
                    >
                      Semester
                    </label>

                    <select
                      id="jadwal-semester"
                      required
                      value={formData.master_semester_id}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          master_semester_id: event.target.value,
                        }))
                      }
                      className={INPUT_CLASS}
                    >
                      <option value="" disabled>
                        -- Pilih Semester --
                      </option>
                      {semesterOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* WAKTU PERKULIAHAN */}
                <div className="mb-5 border-t border-slate-100 pt-5">
                  <h3 className="text-sm font-bold text-slate-800">
                    Waktu Perkuliahan
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Tentukan hari dan rentang waktu.
                  </p>
                </div>

                <div className="mb-5 grid gap-4 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor="jadwal-hari"
                      className="mb-1.5 block text-xs font-semibold text-slate-600"
                    >
                      Hari
                    </label>

                    <select
                      id="jadwal-hari"
                      value={formData.hari}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          hari: event.target.value,
                        }))
                      }
                      className={INPUT_CLASS}
                    >
                      {DAYS.map((day) => (
                        <option key={day}>{day}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="jadwal-mulai"
                      className="mb-1.5 block text-xs font-semibold text-slate-600"
                    >
                      Jam Mulai
                    </label>

                    <input
                      id="jadwal-mulai"
                      required
                      type="time"
                      value={formData.jam_mulai}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          jam_mulai: event.target.value,
                        }))
                      }
                      className={INPUT_CLASS}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="jadwal-selesai"
                      className="mb-1.5 block text-xs font-semibold text-slate-600"
                    >
                      Jam Selesai
                    </label>

                    <input
                      id="jadwal-selesai"
                      required
                      type="time"
                      value={formData.jam_selesai}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          jam_selesai: event.target.value,
                        }))
                      }
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>

                {/* CATATAN */}
                <div className="border-t border-slate-100 pt-5">
                  <label
                    htmlFor="jadwal-catatan"
                    className="mb-1.5 block text-xs font-semibold text-slate-600"
                  >
                    Catatan{" "}
                    <span className="font-normal text-slate-400">
                      (opsional)
                    </span>
                  </label>

                  <textarea
                    id="jadwal-catatan"
                    rows={3}
                    value={formData.catatan}
                    onChange={(event) =>
                      setFormData((previous) => ({
                        ...previous,
                        catatan: event.target.value,
                      }))
                    }
                    placeholder="Tambahkan informasi tambahan..."
                    className={`${INPUT_CLASS} resize-none`}
                  />
                </div>
              </div>

              {/* FOOTER FORM */}
              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={() => {
                    if (!submitting) setShowModal(false);
                  }}
                  disabled={submitting}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {isEditing ? "Simpan Perubahan" : "Tambah Jadwal"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JadwalTable;
