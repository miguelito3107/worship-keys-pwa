import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Users, Music, ListMusic, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { logout, userData, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navClass = ({ isActive }) =>
    `flex flex-col items-center justify-center w-full py-2 text-xs font-medium transition-colors ${
      isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
    }`;

  return (
    <>
      {/* Header superior */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-lg">
            W
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-100 leading-tight">WorshipKeys</h1>
            <p className="text-[10px] text-slate-400 font-mono">ID Iglesia: {userData?.churchId}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {userData?.name} ({isAdmin ? 'Admin' : 'Miembro'})
          </span>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Navegación Inferior Móvil / Adaptable */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex justify-around max-w-md mx-auto sm:max-w-none">
        <NavLink to="/" className={navClass}>
          <Users size={20} className="mb-1" />
          <span>Cantantes</span>
        </NavLink>
        <NavLink to="/songs" className={navClass}>
          <Music size={20} className="mb-1" />
          <span>Canciones</span>
        </NavLink>
        <NavLink to="/setlists" className={navClass}>
          <ListMusic size={20} className="mb-1" />
          <span>Setlists</span>
        </NavLink>
        {isAdmin && (
          <NavLink to="/admin" className={navClass}>
            <Shield size={20} className="mb-1" />
            <span>Permisos</span>
          </NavLink>
        )}
      </nav>
    </>
  );
};