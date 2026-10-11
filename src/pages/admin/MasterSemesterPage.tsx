// src/pages/MasterSemesterPage.tsx

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import type { MasterSemester } from "../../types/master";
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Circle,
  Loader2,
  RefreshCw,
  CalendarDays,
  Search,
  Sparkles,
  GraduationCap,
  X,
  Info,
} from "lucide-react";

type SemesterFormData = {
  tipe_semester: string;
  tahun_ajaran: string;
  is_active: boolean;
};

export const MasterSemesterPage: React.FC = () => {
  const [list, setList] = useState<MasterSemester[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const currentYear = new Date().getFullYear();

  const [tahunAwal, setTahunAwal] = useState<number | string>(currentYear);

  const [formData, setFormData] = useState<SemesterFormData>({
    tipe_semester: "Ganjil",
    tahun_ajaran: `${currentYear}/${currentYear + 1}`,
    is_active: false,
  });

  const [submitting, setSubmitting] = useState(false);

  // Pesan error untuk ditampilkan kepada pengguna.
  const [errorMessage, setErrorMessage] = useState("");

  // Mengambil data semester dari Supabase.
  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase
        .from("master_semester")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        throw error;
      }

      setList((data ?? []) as MasterSemester[]);
    } catch (error) {
      console.error("Gagal mengambil data semester:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal mengambil data semester.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Filter pencarian semester dan tahun ajaran.
  const filteredList = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return list;
    }

    return list.filter(
      (item) =>
        item.tipe_semester?.toLowerCase().includes(keyword) ||
        item.tahun_ajaran?.toLowerCase().includes(keyword),
    );
  }, [list, search]);

  // Semester yang sedang aktif.
  const activeSemester = useMemo(
    () => list.find((item) => item.is_active),
    [list],
  );

  const ganjilCount = useMemo(
    () => list.filter((item) => item.tipe_semester === "Ganjil").length,
    [list],
  );

  const genapCount = useMemo(
    () => list.filter((item) => item.tipe_semester === "Genap").length,
    [list],
  );

  // Mengubah status aktif semester.
  // Hanya satu semester yang boleh aktif pada satu waktu.
  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    setErrorMessage("");

    try {
      if (!currentStatus) {
        // Nonaktifkan semester lainnya terlebih dahulu.
        const { error: deactivateError } = await supabase
          .from("master_semester")
          .update({ is_active: false })
          .neq("id", id);

        if (deactivateError) {
          throw deactivateError;
        }
      }

      const { error } = await supabase
        .from("master_semester")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) {
        throw error;
      }

      await fetchData();
    } catch (error) {
      console.error("Gagal mengubah status semester:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal mengubah status semester.",
      );
    }
  };

  // Membentuk tahun ajaran dari tahun awal.
  const handleTahunAwalChange = (year: number | string) => {
    setTahunAwal(year);

    const numYear = Number(year);

    if (
      String(year).trim() !== "" &&
      Number.isInteger(numYear) &&
      numYear >= 2000 &&
      numYear <= 2099
    ) {
      setFormData((prev) => ({
        ...prev,
        tahun_ajaran: `${numYear}/${numYear + 1}`,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        tahun_ajaran: "",
      }));
    }
  };

  // Mengembalikan formulir ke kondisi awal.
  const resetForm = () => {
    const year = new Date().getFullYear();

    setIsEditing(false);
    setSelectedId(null);
    setTahunAwal(year);

    setFormData({
      tipe_semester: "Ganjil",
      tahun_ajaran: `${year}/${year + 1}`,
      is_active: false,
    });

    setErrorMessage("");
  };

  // Membuka modal tambah.
  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  // Membuka modal edit.
  const openEditModal = (item: MasterSemester) => {
    const initialYear = item.tahun_ajaran
      ? item.tahun_ajaran.split("/")[0]
      : String(new Date().getFullYear());

    setIsEditing(true);
    setSelectedId(item.id);
    setTahunAwal(initialYear);

    setFormData({
      tipe_semester: item.tipe_semester,
      tahun_ajaran: item.tahun_ajaran,
      is_active: item.is_active,
    });

    setErrorMessage("");
    setShowModal(true);
  };

  // Menyimpan semester baru atau perubahan semester.
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (submitting) {
      return;
    }

    const numYear = Number(tahunAwal);

    if (
      String(tahunAwal).trim() === "" ||
      !Number.isInteger(numYear) ||
      numYear < 2000 ||
      numYear > 2099 ||
      !formData.tahun_ajaran
    ) {
      setErrorMessage("Tahun ajaran tidak valid. Masukkan tahun 2000–2099.");
      return;
    }

    if (isEditing && selectedId === null) {
      setErrorMessage("ID semester tidak ditemukan.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      // Jika semester akan diaktifkan, nonaktifkan semester lainnya.
      if (formData.is_active) {
        let deactivateQuery = supabase
          .from("master_semester")
          .update({ is_active: false });

        if (selectedId !== null) {
          deactivateQuery = deactivateQuery.neq("id", selectedId);
        }

        const { error: deactivateError } = await deactivateQuery;

        if (deactivateError) {
          throw deactivateError;
        }
      }

      if (isEditing && selectedId !== null) {
        const { error } = await supabase
          .from("master_semester")
          .update(formData)
          .eq("id", selectedId);

        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase
          .from("master_semester")
          .insert([formData]);

        if (error) {
          throw error;
        }
      }

      setShowModal(false);
      resetForm();

      await fetchData();
    } catch (error) {
      console.error("Gagal menyimpan semester:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan semester. Silakan coba lagi.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Menghapus semester.
  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Hapus master semester ini? Tindakan ini tidak dapat dibatalkan.",
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage("");

    try {
      const { error } = await supabase
        .from("master_semester")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      await fetchData();
    } catch (error) {
      console.error("Gagal menghapus semester:", error);

      setErrorMessage(
        error instanceof Error ? error.message : "Gagal menghapus semester.",
      );
    }
  };

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50">
                <GraduationCap className="h-4 w-4" />
              </span>
              Administrasi Akademik
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Master Semester
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Atur periode semester dan tentukan semester yang sedang aktif
              untuk operasional akademik.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => void fetchData()}
              title="Refresh data"
              className="btn"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>

            <button onClick={openAddModal} className="btn">
              <Plus className="h-4 w-4" />
              Tambah Semester
            </button>
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            <Info className="mt-0.5 h-4 w-4 shrink-0" />

            <div className="min-w-0 flex-1">
              <p className="font-semibold">Terjadi kesalahan</p>
              <p className="mt-1 break-words">{errorMessage}</p>
            </div>

            <button
              type="button"
              onClick={() => setErrorMessage("")}
              aria-label="Tutup pesan kesalahan"
              className="rounded-md p-1 hover:bg-rose-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Summary cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="card w-full bg-base-300 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium">Semester Aktif</p>
                <p className="mt-2 text-xl font-bold">
                  {activeSemester?.tipe_semester || "Belum ada"}
                </p>
                <p className="mt-1 text-sm">
                  {activeSemester?.tahun_ajaran || "Belum ditentukan"}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="card w-full bg-base-200 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium">Total Semester</p>
                <p className="mt-2 text-2xl font-bold">{list.length}</p>
                <p className="mt-1 text-xs">Periode tersimpan</p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <CalendarDays className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="card w-full bg-base-200 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium">Semester Ganjil</p>
                <p className="mt-2 text-2xl font-bold">{ganjilCount}</p>
                <p className="mt-1 text-xs">Periode tersimpan</p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Circle className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="card w-full bg-base-200 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium">Semester Genap</p>
                <p className="mt-2 text-2xl font-bold">{genapCount}</p>
                <p className="mt-1 text-xs">Periode tersimpan</p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Active semester highlight */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <CalendarDays className="h-6 w-6" />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  Periode Perkuliahan Saat Ini
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-lg font-bold text-slate-900">
                    {activeSemester
                      ? `${activeSemester.tipe_semester} · ${activeSemester.tahun_ajaran}`
                      : "Belum ada semester aktif"}
                  </span>

                  {activeSemester && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      AKTIF
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <span>
                Hanya satu semester yang dapat menjadi semester aktif pada satu
                waktu.
              </span>
            </div>
          </div>
        </div>

        {/* Main table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Daftar Semester
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Kelola periode akademik yang tersedia di sistem.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari semester atau tahun..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-9 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Hapus pencarian"
                  className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                </div>

                <p className="mt-3 text-sm font-medium text-slate-700">
                  Memuat data semester...
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Mohon tunggu sebentar.
                </p>
              </div>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <CalendarDays className="h-7 w-7" />
              </div>

              <h3 className="mt-4 text-sm font-bold text-slate-800">
                {search
                  ? "Semester tidak ditemukan"
                  : "Belum ada master semester"}
              </h3>

              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                {search
                  ? "Coba gunakan kata kunci atau tahun ajaran yang berbeda."
                  : "Tambahkan periode semester pertama untuk mulai mengatur kalender akademik."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={openAddModal}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" />
                  Tambah Semester
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70">
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Semester
                      </th>

                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Tahun Ajaran
                      </th>

                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Status
                      </th>

                      <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Aksi
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredList.map((item) => (
                      <tr
                        key={item.id}
                        className="group transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                                item.tipe_semester === "Ganjil"
                                  ? "bg-amber-50 text-amber-600"
                                  : "bg-emerald-50 text-emerald-600"
                              }`}
                            >
                              <CalendarDays className="h-4 w-4" />
                            </div>

                            <div>
                              <p className="font-semibold text-slate-900">
                                Semester {item.tipe_semester}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-400">
                                ID #{item.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
                            {item.tahun_ajaran}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              void handleToggleActive(item.id, item.is_active)
                            }
                            title={
                              item.is_active
                                ? "Klik untuk menonaktifkan"
                                : "Klik untuk mengaktifkan"
                            }
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                              item.is_active
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                          >
                            {item.is_active ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <Circle className="h-3.5 w-3.5" />
                            )}

                            {item.is_active ? "Aktif" : "Tidak Aktif"}
                          </button>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-1.5 opacity-80 transition group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              title="Edit semester"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-indigo-600 transition hover:bg-indigo-50"
                            >
                              <Edit className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => void handleDelete(item.id)}
                              title="Hapus semester"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 transition hover:bg-rose-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="divide-y divide-slate-100 md:hidden">
                {filteredList.map((item) => (
                  <div key={item.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            item.tipe_semester === "Ganjil"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          <CalendarDays className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">
                            Semester {item.tipe_semester}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {item.tahun_ajaran}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          void handleToggleActive(item.id, item.is_active)
                        }
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          item.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {item.is_active ? "AKTIF" : "NONAKTIF"}
                      </button>
                    </div>

                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDelete(item.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!loading && filteredList.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3">
              <p className="text-xs text-slate-400">
                Menampilkan{" "}
                <span className="font-semibold text-slate-600">
                  {filteredList.length}
                </span>{" "}
                dari{" "}
                <span className="font-semibold text-slate-600">
                  {list.length}
                </span>{" "}
                semester
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal tambah/edit */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !submitting) {
              setShowModal(false);
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    {isEditing ? (
                      <Edit className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </div>

                  <h2 className="text-lg font-bold text-slate-900">
                    {isEditing
                      ? "Edit Master Semester"
                      : "Tambah Master Semester"}
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Tentukan tipe semester, tahun ajaran, dan status aktif.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!submitting) {
                      setShowModal(false);
                    }
                  }}
                  disabled={submitting}
                  aria-label="Tutup modal"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-5 px-6 py-6">
                {/* Tipe semester */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Tipe Semester
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    {(["Ganjil", "Genap"] as const).map((type) => {
                      const selected = formData.tipe_semester === type;

                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              tipe_semester: type,
                            }))
                          }
                          className={`rounded-xl border p-3 text-left transition ${
                            selected
                              ? "border-indigo-300 bg-indigo-50 ring-2 ring-indigo-100"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-sm font-bold ${
                                selected ? "text-indigo-700" : "text-slate-700"
                              }`}
                            >
                              {type}
                            </span>

                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                type === "Ganjil"
                                  ? "bg-amber-400"
                                  : "bg-emerald-400"
                              }`}
                            />
                          </div>

                          <p className="mt-1 text-[11px] text-slate-400">
                            Semester {type.toLowerCase()}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tahun ajaran */}
                <div>
                  <label
                    htmlFor="tahun_awal"
                    className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    Tahun Ajaran
                  </label>

                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <div className="relative">
                      <input
                        id="tahun_awal"
                        type="number"
                        required
                        min={2000}
                        max={2099}
                        step={1}
                        placeholder="2026"
                        value={tahunAwal}
                        onChange={(e) => handleTahunAwalChange(e.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                      />
                    </div>

                    <span className="text-sm font-bold text-slate-300">/</span>

                    <div className="flex h-11 items-center rounded-xl border border-indigo-100 bg-indigo-50 px-3">
                      <span className="text-sm font-bold text-indigo-700">
                        {formData.tahun_ajaran
                          ? formData.tahun_ajaran.split("/")[1] || "—"
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <p className="mt-2 text-[11px] text-slate-400">
                    Tahun berikutnya dibuat otomatis. Contoh: 2026 → 2026/2027.
                  </p>
                </div>

                {/* Status aktif */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          is_active: e.target.checked,
                        }))
                      }
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />

                    <span>
                      <span className="block text-sm font-semibold text-slate-800">
                        Set sebagai Semester Aktif
                      </span>

                      <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                        Semester aktif akan digunakan sebagai periode utama
                        operasional akademik.
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Error dalam modal */}
              {errorMessage && (
                <div className="mx-6 mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-700">
                  {errorMessage}
                </div>
              )}

              {/* Tombol modal */}
              <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
                <button
                  type="button"
                  onClick={() => {
                    if (!submitting) {
                      setShowModal(false);
                    }
                  }}
                  disabled={submitting}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-w-24 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}

                  {submitting
                    ? "Menyimpan..."
                    : isEditing
                      ? "Simpan Perubahan"
                      : "Simpan Semester"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterSemesterPage;
