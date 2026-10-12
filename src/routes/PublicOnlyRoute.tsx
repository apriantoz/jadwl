// src/routes/PublicOnlyRoute.tsx
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export function PublicOnlyRoute() {
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

    // Listener kalau status login berubah
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Tampilkan loading sebentar saat Supabase sedang memverifikasi session
  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Kalau ternyata SUDAH login, cegah masuk halaman login dan alihkan ke /dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Kalau BELUM login, izinkan akses ke halaman login
  return <Outlet />;
}
