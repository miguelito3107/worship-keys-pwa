import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isNewChurch, setIsNewChurch] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [churchName, setChurchName] = useState('');
  const [churchId, setChurchId] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, registerChurchAndAdmin, registerUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!isRegistering) {
        await login(email, password);
      } else if (isNewChurch) {
        await registerChurchAndAdmin(email, password, churchName, userName);
      } else {
        await registerUser(email, password, churchId, userName);
      }
      navigate('/');
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-950">
      <div className="w-full max-w-md p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl mx-auto flex items-center justify-center text-white text-2xl font-bold mb-3">
            W
          </div>
          <h2 className="text-2xl font-bold text-slate-100">WorshipKeys</h2>
          <p className="text-xs text-slate-400 mt-1">Sincronización centralizada de tonalidades</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Tu Nombre Completo</label>
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                placeholder="Ej. Carlos Pérez"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Correo Electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="tu@correo.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="••••••••"
            />
          </div>

          {isRegistering && (
            <div className="pt-2 border-t border-slate-800">
              <div className="flex gap-4 mb-3">
                <label className="flex items-center text-xs text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    checked={!isNewChurch}
                    onChange={() => setIsNewChurch(false)}
                    className="mr-2 text-indigo-600 focus:ring-0"
                  />
                  Unirme a una iglesia
                </label>
                <label className="flex items-center text-xs text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    checked={isNewChurch}
                    onChange={() => setIsNewChurch(true)}
                    className="mr-2 text-indigo-600 focus:ring-0"
                  />
                  Registrar nueva iglesia
                </label>
              </div>

              {isNewChurch ? (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nombre de la Iglesia</label>
                  <input
                    type="text"
                    required
                    value={churchName}
                    onChange={(e) => setChurchName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="Ej. Iglesia Gracia y Paz"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Código ID de la Iglesia</label>
                  <input
                    type="text"
                    required
                    value={churchId}
                    onChange={(e) => setChurchId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="church_123456789"
                  />
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
          >
            {loading ? 'Procesando...' : isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {isRegistering
              ? '¿Ya tienes una cuenta? Inicia sesión'
              : '¿No tienes cuenta? Registra tu iglesia o únete'}
          </button>
        </div>
      </div>
    </div>
  );
};