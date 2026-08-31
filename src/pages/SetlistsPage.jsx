import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Calendar, Plus, ExternalLink } from 'lucide-react';

export const SetlistsPage = () => {
  const { userData, isAdmin } = useAuth();
  const [setlists, setSetlists] = useState([]);
  const [songs, setSongs] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [selectedSongIds, setSelectedSongIds] = useState([]);

  useEffect(() => {
    if (!userData?.churchId) return;

    // Cargar Setlists
    const qSetlists = query(collection(db, "setlists"), where("churchId", "==", userData.churchId));
    const unsubscribeSetlists = onSnapshot(qSetlists, (snapshot) => {
      setSetlists(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Cargar Canciones
    const qSongs = query(collection(db, "songs"), where("churchId", "==", userData.churchId));
    const unsubscribeSongs = onSnapshot(qSongs, (snapshot) => {
      setSongs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubscribeSetlists();
      unsubscribeSongs();
    };
  }, [userData]);

  const handleToggleSongSelect = (songId) => {
    if (selectedSongIds.includes(songId)) {
      setSelectedSongIds(selectedSongIds.filter(id => id !== songId));
    } else {
      setSelectedSongIds([...selectedSongIds, songId]);
    }
  };

  const handleCreateSetlist = async (e) => {
    e.preventDefault();
    if (!title || selectedSongIds.length === 0) return;

    await addDoc(collection(db, "setlists"), {
      title,
      date,
      songIds: selectedSongIds,
      churchId: userData.churchId,
      createdAt: serverTimestamp()
    });

    setTitle('');
    setDate('');
    setSelectedSongIds([]);
    setShowModal(false);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Repertorios de Culto</h2>
          <p className="text-xs text-slate-400">Orden de canciones para los ensayos y reuniones</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <Plus size={16} />
            <span>Nuevo Setlist</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        {setlists.map((setlist) => {
          const listSongs = songs.filter(s => setlist.songIds?.includes(s.id));

          return (
            <div key={setlist.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="flex justify-between items-start mb-4 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-100">{setlist.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                    <Calendar size={12} />
                    <span>{setlist.date || 'Sin fecha asignada'}</span>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-full font-mono">
                  {listSongs.length} canciones
                </span>
              </div>

              <div className="space-y-2">
                {listSongs.map((song, idx) => (
                  <div key={song.id} className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-lg text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-mono font-bold">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-200">{song.title}</p>
                        <p className="text-[10px] text-slate-400">{song.singerName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/50 px-2 py-0.5 rounded">
                        {song.key}
                      </span>
                      {song.chordUrl && (
                        <a href={song.chordUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300">
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Nuevo Setlist */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-100 mb-4">Crear Nuevo Setlist</h3>
            <form onSubmit={handleCreateSetlist} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Nombre del Servicio/Reunión</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100"
                  placeholder="Ej. Domingo Mañana"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Fecha</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-2">Seleccionar Canciones</label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {songs.map(song => (
                    <label key={song.id} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg text-xs cursor-pointer">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedSongIds.includes(song.id)}
                          onChange={() => handleToggleSongSelect(song.id)}
                          className="rounded text-indigo-600 focus:ring-0"
                        />
                        <span>{song.title} ({song.singerName})</span>
                      </div>
                      <span className="text-emerald-400 font-mono font-bold">{song.key}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg"
                >
                  Guardar Setlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};