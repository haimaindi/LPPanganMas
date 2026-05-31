import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        localStorage.setItem('isAuthenticated', 'true');
        navigate('/admin');
      } else {
        const data = await response.json();
        setError(data.error || 'Akses tidak diterima');
      }
    } catch (err) {
      setError('Terjadi kesalahan, silakan coba lagi.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">Akses Tim</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Masukkan Password"
            className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-[#01470b]"
            required
          />
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <div className="flex flex-col gap-2">
            <button
              type="submit"
              className="w-full rounded-lg bg-[#01470b] py-3 text-white font-semibold transition-hover hover:bg-[#015e10]"
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full rounded-lg bg-gray-100 py-3 text-gray-700 font-semibold transition-hover hover:bg-gray-200"
            >
              Kembali
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
