//src/hooks/useJadwalData.ts
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { DropdownOption, JadwalItem } from "../types/types";
import { getErrorMessage, getSemesterLabel } from "../types/utils";

export const useJadwalData = () => {
  const [jadwalList, setJadwalList] = useState<JadwalItem[]>([]);
  const [mkOptions, setMkOptions] = useState<DropdownOption[]>([]);
  const [ruangOptions, setRuangOptions] = useState<DropdownOption[]>([]);
  const [semesterOptions, setSemesterOptions] = useState<DropdownOption[]>([]);

  const [activeSemesterId, setActiveSemesterId] = useState<number | null>(null);
  const [activeSemesterName, setActiveSemesterName] = useState(
    "Belum ada semester aktif",
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [mkRes, roomRes, semRes] = await Promise.all([
        supabase.from("mk").select("*"),
        supabase.from("ruang").select("*"),
        supabase
          .from("master_semester")
          .select("*")
          .order("id", { ascending: false }),
      ]);

      if (mkRes.error) throw mkRes.error;
      if (roomRes.error) throw roomRes.error;
      if (semRes.error) throw semRes.error;

      const semesters = semRes.data ?? [];
      const active = semesters.find((item) => item.is_active === true);
      const semesterId = active ? Number(active.id) : null;

      setMkOptions(
        (mkRes.data ?? []).map((item: any) => ({
          id: Number(item.id),
          nama: item.nama_mk || item.nama || `MK ID ${item.id}`,
        })),
      );

      setRuangOptions(
        (roomRes.data ?? []).map((item: any) => ({
          id: Number(item.id),
          nama: item.nama_ruang || item.nama || `Ruang ID ${item.id}`,
        })),
      );

      setSemesterOptions(
        semesters.map((item) => ({
          id: Number(item.id),
          nama: getSemesterLabel(item),
        })),
      );

      setActiveSemesterId(semesterId);
      setActiveSemesterName(
        active ? getSemesterLabel(active) : "Belum ada semester aktif",
      );

      if (semesterId === null) {
        setJadwalList([]);
        return;
      }

      const { data, error: jadwalError } = await supabase
        .from("view_jadwal_detail")
        .select("*")
        .eq("master_semester_id", semesterId);

      if (jadwalError) throw jadwalError;

      setJadwalList(
        (data ?? []).map((item: any) => ({
          ...item,
          id: item.jadwal_id ?? item.id,
        })),
      );
    } catch (err: unknown) {
      console.error("Gagal memuat data jadwal:", err);
      setError(getErrorMessage(err, "Gagal memuat data jadwal."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    jadwalList,
    mkOptions,
    ruangOptions,
    semesterOptions,
    activeSemesterId,
    activeSemesterName,
    loading,
    error,
    setError,
    refresh,
  };
};
