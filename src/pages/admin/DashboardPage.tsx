// src/pages/admin/Dashboard.tsx

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  BookOpen,
  DoorOpen,
  AlertTriangle,
  Clock,
  MapPin,
  Plus,
  ArrowRight,
  CheckCircle2,
  Search,
  RefreshCw,
  GraduationCap,
  CalendarCheck,
  Building2,
  Info,
} from "lucide-react";

import { useJadwalData } from "../../hooks/useJadwalData";
import {
  getBentrokDetails,
  getMkName,
  getRuangName,
} from "../../utils/scheduleHelpers";
import { getItemId } from "../../types/utils";
import { DAYS } from "../../types/constants";
import type { JadwalItem } from "../../types/types";

const getToday = (date: Date): string =>
  new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    timeZone: "Asia/Makassar",
  }).format(date);

const getTime = (date: Date): string =>
  new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Makassar",
  }).format(date);

const formatDate = (date: Date): string =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeZone: "Asia/Makassar",
  }).format(date);

const normalizeText = (value?: string): string =>
  (value ?? "").trim().toLocaleLowerCase("id-ID");

const formatTime = (value?: string): string => String(value ?? "").slice(0, 5);

export default function Dashboard() {
  const {
    jadwalList,
    ruangOptions,
    loading,
    error,
    activeSemesterId,
    activeSemesterName,
    refresh,
  } = useJadwalData();

  const [now, setNow] = useState(() => new Date());
  const [roomDay, setRoomDay] = useState(() => getToday(new Date()));
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("10:00");
  const [roomSearch, setRoomSearch] = useState("");

  // Perbarui waktu dashboard setiap 30 detik.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 30_000);

    return () => window.clearInterval(timer);
  }, []);

  const today = getToday(now);
  const time = getTime(now);

  // ==========================================
  // Jadwal bentrok
  // ==========================================

  const conflicts = useMemo(
    () =>
      jadwalList.filter(
        (item) =>
          item.is_bentrok === true ||
          Boolean(getBentrokDetails(item, jadwalList)?.length),
      ),
    [jadwalList],
  );

  // ==========================================
  // Jadwal hari ini
  // ==========================================

  const todaySchedule = useMemo(
    () =>
      jadwalList
        .filter((item) => normalizeText(item.hari) === normalizeText(today))
        .sort((a, b) =>
          formatTime(a.jam_mulai).localeCompare(formatTime(b.jam_mulai)),
        ),
    [jadwalList, today],
  );

  // Jadwal yang belum selesai.
  // Jadwal yang sedang berlangsung tetap ditampilkan.
  const upcoming = useMemo(
    () =>
      todaySchedule
        .filter((item) => formatTime(item.jam_selesai) > time)
        .slice(0, 3),
    [todaySchedule, time],
  );

  // ==========================================
  // Statistik akademik
  // ==========================================

  const stats = useMemo(
    () => [
      {
        label: "Total Jadwal",
        value: jadwalList.length,
        description: "Pada semester aktif",
        icon: CalendarDays,
        color: "bg-primary/10 text-primary",
      },
      {
        label: "Mata Kuliah",
        value: new Set(
          jadwalList.map((item) => item.mk_id).filter((id) => id != null),
        ).size,
        description: "Mata kuliah terjadwal",
        icon: BookOpen,
        color: "bg-info/10 text-info",
      },
      {
        label: "Ruangan Terpakai",
        value: new Set(
          jadwalList.map((item) => item.ruang_id).filter((id) => id != null),
        ).size,
        description: "Ruangan dengan jadwal",
        icon: DoorOpen,
        color: "bg-success/10 text-success",
      },
      {
        label: "Jadwal Bentrok",
        value: conflicts.length,
        description: "Perlu diperiksa",
        icon: AlertTriangle,
        color:
          conflicts.length > 0
            ? "bg-error/10 text-error"
            : "bg-success/10 text-success",
      },
    ],
    [jadwalList, conflicts],
  );

  // ==========================================
  // Distribusi jadwal per hari
  // ==========================================

  const dailyStats = useMemo(
    () =>
      DAYS.map((day) => ({
        day,
        count: jadwalList.filter(
          (item) => normalizeText(item.hari) === normalizeText(day),
        ).length,
      })),
    [jadwalList],
  );

  const maxDaily = Math.max(1, ...dailyStats.map((item) => item.count));

  // ==========================================
  // Penggunaan ruangan
  // ==========================================

  const roomStats = useMemo(
    () =>
      ruangOptions
        .map((room) => ({
          id: room.id,
          name: room.nama,
          count: jadwalList.filter(
            (item) => Number(item.ruang_id) === Number(room.id),
          ).length,
        }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    [ruangOptions, jadwalList],
  );

  const maxRoomUsage = Math.max(1, ...roomStats.map((room) => room.count));

  // ==========================================
  // Pencarian ruangan kosong
  // ==========================================

  const availableRooms = useMemo(() => {
    if (!startTime || !endTime || startTime >= endTime) {
      return [];
    }

    const keyword = normalizeText(roomSearch);

    return ruangOptions.filter((room) => {
      const matchesSearch = normalizeText(room.nama).includes(keyword);

      const isBusy = jadwalList.some((item) => {
        const sameDay = normalizeText(item.hari) === normalizeText(roomDay);
        const sameRoom = Number(item.ruang_id) === Number(room.id);

        const scheduleStart = formatTime(item.jam_mulai);
        const scheduleEnd = formatTime(item.jam_selesai);

        const overlaps = scheduleStart < endTime && scheduleEnd > startTime;

        return sameDay && sameRoom && overlaps;
      });

      return matchesSearch && !isBusy;
    });
  }, [ruangOptions, jadwalList, roomDay, startTime, endTime, roomSearch]);

  // ==========================================
  // Tampilan saat memuat data
  // ==========================================

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-6xl flex-col items-center justify-center gap-3 px-4">
        <span className="loading loading-spinner loading-lg text-primary" />
        <p className="text-sm font-medium text-base-content/60">
          Memuat dashboard akademik...
        </p>
      </main>
    );
  }

  // ==========================================
  // Dashboard
  // ==========================================

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <GraduationCap size={17} />
            Administrasi Akademik
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-base-content sm:text-3xl">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-base-content/60">
            Ringkasan aktivitas perkuliahan dan penggunaan ruangan.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="badge badge-primary badge-outline gap-1.5 py-3">
              <CalendarCheck size={14} />
              {activeSemesterName}
            </span>

            {activeSemesterId != null && (
              <span className="text-xs text-base-content/50">
                ID Semester: {activeSemesterId}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            className="btn btn-outline btn-sm gap-2"
            title="Muat ulang data dashboard"
          >
            <RefreshCw size={15} />
            Refresh
          </button>

          <Link to="/jadwal" className="btn btn-primary btn-sm gap-2">
            <Plus size={16} />
            Tambah Jadwal
          </Link>
        </div>
      </header>

      {/* Pesan error */}
      {error && (
        <div role="alert" className="alert alert-error text-sm">
          <Info size={18} />
          <div>
            <p className="font-semibold">Gagal memuat data dashboard</p>
            <p className="text-sm">{error}</p>
          </div>

          <button
            type="button"
            className="btn btn-sm"
            onClick={() => void refresh()}
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Belum ada semester aktif */}
      {activeSemesterId == null && !error && (
        <section className="rounded-2xl border border-warning/30 bg-warning/10 p-5">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 shrink-0 text-warning" size={22} />
            <div>
              <h2 className="text-lg font-bold text-base-content">
                Belum ada semester aktif
              </h2>
              <p className="mt-1 text-sm text-base-content/70">
                Aktifkan salah satu periode pada Master Semester agar dashboard
                dapat menampilkan jadwal akademik.
              </p>
              <Link
                to="/semester"
                className="btn btn-warning btn-sm mt-3 gap-2"
              >
                Kelola Semester
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Highlight hari ini */}
      <section className="overflow-hidden rounded-2xl border border-primary/20 bg-base-100 shadow-sm">
        <div className="bg-primary/5 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                <CalendarDays size={17} />
                Highlight Hari Ini
              </p>

              <h2 className="mt-2 text-xl font-bold capitalize text-base-content sm:text-2xl">
                {today}
              </h2>

              <p className="mt-1 text-sm text-base-content/60">
                {formatDate(now)}
              </p>
            </div>

            <div className="rounded-xl border border-base-200 bg-base-100 px-5 py-3">
              <p className="text-sm text-base-content/60">Waktu Bali (WITA)</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-base-content">
                {time}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
            <span className="badge badge-primary badge-lg">
              {todaySchedule.length} jadwal hari ini
            </span>

            <span className="text-sm text-base-content/60">
              {activeSemesterName}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {todaySchedule.length > 0 ? (
            <div className="space-y-3">
              {todaySchedule.map((item: JadwalItem) => {
                const start = formatTime(item.jam_mulai);
                const end = formatTime(item.jam_selesai);

                const ongoing = start <= time && time < end;
                const finished = end <= time;

                const conflict =
                  item.is_bentrok === true ||
                  Boolean(getBentrokDetails(item, jadwalList)?.length);

                const id = getItemId(item);

                return (
                  <div
                    key={id ?? `${item.mk_id}-${start}`}
                    className="flex flex-col justify-between gap-3 rounded-xl border border-base-200 bg-base-100 p-4 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                          ongoing
                            ? "bg-success/10 text-success"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        <BookOpen size={20} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-base font-semibold text-base-content">
                          {getMkName(item)}
                        </p>

                        {item.kode_mk && (
                          <p className="mt-0.5 text-xs text-base-content/50">
                            {item.kode_mk}
                          </p>
                        )}

                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-base-content/60">
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {start}–{end}
                          </span>

                          <span className="flex items-center gap-1">
                            <MapPin size={14} />
                            {getRuangName(item)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      {ongoing && (
                        <span className="badge badge-success gap-1">
                          <CheckCircle2 size={12} />
                          Sedang berlangsung
                        </span>
                      )}

                      {!ongoing && !finished && (
                        <span className="badge badge-primary">
                          Akan dimulai
                        </span>
                      )}

                      {finished && (
                        <span className="badge badge-ghost">Selesai</span>
                      )}

                      {conflict && (
                        <span className="badge badge-error gap-1">
                          <AlertTriangle size={12} />
                          Bentrok
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl bg-base-200/50 px-4 py-8 text-center">
              <CalendarDays
                size={28}
                className="mx-auto text-base-content/30"
              />
              <p className="mt-3 text-base font-semibold text-base-content">
                Tidak ada jadwal kuliah hari ini
              </p>
              <p className="mt-1 text-sm text-base-content/60">
                Jadwal untuk hari {today} akan muncul di sini.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Statistik */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, description, icon: Icon, color }) => (
          <div
            key={label}
            className="card border border-base-200 bg-base-100 shadow-sm"
          >
            <div className="card-body flex-row items-center gap-4 p-5">
              <div className={`rounded-xl p-3 ${color}`}>
                <Icon size={23} />
              </div>

              <div className="min-w-0">
                <p className="text-sm text-base-content/60">{label}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-base-content">
                  {value}
                </p>
                <p className="mt-1 text-sm text-base-content/50">
                  {description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Pencarian ruangan kosong */}
      <section className="card border border-base-200 bg-base-100 shadow-sm">
        <div className="card-body gap-5 p-4 sm:p-6">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-base-content">
              <Search className="text-primary" size={21} />
              Cari Ruangan Kosong
            </h2>
            <p className="mt-1 text-sm text-base-content/60">
              Cari ruangan yang tidak memiliki jadwal pada hari dan rentang
              waktu pilihanmu.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="form-control">
              <span className="label mb-1 text-sm font-semibold">Hari</span>
              <select
                className="select select-bordered w-full"
                value={roomDay}
                onChange={(e) => setRoomDay(e.target.value)}
              >
                {DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-control">
              <span className="label mb-1 text-sm font-semibold">
                Jam Mulai
              </span>
              <input
                type="time"
                className="input input-bordered w-full"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </label>

            <label className="form-control">
              <span className="label mb-1 text-sm font-semibold">
                Jam Selesai
              </span>
              <input
                type="time"
                className="input input-bordered w-full"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </label>

            <label className="form-control">
              <span className="label mb-1 text-sm font-semibold">
                Nama Ruangan
              </span>
              <input
                type="search"
                className="input input-bordered w-full"
                placeholder="Cari ruangan..."
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
              />
            </label>
          </div>

          {startTime >= endTime ? (
            <div role="alert" className="alert alert-warning text-sm">
              <Info size={18} />
              Jam selesai harus lebih besar daripada jam mulai.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-base-content/60">
                  Ruangan kosong pada{" "}
                  <strong className="text-base-content">
                    {roomDay}, {startTime}–{endTime}
                  </strong>
                </p>

                <span className="badge badge-success badge-lg">
                  {availableRooms.length} ruangan tersedia
                </span>
              </div>

              {availableRooms.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {availableRooms.map((room) => (
                    <div
                      key={room.id}
                      className="flex items-center gap-3 rounded-xl border border-success/20 bg-success/5 p-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                        <DoorOpen size={19} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-base-content">
                          {room.nama}
                        </p>
                        <p className="mt-0.5 text-sm text-success">Tersedia</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-base-200/50 p-5 text-center">
                  <DoorOpen
                    size={26}
                    className="mx-auto text-base-content/30"
                  />
                  <p className="mt-2 text-base font-semibold text-base-content">
                    Tidak ada ruangan yang cocok
                  </p>
                  <p className="mt-1 text-sm text-base-content/60">
                    Coba ubah hari, jam, atau kata kunci pencarian.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Jadwal berikutnya dan peringatan bentrok */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Jadwal berikutnya */}
        <div className="card border border-base-200 bg-base-100 shadow-sm">
          <div className="card-body p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-base-content">
                  Jadwal Berikutnya
                </h2>
                <p className="mt-1 text-sm text-base-content/60">
                  Maksimal tiga jadwal hari ini yang belum selesai.
                </p>
              </div>
              <Clock size={21} className="text-primary" />
            </div>

            {upcoming.length > 0 ? (
              <div className="mt-3 space-y-3">
                {upcoming.map((item: JadwalItem) => {
                  const start = formatTime(item.jam_mulai);
                  const end = formatTime(item.jam_selesai);
                  const ongoing = start <= time && time < end;

                  return (
                    <div
                      key={getItemId(item) ?? `${item.mk_id}-${start}`}
                      className="flex items-center justify-between gap-3 rounded-xl bg-base-200/50 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-base-content">
                          {getMkName(item)}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-base-content/60">
                          <span className="flex items-center gap-1">
                            <Clock size={13} />
                            {start}–{end}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={13} />
                            {getRuangName(item)}
                          </span>
                        </p>
                      </div>

                      <span
                        className={`badge shrink-0 ${
                          ongoing ? "badge-success" : "badge-primary"
                        }`}
                      >
                        {ongoing ? "Berlangsung" : "Berikutnya"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 rounded-xl bg-base-200/50 p-4 text-sm text-base-content/60">
                Tidak ada jadwal tersisa hari ini.
              </p>
            )}

            <Link
              to="/jadwal"
              className="link link-primary mt-3 inline-flex items-center gap-1 text-sm"
            >
              Lihat semua jadwal
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Peringatan bentrok */}
        <div className="card border border-base-200 bg-base-100 shadow-sm">
          <div className="card-body p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-base-content">
                  Peringatan Bentrok
                </h2>
                <p className="mt-1 text-sm text-base-content/60">
                  Jadwal yang perlu diperiksa.
                </p>
              </div>

              <AlertTriangle
                size={22}
                className={conflicts.length > 0 ? "text-error" : "text-success"}
              />
            </div>

            {conflicts.length > 0 ? (
              <div className="mt-3 space-y-3">
                {conflicts.slice(0, 5).map((item: JadwalItem) => {
                  const id = getItemId(item);

                  return (
                    <div
                      key={id ?? `${item.mk_id}-${item.hari}-${item.jam_mulai}`}
                      className="rounded-xl border border-error/20 bg-error/5 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-base font-semibold text-base-content">
                            {getMkName(item)}
                          </p>
                          <p className="mt-1 text-sm text-base-content/60">
                            {item.hari} · {formatTime(item.jam_mulai)}–
                            {formatTime(item.jam_selesai)}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-sm text-base-content/60">
                            <MapPin size={13} />
                            {getRuangName(item)}
                          </p>
                        </div>

                        <Link
                          to={id != null ? `/jadwal?edit=${id}` : "/jadwal"}
                          className="btn btn-error btn-outline btn-xs shrink-0"
                        >
                          Periksa
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {conflicts.length > 5 && (
                  <Link to="/jadwal" className="link link-primary text-sm">
                    Lihat {conflicts.length - 5} jadwal bentrok lainnya
                  </Link>
                )}
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-3 rounded-xl bg-success/10 p-4">
                <CheckCircle2 size={22} className="shrink-0 text-success" />
                <div>
                  <p className="text-sm font-semibold text-success">
                    Tidak ada jadwal bentrok
                  </p>
                  <p className="mt-1 text-sm text-base-content/60">
                    Jadwal pada semester aktif tidak menunjukkan konflik ruangan
                    dan waktu.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Distribusi jadwal per hari */}
      <section className="card border border-base-200 bg-base-100 shadow-sm">
        <div className="card-body p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarDays size={21} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-base-content">
                Jadwal per Hari
              </h2>
              <p className="text-sm text-base-content/60">
                Distribusi jadwal pada semester aktif.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {dailyStats.map(({ day, count }) => (
              <div
                key={day}
                className="grid grid-cols-[75px_minmax(0,1fr)_35px] items-center gap-3"
              >
                <span className="text-sm text-base-content/70">{day}</span>

                <div className="h-3 overflow-hidden rounded-full bg-base-200">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{
                      width: `${(count / maxDaily) * 100}%`,
                    }}
                  />
                </div>

                <span className="text-right text-sm font-bold tabular-nums text-base-content">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Penggunaan ruangan */}
      <section className="card border border-base-200 bg-base-100 shadow-sm">
        <div className="card-body p-4 sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10 text-info">
                <Building2 size={21} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-base-content">
                  Penggunaan Ruangan
                </h2>
                <p className="text-sm text-base-content/60">
                  Lima ruangan dengan jumlah jadwal terbanyak.
                </p>
              </div>
            </div>

            <Link
              to="/master/ruangan"
              className="link link-primary inline-flex items-center gap-1 text-sm"
            >
              Kelola Ruangan
              <ArrowRight size={14} />
            </Link>
          </div>

          {roomStats.length > 0 ? (
            <div className="mt-5 space-y-5">
              {roomStats.slice(0, 5).map((room) => (
                <div key={room.id}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-base-content">
                      {room.name}
                    </span>
                    <span className="text-sm text-base-content/60">
                      {room.count} jadwal
                    </span>
                  </div>

                  <progress
                    className="progress progress-primary w-full"
                    value={room.count}
                    max={maxRoomUsage}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl bg-base-200/50 p-5 text-center">
              <DoorOpen size={26} className="mx-auto text-base-content/30" />
              <p className="mt-2 text-sm text-base-content/60">
                Belum ada data ruangan.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Aksi cepat */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-base-content/60">
          Akses Cepat
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link
            to="/jadwal"
            className="flex items-center justify-between rounded-xl border border-base-200 bg-base-100 p-4 transition hover:border-primary/40 hover:bg-base-200/50"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <CalendarDays size={19} />
              </div>
              <div>
                <p className="text-sm font-semibold text-base-content">
                  Kelola Jadwal
                </p>
                <p className="text-sm text-base-content/60">
                  Tambah dan ubah jadwal
                </p>
              </div>
            </div>
            <ArrowRight size={17} className="text-base-content/40" />
          </Link>

          <Link
            to="/semester"
            className="flex items-center justify-between rounded-xl border border-base-200 bg-base-100 p-4 transition hover:border-primary/40 hover:bg-base-200/50"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-info/10 p-2 text-info">
                <BookOpen size={19} />
              </div>
              <div>
                <p className="text-sm font-semibold text-base-content">
                  Master Semester
                </p>
                <p className="text-sm text-base-content/60">
                  Atur periode aktif
                </p>
              </div>
            </div>
            <ArrowRight size={17} className="text-base-content/40" />
          </Link>

          <Link
            to="/master/ruangan"
            className="flex items-center justify-between rounded-xl border border-base-200 bg-base-100 p-4 transition hover:border-primary/40 hover:bg-base-200/50"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2 text-success">
                <DoorOpen size={19} />
              </div>
              <div>
                <p className="text-sm font-semibold text-base-content">
                  Master Ruangan
                </p>
                <p className="text-sm text-base-content/60">
                  Lihat data ruangan
                </p>
              </div>
            </div>
            <ArrowRight size={17} className="text-base-content/40" />
          </Link>
        </div>
      </section>

      {/* Catatan semester */}
      {activeSemesterId != null && (
        <footer className="flex items-start gap-2 rounded-xl bg-base-200/50 p-4 text-xs text-base-content/60">
          <Info size={15} className="mt-0.5 shrink-0" />
          <p>
            Seluruh statistik dan jadwal pada dashboard ini mengacu pada
            semester aktif:{" "}
            <strong className="text-base-content">{activeSemesterName}</strong>.
            Untuk melihat periode lain, ubah semester aktif melalui halaman
            Master Semester.
          </p>
        </footer>
      )}
    </main>
  );
}
