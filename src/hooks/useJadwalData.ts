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
  const [activeSemesterName, setActiveSemesterName] =
    useState("Semester aktif");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
