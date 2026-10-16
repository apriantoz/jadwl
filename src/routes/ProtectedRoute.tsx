//src/routes/ProtectedRoute.tsx
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import Navbar from "../components/Navbar";
import Breadcrumb from "../components/Breadcrumb";

export function ProtectedRoute() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Cek session saat pertama kali komponen dimuat
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };

    checkAuth();

    // Listener kalau status login berubah (misal token expired atau logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Tampilkan loading sebentar waktu ngecek session Supabase
  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Kalau belum login, lempar ke halaman /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Kalau sudah login, izinkan akses ke halaman anak (children / Outlet)
  return (
    <div>
      <Navbar />
      <Outlet />
    </div>
  );
}
