// src/pages/JadwalPublikPage.tsx
import React, { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  Clock,
  Info,
  MapPin,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { useJadwalData } from "../hooks/useJadwalData";
import { DAYS, dayIndex } from "../types/constants";
import { getItemId, toTimeValue } from "../types/utils";
import type { JadwalItem, ViewMode } from "../types/types";

// Import getMkName, getRuangName, dan getBentrokDetails
import {
  getMkName,
  getRuangName,
  getBentrokDetails,
} from "../utils/scheduleHelpers";

const JadwalPublikPage: React.FC = () => {
  const {
    jadwalList,
    ruangOptions,
    semesterOptions,
    activeSemesterName,
    loading,
    error,
    setError,
    refresh,
  } = useJadwalData();

  const [search, setSearch] = useState("");
  const [dayFilter, setDayFilter] = useState("Semua Hari");
  const [roomFilter, setRoomFilter] = useState("Semua Ruang");
  const [viewMode, setViewMode] = useState<ViewMode>("jadwal");

  const [selectedItem, setSelectedItem] = useState<JadwalItem | null>(null);

  // =========================================================
  // HELPERS
  // =========================================================

  const getSemesterName = useCallback(
    (item: JadwalItem) => {
      if (item.tahun_ajaran && item.tipe_semester) {
        return `${item.tahun_ajaran} (${item.tipe_semester})`;
      }
      if (item.master_semester_id) {
        return (
          semesterOptions.find((o) => o.id === Number(item.master_semester_id))
            ?.nama || `Semester #${item.master_semester_id}`
        );
      }
      return "-";
    },
    [semesterOptions],
  );

  // =========================================================
  // FILTER & GROUPING
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
        const diff =
          (dayIndex[a.hari || ""] ?? 9) - (dayIndex[b.hari || ""] ?? 9);
        return (
          diff ||
          String(a.jam_mulai || "").localeCompare(String(b.jam_mulai || ""))
        );
      });
  }, [jadwalList, search, dayFilter, roomFilter, getSemesterName]);

  const groupedByDay = useMemo(
    () =>
      DAYS.map((day) => ({
        day,
        items: filtered.filter((item) => item.hari === day),
      })).filter((g) => g.items.length > 0),
    [filtered],
  );

  const roomGroups = useMemo(() => {
    const rooms =
      roomFilter !== "Semua Ruang"
        ? ruangOptions.filter((r) => String(r.id) === roomFilter)
        : ruangOptions;

    return rooms
      .map((room) => ({
        room,
        items: filtered.filter((item) => Number(item.ruang_id) === room.id),
      }))
      .filter((g) => g.items.length > 0);
  }, [ruangOptions, filtered, roomFilter]);

  const roomsInUse = useMemo(
    () =>
      new Set(
        jadwalList
          .map((i) => i.ruang_id)
          .filter((id) => id !== null && id !== undefined),
      ).size,
    [jadwalList],
  );

  // Perbaikan: Tambahkan const
  const hasFilter =
    Boolean(search) ||
    dayFilter !== "Semua Hari" ||
    roomFilter !== "Semua Ruang";

  const resetFilter = () => {
    setSearch("");
    setDayFilter("Semua Hari");
    setRoomFilter("Semua Ruang");
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-base-200/40">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {/* ===================== HERO ===================== */}
        <header className="card mb-6 overflow-hidden border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <CalendarDays className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    Jadwal Akademik
                  </span>
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-base-content">
                  Jadwal Perkuliahan
                </h1>

                <p className="mt-1 max-w-2xl text-sm text-base-content/60">
                  Lihat jadwal kuliah berdasarkan hari, ruangan, dan mata kuliah
                  yang tersedia pada semester aktif.
                </p>
              </div>

              <button
                type="button"
                onClick={() => void refresh()}
                disabled={loading}
                className="btn"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>

            <div className="divider my-0" />

            <div className="flex flex-wrap items-center gap-3">
              <div className="badge badge-primary badge-soft gap-1.5 py-3 font-semibold">
                <Info className="h-3.5 w-3.5" />
                Semester aktif: {activeSemesterName}
              </div>

              <div className="badge badge-ghost gap-1.5 py-3 font-medium">
                <CalendarDays className="h-3.5 w-3.5" />
                {filtered.length} jadwal tampil
              </div>

              <div className="badge badge-ghost gap-1.5 py-3 font-medium">
                <MapPin className="h-3.5 w-3.5" />
                {roomsInUse} ruangan dipakai
              </div>
            </div>
          </div>
        </header>

        {/* ===================== TOOLBAR ===================== */}
        <div className="card mb-6 border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body flex-col gap-3 p-4 lg:flex-row lg:items-center">
            <label className="input flex-1">
              <Search className="h-4 w-4 opacity-50" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari mata kuliah, prodi, kode, ruang, atau catatan..."
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="btn btn-ghost btn-xs btn-square"
                  aria-label="Hapus pencarian"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </label>

            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="select lg:w-40"
              aria-label="Filter hari"
            >
              <option>Semua Hari</option>
              {DAYS.map((day) => (
                <option key={day}>{day}</option>
              ))}
            </select>

            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="select lg:w-48"
              aria-label="Filter ruangan"
            >
              <option>Semua Ruang</option>
              {ruangOptions.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.nama}
                </option>
              ))}
            </select>

            <div className="tabs tabs-box">
              <button
                type="button"
                onClick={() => setViewMode("jadwal")}
                className={`tab gap-1.5 ${
                  viewMode === "jadwal" ? "tab-active" : ""
                }`}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Per Hari
              </button>
              <button
                type="button"
                onClick={() => setViewMode("ruang")}
                className={`tab gap-1.5 ${
                  viewMode === "ruang" ? "tab-active" : ""
                }`}
              >
                <MapPin className="h-3.5 w-3.5" />
                Per Ruang
              </button>
            </div>
          </div>
        </div>

        {/* ===================== ERROR ===================== */}
        {error && (
          <div role="alert" className="alert alert-error mb-5">
            <AlertTriangle className="h-5 w-5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Gagal memuat data</p>
              <p className="mt-0.5 break-all text-xs">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="btn btn-ghost btn-sm btn-square"
              aria-label="Tutup pesan error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ===================== KONTEN ===================== */}
        {loading ? (
          <div className="card border border-base-300 bg-base-100 shadow-sm">
            <div className="flex min-h-90 flex-col items-center justify-center">
              <span className="loading loading-spinner loading-lg text-primary" />
              <p className="mt-3 text-sm font-semibold text-base-content/70">
                Memuat jadwal...
              </p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card border border-base-300 bg-base-100 shadow-sm">
            <div className="flex min-h-85 flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-base-200 text-base-content/40">
                <CalendarDays className="h-7 w-7" />
              </div>

              <p className="mt-4 font-semibold text-base-content">
                Tidak ada jadwal ditemukan
              </p>

              <p className="mt-1 max-w-sm text-xs leading-5 text-base-content/50">
                {hasFilter
                  ? "Coba ubah kata kunci atau filter yang kamu gunakan."
                  : "Belum ada jadwal yang tersedia untuk semester ini."}
              </p>

              {hasFilter && (
                <button
                  type="button"
                  onClick={resetFilter}
                  className="btn btn-sm mt-4"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>
        ) : viewMode === "jadwal" ? (
          /* ============ TAMPILAN PER HARI ============ */
          <div className="space-y-5">
            {groupedByDay.map((group) => (
              <div
                key={group.day}
                className="card border border-base-300 bg-base-100 shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-base-200 px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                    <span className="text-sm font-bold uppercase tracking-wider text-base-content">
                      {group.day}
                    </span>
                  </div>

                  <span className="badge badge-ghost badge-sm">
                    {group.items.length} jadwal
                  </span>
                </div>

                <div className="divide-y divide-base-200">
                  {group.items.map((item, index) => {
                    const bentrokList = getBentrokDetails(item, jadwalList);
                    const isBentrok = Boolean(
                      bentrokList && bentrokList.length > 0,
                    );

                    return (
                      <button
                        key={getItemId(item) ?? `${group.day}-${index}`}
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className="group flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-base-200/60"
                      >
                        {/* Waktu */}
                        <div className="w-24 shrink-0 self-start">
                          <p className="text-sm font-bold text-base-content">
                            {toTimeValue(item.jam_mulai) || "--:--"}
                          </p>
                          <p className="mt-0.5 text-[11px] text-base-content/40">
                            s.d. {toTimeValue(item.jam_selesai) || "--:--"}
                          </p>
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-base-content">
                              {getMkName(item)}
                            </p>

                            {(item.is_bentrok || isBentrok) && (
                              <span className="badge badge-xs badge-warning gap-1 font-medium">
                                <AlertTriangle className="h-3 w-3" />
                                Bentrok (
                                {bentrokList![0].nama_prodi || "Prodi Lain"}-
                                {getMkName(bentrokList![0])})
                              </span>
                            )}
                          </div>

                          <p className="truncate text-[11px] text-base-content/50">
                            {item.nama_prodi || "Prodi belum tersedia"}
                            {item.kode_mk && ` • ${item.kode_mk}`}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-base-content/60">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {getRuangName(item)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {getSemesterName(item)}
                            </span>
                          </div>
                        </div>

                        {/* Chevron hint */}
                        <div className="hidden shrink-0 text-base-content/30 transition group-hover:text-primary sm:block">
                          <Clock className="h-4 w-4" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ============ TAMPILAN PER RUANG ============ */
          <div className="space-y-5">
            {roomGroups.map(({ room, items }) => (
              <div
                key={room.id}
                className="card border border-base-300 bg-base-100 shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-base-200 px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-base-content">
                        {room.nama}
                      </p>
                      <p className="text-[10px] text-base-content/50">
                        {items.length} jadwal penggunaan
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setRoomFilter(String(room.id))}
                    className="btn btn-xs"
                  >
                    Fokus ruang
                  </button>
                </div>

                {DAYS.map((day) => {
                  const dayItems = items.filter((item) => item.hari === day);
                  if (!dayItems.length) return null;

                  return (
                    <div
                      key={day}
                      className="border-b border-base-200 last:border-b-0"
                    >
                      <div className="bg-base-200/50 px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-base-content/60">
                        {day}
                      </div>

                      <div className="divide-y divide-base-200">
                        {dayItems.map((item, index) => {
                          const bentrokList = getBentrokDetails(
                            item,
                            jadwalList,
                          );
                          const isBentrok = Boolean(
                            bentrokList && bentrokList.length > 0,
                          );

                          return (
                            <button
                              key={
                                getItemId(item) ?? `${room.id}-${day}-${index}`
                              }
                              type="button"
                              onClick={() => setSelectedItem(item)}
                              className="group flex w-full items-center gap-4 px-5 py-3 text-left transition hover:bg-base-200/60"
                            >
                              <div className="w-24 shrink-0">
                                <p className="text-sm font-bold text-base-content">
                                  {toTimeValue(item.jam_mulai) || "--:--"}
                                </p>
                                <p className="mt-0.5 text-[11px] text-base-content/40">
                                  s.d.{" "}
                                  {toTimeValue(item.jam_selesai) || "--:--"}
                                </p>
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold text-base-content">
                                    {getMkName(item)}
                                  </p>
                                  {(item.is_bentrok || isBentrok) && (
                                    <span className="badge badge-xs badge-warning gap-1 font-medium">
                                      <AlertTriangle className="h-3 w-3" />
                                      Bentrok di ruang ini
                                    </span>
                                  )}
                                </div>
                                <p className="truncate text-[11px] text-base-content/50">
                                  {item.nama_prodi || "Prodi belum tersedia"}
                                  {item.kode_mk && ` • ${item.kode_mk}`}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Footer note */}
        <p className="mt-6 text-center text-[11px] text-base-content/40">
          Jadwal dapat berubah sewaktu-waktu. Hubungi bagian akademik untuk
          informasi lebih lanjut.
        </p>
      </div>

      {/* ===================== MODAL DETAIL JADWAL ===================== */}
      {selectedItem &&
        (() => {
          const bentrokList = getBentrokDetails(selectedItem, jadwalList);
          const isBentrok = Boolean(bentrokList && bentrokList.length > 0);

          return (
            <div
              className="modal modal-open"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) setSelectedItem(null);
              }}
            >
              <div className="modal-box max-w-lg p-0">
                <div className="flex items-start justify-between border-b border-base-200 px-6 py-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <BookOpen className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate text-base font-bold text-base-content">
                        {getMkName(selectedItem)}
                      </h2>
                      <p className="mt-0.5 truncate text-xs text-base-content/50">
                        {selectedItem.nama_prodi || "Prodi belum tersedia"}
                        {selectedItem.kode_mk && ` • ${selectedItem.kode_mk}`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="btn btn-ghost btn-sm btn-square"
                    aria-label="Tutup"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4 px-6 py-5">
                  {(selectedItem.is_bentrok || isBentrok) && (
                    <div
                      role="alert"
                      className="alert alert-warning text-xs py-2"
                    >
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <div>
                        <span className="font-bold">Peringatan Bentrok:</span>
                        <p className="mt-0.5">
                          Jadwal ini bertabrakan dengan:{" "}
                          {bentrokList
                            ?.map(
                              (b) =>
                                `${getMkName(b)} (${b.nama_prodi || "Prodi Lain"})`,
                            )
                            .join(", ") || "Jadwal/Ruangan lain"}
                          .
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-base-200/60 px-3.5 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-base-content/50">
                        Hari
                      </p>
                      <p className="mt-1 text-sm font-bold text-base-content">
                        {selectedItem.hari || "-"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-base-200/60 px-3.5 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-base-content/50">
                        Waktu
                      </p>
                      <p className="mt-1 text-sm font-bold text-base-content">
                        {toTimeValue(selectedItem.jam_mulai) || "--:--"} –{" "}
                        {toTimeValue(selectedItem.jam_selesai) || "--:--"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-base-200/60 px-3.5 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-base-content/50">
                        Ruangan
                      </p>
                      <p className="mt-1 truncate text-sm font-bold text-base-content">
                        {getRuangName(selectedItem)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-base-200/60 px-3.5 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-base-content/50">
                        Semester
                      </p>
                      <p className="mt-1 truncate text-sm font-bold text-base-content">
                        {getSemesterName(selectedItem)}
                      </p>
                    </div>
                  </div>

                  {selectedItem.catatan && (
                    <div className="rounded-xl border border-base-200 bg-base-200/40 px-3.5 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-base-content/50">
                        Catatan
                      </p>
                      <p className="mt-1 text-xs leading-5 text-base-content/80">
                        {selectedItem.catatan}
                      </p>
                    </div>
                  )}
                </div>

                <div className="modal-action m-0 border-t border-base-200 bg-base-200/40 px-6 py-3.5">
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="btn btn-sm"
                  >
                    Tutup
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="modal-backdrop"
                onClick={() => setSelectedItem(null)}
                aria-label="Tutup"
              />
            </div>
          );
        })()}
    </div>
  );
};

export default JadwalPublikPage;
