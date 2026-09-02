import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Calendar, Plus, ExternalLink, Pencil, Trash2, Search } from 'lucide-react';

export const SetlistsPage = () => {
  const { userData, isAdmin } = useAuth();
  const [setlists, setSetlists] = useState([]);
  const [songs, setSongs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [selectedSongIds, setSelectedSongIds] = useState([]);
  
  // Nuevo estado para el buscador
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setDate('');
    setSelectedSongIds([]);
    setSearchTerm('');
    setShowModal(true);
  };

  const handleOpenEditModal = (setlist) => {
    setEditingId(setlist.id);
    setTitle(setlist.title || '');
    setDate(setlist.date || '');
    setSelectedSongIds(setlist.songIds || []);
    setSearchTerm('');
    setShowModal(true);
  };

  const handleSaveSetlist = async (e) => {
    e.preventDefault();
    if (!title || selectedSongIds.length === 0) return;

    if (editingId) {
      // Modo Edición
      const setlistRef = doc(db, "setlists", editingId);
      await updateDoc(setlistRef, {
        title,
        date,
        songIds: selectedSongIds,
      });
    } else {
      // Modo Creación
      await addDoc(collection(db, "setlists"), {
        title,
        date,
        songIds: selectedSongIds,
        churchId: userData.churchId,
        createdAt: serverTimestamp()
      });
    }

    handleCloseModal();
  };

  const handleDeleteSetlist = async (id, setlistTitle) => {
    const confirmDelete = window.confirm(`¿Estás seguro de que deseas eliminar el setlist "${setlistTitle}"?`);
    if (confirmDelete) {
      await deleteDoc(doc(db, "setlists", id));
    }
  };

  const handleCloseModal = () => {
    setTitle('');
    setDate('');
    setSelectedSongIds([]);
    setEditingId(null);
    setSearchTerm('');
    setShowModal(false);
  };

  // Filtrar y agrupar canciones
  const filteredSongs = songs.filter(song => 
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    song.singerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedSongs = filteredSongs.reduce((acc, song) => {
    const singer = song.singerName || 'Desconocido';
    if (!acc[singer]) acc[singer] = [];
    acc[singer].push(song);
    return acc;
  }, {});

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Repertorios de Culto</h2>
          <p className="text-xs text-slate-400">Orden de canciones para los ensayos y reuniones</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenCreateModal}
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
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-full font-mono">
                    {listSongs.length} canciones
                  </span>
                  {isAdmin && (
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => handleOpenEditModal(setlist)}
                        className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Editar setlist"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteSetlist(setlist.id, setlist.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Eliminar setlist"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
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
        {setlists.length === 0 && (
          <p className="text-slate-400 text-sm text-center py-10">Aún no hay setlists creados.</p>
        )}
      </div>

      {/* Modal Crear / Editar Setlist */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            <h3 className="text-base font-bold text-slate-100 mb-4 flex-shrink-0">
              {editingId ? 'Editar Setlist' : 'Crear Nuevo Setlist'}
            </h3>
            
            <form onSubmit={handleSaveSetlist} className="flex-1 overflow-y-auto pr-2 space-y-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Nombre del Servicio/Reunión</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  placeholder="Ej. Domingo Mañana"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Fecha</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-bold text-slate-300 mb-2">Buscar y Seleccionar Canciones</label>
                
                {/* Buscador */}
                <div className="relative mb-3">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={14} className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por título o cantante..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                  {Object.keys(groupedSongs).length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No se encontraron canciones.</p>
                  ) : (
                    Object.keys(groupedSongs).sort().map(singer => (
                      <div key={singer} className="bg-slate-800/30 rounded-lg p-2 border border-slate-800/50">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                          {singer}
                        </div>
                        <div className="space-y-1">
                          {groupedSongs[singer].map(song => (
                            <label key={song.id} className="flex items-center justify-between p-2 bg-slate-800/50 hover:bg-slate-800 rounded-md text-xs cursor-pointer transition-colors">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={selectedSongIds.includes(song.id)}
                                  onChange={() => handleToggleSongSelect(song.id)}
                                  className="rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 bg-slate-700"
                                />
                                <span className="text-slate-200">{song.title}</span>
                              </div>
                              <span className="text-emerald-400 font-mono font-bold text-[10px] bg-emerald-950/50 px-1.5 py-0.5 rounded">
                                {song.key}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="mt-2 text-right">
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-1 rounded-full">
                    {selectedSongIds.length} seleccionadas
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-800 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={selectedSongIds.length === 0 || !title}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors"
                >
                  {editingId ? 'Actualizar Setlist' : 'Guardar Setlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};