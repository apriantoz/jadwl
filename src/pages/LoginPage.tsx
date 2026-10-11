import React, { useState } from "react";
import { loginWithEmail } from "../services/authService"; // Sesuaikan path jika berbeda
import { Link } from "react-router-dom";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const data = await loginWithEmail(email, password);
      console.log("Login berhasil:", data);
      // Arahkan ke dashboard, misal:
      window.location.href = "/dashboard";
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleLogin}>
        <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
          <legend className="fieldset-legend text-xl">Login</legend>

          {errorMessage && (
            <div className="mb-2 text-sm text-error">{errorMessage}</div>
          )}

          <label className="label">Email</label>
          <input
            type="email"
            className="input w-full"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="label">Password</label>
          <input
            type="password"
            className="input w-full"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Link to="/" className="btn btn-neutral mt-4 w-full">
              Back
            </Link>
            <button
              type="submit"
              className="btn btn-neutral mt-4 w-full"
              disabled={loading}
            >
              {loading ? "Sedang Masuk..." : "Login"}
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}

export default LoginPage;
