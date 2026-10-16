import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Prodi, Ruangan } from "../types/master";
import type { CreatePinjamRuang } from "../types/pinjamRuang";

export default function PinjamRuang() {
  const [prodiList, setProdiList] = useState<Prodi[]>([]);
  const [ruangList, setRuangList] = useState<Ruangan[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState<CreatePinjamRuang>({
    nama: "",
    nim: "",
    prodi_id: 0,
    ruang_id: 0,
    tujuan: "",
    tanggal_pinjam: "",
    jam_mulai: "",
    jam_selesai: "",
  });

  // Tanggal hari ini berdasarkan WITA.
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  // Ambil data program studi dan ruang.
  useEffect(() => {
    async function fetchMaster() {
      setLoadingMaster(true);
      setError("");

      try {
        const [prodiResult, ruangResult] = await Promise.all([
          supabase.from("prodi").select("id, nama_prodi").order("nama_prodi"),

          supabase
            .from("ruang")
            .select("id, nama_ruang, tipe_ruang_id, kapasitas")
            .order("nama_ruang"),
        ]);

        if (prodiResult.error) throw prodiResult.error;
        if (ruangResult.error) throw ruangResult.error;

        setProdiList(prodiResult.data ?? []);
        setRuangList(ruangResult.data ?? []);
      } catch (err) {
        console.error("Gagal memuat data master:", err);
        setError(
          "Data program studi atau ruang gagal dimuat. Silakan muat ulang halaman.",
        );
      } finally {
        setLoadingMaster(false);
      }
    }

    void fetchMaster();
  }, []);

  // Nama hari otomatis sesuai tanggal.
  const hariPinjam = form.tanggal_pinjam
    ? new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        timeZone: "UTC",
      }).format(new Date(`${form.tanggal_pinjam}T12:00:00Z`))
    : "";

  const selectedRuang = ruangList.find((ruang) => ruang.id === form.ruang_id);

  function handleChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "ruang_id" || name === "prodi_id" ? Number(value) : value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess(false);

    if (
      !form.nama.trim() ||
      !form.tujuan.trim() ||
      !form.prodi_id ||
      !form.ruang_id
    ) {
      setError("Mohon lengkapi semua data pengajuan.");
      return;
    }

    if (!form.tanggal_pinjam || !form.jam_mulai || !form.jam_selesai) {
      setError("Tanggal, jam mulai, dan jam selesai wajib diisi.");
      return;
    }

    if (form.tanggal_pinjam < today) {
      setError("Tanggal peminjaman tidak boleh di masa lalu.");
      return;
    }

    if (form.jam_mulai >= form.jam_selesai) {
      setError("Jam selesai harus setelah jam mulai.");
      return;
    }

    if (form.jam_selesai > "16:00") {
      setError("Peminjaman harus selesai maksimal pukul 16.00 WITA.");
      return;
    }

    setSubmitting(true);

    try {
      const payload: CreatePinjamRuang = {
        nama: form.nama.trim(),
        nim: form.nim.trim(),
        tujuan: form.tujuan.trim(),
        prodi_id: form.prodi_id,
        ruang_id: form.ruang_id,
        tanggal_pinjam: form.tanggal_pinjam,
        jam_mulai: form.jam_mulai,
        jam_selesai: form.jam_selesai,
      };

      const { error: submitError } = await supabase
        .from("pinjam_ruang")
        .insert({
          ...payload,
          status: "pending",
        });

      if (submitError) throw submitError;

      setSuccess(true);

      setForm({
        nama: "",
        nim: "",
        prodi_id: 0,
        ruang_id: 0,
        tujuan: "",
        tanggal_pinjam: "",
        jam_mulai: "",
        jam_selesai: "",
      });
    } catch (err) {
      console.error("Gagal mengajukan peminjaman:", err);
      setError(
        "Pengajuan gagal dikirim. Periksa koneksi dan konfigurasi RLS Supabase.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-base-200 px-4 py-8 md:py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <div className="badge badge-primary badge-outline mb-4">
            LAYANAN PEMINJAMAN
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Peminjaman Ruang
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-base-content/70">
            Silakan isi formulir berikut untuk mengajukan peminjaman ruang.
          </p>
        </header>

        <section className="card border border-base-300 bg-base-100 shadow-xl">
          <div className="card-body p-5 sm:p-8">
            <div className="mb-2">
              <h2 className="text-xl font-semibold">Formulir Pengajuan</h2>
              <p className="mt-1 text-sm text-base-content/60">
                Lengkapi data peminjam dan jadwal penggunaan ruang.
              </p>
            </div>

            {success && (
              <div role="status" className="alert alert-success">
                <span>
                  Pengajuan berhasil dikirim! Status awal pengajuan adalah
                  pending dan akan diproses oleh admin.
                </span>
              </div>
            )}

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

            {loadingMaster ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <span className="loading loading-spinner loading-lg text-primary" />
                <p className="text-sm text-base-content/60">
                  Memuat data ruang dan program studi...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="form-control">
                  <label className="label" htmlFor="nama">
                    <span className="label-text font-medium">
                      Nama peminjam
                    </span>
                  </label>
                  <input
                    id="nama"
                    name="nama"
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="Masukkan nama lengkap"
                    value={form.nama}
                    onChange={handleChange}
                    maxLength={150}
                    autoComplete="name"
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="form-control">
                  <label className="label" htmlFor="nim">
                    <span className="label-text font-medium">
                      NIM Mahasiswa
                    </span>
                  </label>

                  <input
                    id="nim"
                    name="nim"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    className="input input-bordered w-full"
                    placeholder="Masukkan NIM mahasiswa"
                    value={form.nim}
                    onChange={handleChange}
                    minLength={5}
                    maxLength={30}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="form-control">
                  <label className="label" htmlFor="prodi_id">
                    <span className="label-text font-medium">
                      Program studi
                    </span>
                  </label>
                  <select
                    id="prodi_id"
                    name="prodi_id"
                    className="select select-bordered w-full"
                    value={form.prodi_id || ""}
                    onChange={handleChange}
                    required
                    disabled={submitting || prodiList.length === 0}
                  >
                    <option value="" disabled>
                      Pilih program studi
                    </option>
                    {prodiList.map((prodi) => (
                      <option key={prodi.id} value={prodi.id}>
                        {prodi.nama_prodi}
                      </option>
                    ))}
                  </select>

                  {prodiList.length === 0 && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        Data program studi belum tersedia.
                      </span>
                    </label>
                  )}
                </div>

                <div className="form-control">
                  <label className="label" htmlFor="ruang_id">
                    <span className="label-text font-medium">
                      Ruang yang dipinjam
                    </span>
                  </label>
                  <select
                    id="ruang_id"
                    name="ruang_id"
                    className="select select-bordered w-full"
                    value={form.ruang_id || ""}
                    onChange={handleChange}
                    required
                    disabled={submitting || ruangList.length === 0}
                  >
                    <option value="" disabled>
                      Pilih ruang
                    </option>
                    {ruangList.map((ruang) => (
                      <option key={ruang.id} value={ruang.id}>
                        {ruang.nama_ruang} — Kapasitas {ruang.kapasitas} orang
                      </option>
                    ))}
                  </select>

                  {selectedRuang && (
                    <label className="label">
                      <span className="label-text-alt">
                        Kapasitas: {selectedRuang.kapasitas} orang
                      </span>
                    </label>
                  )}

                  {ruangList.length === 0 && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        Data ruang belum tersedia.
                      </span>
                    </label>
                  )}
                </div>

                <div className="divider">Jadwal Peminjaman</div>

                <div className="form-control">
                  <label className="label" htmlFor="tanggal_pinjam">
                    <span className="label-text font-medium">
                      Tanggal peminjaman
                    </span>
                  </label>
                  <input
                    id="tanggal_pinjam"
                    name="tanggal_pinjam"
                    type="date"
                    className="input input-bordered w-full"
                    value={form.tanggal_pinjam}
                    min={today}
                    onChange={handleChange}
                    required
                    disabled={submitting}
                  />
                  {hariPinjam && (
                    <label className="label">
                      <span className="label-text-alt font-medium text-primary">
                        Hari: {hariPinjam}
                      </span>
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="form-control">
                    <label className="label" htmlFor="jam_mulai">
                      <span className="label-text font-medium">Jam mulai</span>
                    </label>
                    <input
                      id="jam_mulai"
                      name="jam_mulai"
                      type="time"
                      className="input input-bordered w-full"
                      value={form.jam_mulai}
                      onChange={handleChange}
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label" htmlFor="jam_selesai">
                      <span className="label-text font-medium">
                        Jam selesai
                      </span>
                    </label>
                    <input
                      id="jam_selesai"
                      name="jam_selesai"
                      type="time"
                      className="input input-bordered w-full"
                      value={form.jam_selesai}
                      min={form.jam_mulai || undefined}
                      max="16:00"
                      onChange={handleChange}
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="alert alert-info text-sm">
                  <span>
                    Waktu peminjaman bebas. Jam selesai maksimal pukul 16.00
                    WITA dan harus setelah jam mulai.
                  </span>
                </div>

                <div className="form-control">
                  <label className="label" htmlFor="tujuan">
                    <span className="label-text font-medium">
                      Tujuan peminjaman
                    </span>
                  </label>
                  <textarea
                    id="tujuan"
                    name="tujuan"
                    className="textarea textarea-bordered min-h-32 w-full"
                    placeholder="Jelaskan tujuan peminjaman ruang..."
                    value={form.tujuan}
                    onChange={handleChange}
                    maxLength={2000}
                    required
                    disabled={submitting}
                  />
                  <label className="label">
                    <span className="label-text-alt">
                      {form.tujuan.length}/2000 karakter
                    </span>
                  </label>
                </div>

                <div className="rounded-xl bg-base-200 p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl" aria-hidden="true">
                      ℹ️
                    </span>
                    <div>
                      <p className="font-medium">Informasi pengajuan</p>
                      <p className="mt-1 text-sm text-base-content/70">
                        Pengajuan berstatus pending sampai admin memberikan
                        keputusan. Pastikan tanggal dan waktu peminjaman sudah
                        benar.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={
                    submitting ||
                    prodiList.length === 0 ||
                    ruangList.length === 0
                  }
                >
                  {submitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm" />
                      Mengirim pengajuan...
                    </>
                  ) : (
                    "Ajukan Peminjaman"
                  )}
                </button>
              </form>
            )}
          </div>
        </section>

        <p className="mt-6 text-center text-sm text-base-content/50">
          Pastikan data yang dimasukkan sudah benar sebelum mengirim pengajuan.
        </p>
      </div>
    </main>
  );
}
