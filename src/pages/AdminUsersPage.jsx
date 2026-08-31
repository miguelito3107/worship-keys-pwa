import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ShieldAlert, Copy, Check } from 'lucide-react';

export const AdminUsersPage = () => {
  const { userData } = useAuth();
  const [users, setUsers] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!userData?.churchId) return;

    const q = query(collection(db, "users"), where("churchId", "==", userData.churchId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return unsubscribe;
  }, [userData]);

  const toggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    await updateDoc(doc(db, "users", userId), { role: newRole });
  };

  const copyChurchCode = () => {
    navigator.clipboard.writeText(userData?.churchId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-100">Administración de la Iglesia</h2>
        <p className="text-xs text-slate-400">Gestiona accesos y comparte tu código de iglesia</p>
      </div>

      {/* Tarjeta con Código de Iglesia */}
      <div className="p-5 bg-gradient-to-r from-indigo-900/40 to-slate-900 border border-indigo-500/30 rounded-2xl mb-6 flex justify-between items-center">
        <div>
          <p className="text-xs text-indigo-300 font-medium">Código de Invitación de la Iglesia</p>
          <p className="text-base font-mono font-bold text-slate-100 mt-1">{userData?.churchId}</p>
        </div>
        <button
          onClick={copyChurchCode}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? 'Copiado' : 'Copiar ID'}</span>
        </button>
      </div>

      <h3 className="text-sm font-semibold text-slate-200 mb-3">Miembros de la Iglesia</h3>
      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-100">{user.name}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                user.role === 'admin'
                  ? 'bg-indigo-950 text-indigo-400 border-indigo-800'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {user.role}
              </span>

              {user.id !== userData.uid && (
                <button
                  onClick={() => toggleRole(user.id, user.role)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                  title="Cambiar rol"
                >
                  {user.role === 'admin' ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};