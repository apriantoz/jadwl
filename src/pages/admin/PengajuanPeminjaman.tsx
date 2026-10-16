import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { supabase } from "../../lib/supabaseClient";
import type { Prodi, Ruangan } from "../../types/master";
import type { PinjamRuang, StatusPinjamRuang } from "../../types/pinjamRuang";

type FilterStatus = "semua" | StatusPinjamRuang;

type PengajuanRow = PinjamRuang & {
  prodiNama: string;
  ruangNama: string;
};

const statusLabel: Record<StatusPinjamRuang, string> = {
  pending: "Pending",
  terima: "Diterima",
  tolak: "Ditolak",
};

const statusBadge: Record<StatusPinjamRuang, string> = {
  pending: "badge-warning",
  terima: "badge-success",
  tolak: "badge-error",
};

function formatTanggal(value: string) {
  const date = new Date(`${value}T12:00:00`);

  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatWaktu(value: string) {
  // Mendukung format HH:mm maupun HH:mm:ss dari PostgreSQL.
  return value.slice(0, 5);
}

function formatTanggalPengajuan(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function PengajuanPeminjaman() {
  const [pengajuan, setPengajuan] = useState<PengajuanRow[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("semua");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const fetchPengajuan = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [pinjamResult, prodiResult, ruangResult] = await Promise.all([
        supabase
          .from("pinjam_ruang")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase.from("prodi").select("id, nama_prodi"),

        supabase.from("ruang").select("id, nama_ruang"),
      ]);

      if (pinjamResult.error) throw pinjamResult.error;
      if (prodiResult.error) throw prodiResult.error;
      if (ruangResult.error) throw ruangResult.error;

      const prodiMap = new Map<number, string>(
        (prodiResult.data as Pick<Prodi, "id" | "nama_prodi">[]).map((item) => [
          item.id,
          item.nama_prodi,
        ]),
      );

      const ruangMap = new Map<number, string>(
        (ruangResult.data as Pick<Ruangan, "id" | "nama_ruang">[]).map(
          (item) => [item.id, item.nama_ruang],
        ),
      );

      const rows = ((pinjamResult.data ?? []) as PinjamRuang[]).map(
        (item): PengajuanRow => ({
          ...item,
          prodiNama: prodiMap.get(item.prodi_id) ?? "Prodi tidak ditemukan",
          ruangNama: ruangMap.get(item.ruang_id) ?? "Ruang tidak ditemukan",
        }),
      );

      setPengajuan(rows);
    } catch (err) {
      console.error("Gagal memuat pengajuan:", err);
      setError(
        "Data pengajuan gagal dimuat. Periksa koneksi, nama tabel, tipe data, dan policy RLS admin.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPengajuan();
  }, [fetchPengajuan]);

  const filteredData = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return pengajuan.filter((item) => {
      const cocokStatus = filter === "semua" || item.status === filter;

      const cocokSearch =
        !keyword ||
        item.nama.toLowerCase().includes(keyword) ||
        (item.nim ?? "").toLowerCase().includes(keyword) ||
        item.prodiNama.toLowerCase().includes(keyword) ||
        item.ruangNama.toLowerCase().includes(keyword) ||
        item.tujuan.toLowerCase().includes(keyword);

      return cocokStatus && cocokSearch;
    });
  }, [pengajuan, filter, search]);

  const counts = useMemo(
    () => ({
      semua: pengajuan.length,
      pending: pengajuan.filter((item) => item.status === "pending").length,
      terima: pengajuan.filter((item) => item.status === "terima").length,
      tolak: pengajuan.filter((item) => item.status === "tolak").length,
    }),
    [pengajuan],
  );

  async function handleStatus(
    item: PengajuanRow,
    statusBaru: StatusPinjamRuang,
  ) {
    if (item.status !== "pending" || updatingId !== null) return;

    const tindakan = statusBaru === "terima" ? "menerima" : "menolak";

    if (
      !window.confirm(
        `Yakin ingin ${tindakan} pengajuan dari ${item.nama} (NIM: ${item.nim || "-"} )?`,
      )
    ) {
      return;
    }

    setUpdatingId(item.id);
    setError("");
    setNotice("");

    try {
      const { data, error: updateError } = await supabase
        .from("pinjam_ruang")
        .update({ status: statusBaru })
        .eq("id", item.id)
        .eq("status", "pending")
        .select("id, status");

      if (updateError) throw updateError;

      if (!data || data.length === 0) {
        throw new Error(
          "Status tidak berubah. Periksa izin admin atau status terbaru pengajuan.",
        );
      }

      setPengajuan((current) =>
        current.map((row) =>
          row.id === item.id ? { ...row, status: statusBaru } : row,
        ),
      );

      setNotice(
        `Pengajuan ${item.nama} berhasil ${
          statusBaru === "terima" ? "diterima" : "ditolak"
        }.`,
      );
    } catch (err) {
      console.error("Gagal mengubah status:", err);
      setError(
        err instanceof Error ? err.message : "Gagal mengubah status pengajuan.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function handleSearch(event: ChangeEvent<HTMLInputElement>) {
    setSearch(event.target.value);
  }

  return (
    <main className="min-h-screen bg-base-200 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="breadcrumbs text-sm">
              <ul>
                <li>Admin</li>
                <li>Pengajuan Peminjaman</li>
              </ul>
            </div>

            <h1 className="mt-2 text-2xl font-bold md:text-3xl">
              Pengajuan Peminjaman Ruang
            </h1>

            <p className="mt-2 text-sm text-base-content/60">
              Periksa identitas peminjam, jadwal, dan keputusan peminjaman.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline"
            onClick={() => void fetchPengajuan()}
            disabled={loading || updatingId !== null}
          >
            <span className="text-lg" aria-hidden="true">
              ↻
            </span>
            Muat ulang
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div role="alert" className="alert alert-error">
            <span>{error}</span>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => setError("")}
              aria-label="Tutup pesan error"
            >
              ✕
            </button>
          </div>
        )}

        {notice && (
          <div role="status" className="alert alert-success">
            <span>{notice}</span>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => setNotice("")}
              aria-label="Tutup notifikasi"
            >
              ✕
            </button>
          </div>
        )}

        {/* Statistik */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <button
            type="button"
            className={`card border bg-base-100 text-left shadow-sm ${
              filter === "semua" ? "border-primary" : "border-base-300"
            }`}
            onClick={() => setFilter("semua")}
          >
            <div className="card-body p-4">
              <span className="text-sm text-base-content/60">Semua</span>
              <span className="text-3xl font-bold">{counts.semua}</span>
            </div>
          </button>

          <button
            type="button"
            className={`card border bg-base-100 text-left shadow-sm ${
              filter === "pending" ? "border-warning" : "border-base-300"
            }`}
            onClick={() => setFilter("pending")}
          >
            <div className="card-body p-4">
              <span className="text-sm text-base-content/60">Pending</span>
              <span className="text-3xl font-bold">{counts.pending}</span>
            </div>
          </button>

          <button
            type="button"
            className={`card border bg-base-100 text-left shadow-sm ${
              filter === "terima" ? "border-success" : "border-base-300"
            }`}
            onClick={() => setFilter("terima")}
          >
            <div className="card-body p-4">
              <span className="text-sm text-base-content/60">Diterima</span>
              <span className="text-3xl font-bold">{counts.terima}</span>
            </div>
          </button>

          <button
            type="button"
            className={`card border bg-base-100 text-left shadow-sm ${
              filter === "tolak" ? "border-error" : "border-base-300"
            }`}
            onClick={() => setFilter("tolak")}
          >
            <div className="card-body p-4">
              <span className="text-sm text-base-content/60">Ditolak</span>
              <span className="text-3xl font-bold">{counts.tolak}</span>
            </div>
          </button>
        </div>

        {/* Tabel */}
        <section className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body p-4 md:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold">Daftar Pengajuan</h2>

              <input
                type="search"
                className="input input-bordered w-full sm:max-w-xs"
                placeholder="Cari nama, NIM, prodi, ruang..."
                value={search}
                onChange={handleSearch}
                aria-label="Cari pengajuan"
              />
            </div>

            {loading ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <span className="loading loading-spinner loading-lg text-primary" />
                <p className="text-sm text-base-content/60">
                  Memuat pengajuan...
                </p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mb-3 text-4xl" aria-hidden="true">
                  📭
                </div>
                <p className="font-semibold">Belum ada pengajuan</p>
                <p className="mt-1 text-sm text-base-content/60">
                  Coba ubah filter atau kata pencarian.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Peminjam</th>
                      <th>NIM</th>
                      <th>Program Studi</th>
                      <th>Ruang</th>
                      <th>Jadwal Peminjaman</th>
                      <th>Tujuan</th>
                      <th>Waktu Pengajuan</th>
                      <th>Status</th>
                      <th className="text-center">Aksi</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredData.map((item) => (
                      <tr key={item.id}>
                        <td className="font-medium">
                          {item.nama}
                          <div className="text-xs text-base-content/50">
                            ID #{item.id}
                          </div>
                        </td>

                        <td className="whitespace-nowrap font-mono text-sm">
                          {item.nim || "—"}
                        </td>

                        <td>{item.prodiNama}</td>

                        <td>{item.ruangNama}</td>

                        <td className="min-w-48">
                          <div className="font-medium">
                            {formatTanggal(item.tanggal_pinjam)}
                          </div>
                          <div className="mt-1 text-sm text-base-content/70">
                            {formatWaktu(item.jam_mulai)}–
                            {formatWaktu(item.jam_selesai)} WITA
                          </div>
                        </td>

                        <td>
                          <div className="max-w-xs whitespace-normal break-words">
                            {item.tujuan}
                          </div>
                        </td>

                        <td className="whitespace-nowrap text-sm">
                          {formatTanggalPengajuan(item.created_at)}
                        </td>

                        <td>
                          <span className={`badge ${statusBadge[item.status]}`}>
                            {statusLabel[item.status]}
                          </span>
                        </td>

                        <td>
                          {item.status === "pending" ? (
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <button
                                type="button"
                                className="btn btn-success btn-sm"
                                onClick={() =>
                                  void handleStatus(item, "terima")
                                }
                                disabled={updatingId !== null}
                              >
                                {updatingId === item.id ? (
                                  <span className="loading loading-spinner loading-xs" />
                                ) : (
                                  "Terima"
                                )}
                              </button>

                              <button
                                type="button"
                                className="btn btn-error btn-outline btn-sm"
                                onClick={() => void handleStatus(item, "tolak")}
                                disabled={updatingId !== null}
                              >
                                Tolak
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-base-content/50">
                              Sudah diproses
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filteredData.length > 0 && (
              <div className="mt-4 text-sm text-base-content/60">
                Menampilkan {filteredData.length} dari {pengajuan.length}{" "}
                pengajuan.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
