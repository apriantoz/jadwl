import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import { ProtectedRoute } from "./ProtectedRoute"; // Import protected route
import DashboardPage from "../pages/admin/DashboardPage";
import LandingPage from "../pages/LandingPage";
import JadwalTable from "../pages/admin/JadwalTable";
import { MasterDataPage } from "../pages/admin/MasterDataPage";
import MasterSemesterPage from "../pages/admin/MasterSemesterPage";

export function AppRoutes() {
  return (
    <Routes>
      {/* Halaman Publik */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Rute yang diproteksi (Hanya bisa diakses kalau sudah login) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/jadwal" element={<JadwalTable />} />
        <Route path="/master" element={<MasterDataPage />} />
        <Route path="/semester" element={<MasterSemesterPage />} />

        {/* Tambah rute lain di sini kalau butuh, misal /profile, /settings, dll */}
      </Route>

      {/* Redirect otomatis kalau akses rute ngawur */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
