import { supabase } from "../../lib/supabaseClient";

function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Selamat Datang di Dashboard! 🎉</h1>
      {/* Tombol logout gampang */}
      <button
        onClick={async () => {
          await supabase.auth.signOut();
          window.location.href = "/login";
        }}
        className="btn btn-neutral"
      >
        Logout
      </button>
    </div>
  );
}

export default DashboardPage;
