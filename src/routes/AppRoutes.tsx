// src/routes/AppRoutes.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicOnlyRoute } from "./PublicOnlyRoute"; // <-- Import PublicOnlyRoute
import DashboardPage from "../pages/admin/DashboardPage";
import LandingPage from "../pages/LandingPage";
import JadwalTable from "../pages/admin/JadwalTable";
import { RuanganPage } from "../pages/admin/master/RuanganPage";
import { ProdiPage } from "../pages/admin/master/ProdiPage";
import { MataKuliahPage } from "../pages/admin/master/MataKuliahPage";
import { MasterLayout } from "../layouts/MasterLayout";
import JadwalPublikPage from "../pages/JadwalPublikPage";
import MasterSemesterPage from "../pages/admin/master/MasterSemesterPage";

export function AppRoutes() {
  return (
    <Routes>
      {/* Halaman Publik */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/homepage" element={<JadwalPublikPage />} />

      {/* Rute khusus tamu (kalau sudah login, dilarang masuk ke sini) */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Rute yang diproteksi (Hanya bisa diakses kalau sudah login) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/jadwal" element={<JadwalTable />} />

        {/* Master Data — pakai MasterLayout sebagai parent */}
        <Route path="/master" element={<MasterLayout />}>
          <Route index element={<Navigate to="ruangan" replace />} />
          <Route path="semester" element={<MasterSemesterPage />} />
          <Route path="ruangan" element={<RuanganPage />} />
          <Route path="prodi" element={<ProdiPage />} />
          <Route path="mk" element={<MataKuliahPage />} />
        </Route>
      </Route>

      {/* Redirect otomatis kalau akses rute ngawur */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
