import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Calendar, Plus, ExternalLink, Pencil, Trash2, Search, Mic, Users, ChevronDown, ChevronUp } from 'lucide-react';

export const SetlistsPage = () => {
  const { userData, isAdmin } = useAuth();
  const [setlists, setSetlists] = useState([]);
  const [songs, setSongs] = useState([]);
  const [singers, setSingers] = useState([]); // Nuevo estado para cantantes
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Estado para expandir setlists
  const [expandedSetlists, setExpandedSetlists] = useState([]);

  // Estados del formulario
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [selectedSongIds, setSelectedSongIds] = useState([]);
  const [mainSingerId, setMainSingerId] = useState(''); // Cantante principal
  const [choirSingerIds, setChoirSingerIds] = useState([]); // Coros
  
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

    // Cargar Cantantes (Nuevo)
    const qSingers = query(collection(db, "singers"), where("churchId", "==", userData.churchId));
    const unsubscribeSingers = onSnapshot(qSingers, (snapshot) => {
      setSingers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubscribeSetlists();
      unsubscribeSongs();
      unsubscribeSingers();
    };
  }, [userData]);

  const handleToggleSongSelect = (songId) => {
    if (selectedSongIds.includes(songId)) {
      setSelectedSongIds(selectedSongIds.filter(id => id !== songId));
    } else {
      setSelectedSongIds([...selectedSongIds, songId]);
    }
  };

  const handleToggleChoirSelect = (singerId) => {
    if (choirSingerIds.includes(singerId)) {
      setChoirSingerIds(choirSingerIds.filter(id => id !== singerId));
    } else {
      setChoirSingerIds([...choirSingerIds, singerId]);
    }
  };

  const toggleSetlistExpand = (setlistId) => {
    if (expandedSetlists.includes(setlistId)) {
      setExpandedSetlists(expandedSetlists.filter(id => id !== setlistId));
    } else {
      setExpandedSetlists([...expandedSetlists, setlistId]);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setDate('');
    setSelectedSongIds([]);
    setMainSingerId('');
    setChoirSingerIds([]);
    setSearchTerm('');
    setShowModal(true);
  };

  const handleOpenEditModal = (setlist, e) => {
    e.stopPropagation(); // Evita que se expanda el setlist al hacer clic en editar
    setEditingId(setlist.id);
    setTitle(setlist.title || '');
    setDate(setlist.date || '');
    setSelectedSongIds(setlist.songIds || []);
    setMainSingerId(setlist.mainSingerId || '');
    setChoirSingerIds(setlist.choirSingerIds || []);
    setSearchTerm('');
    setShowModal(true);
  };

  const handleSaveSetlist = async (e) => {
    e.preventDefault();
    if (!title || selectedSongIds.length === 0) return;

    const setlistData = {
      title,
      date,
      songIds: selectedSongIds,
      mainSingerId,
      choirSingerIds,
    };

    if (editingId) {
      const setlistRef = doc(db, "setlists", editingId);
      await updateDoc(setlistRef, setlistData);
    } else {
      await addDoc(collection(db, "setlists"), {
        ...setlistData,
        churchId: userData.churchId,
        createdAt: serverTimestamp()
      });
    }

    handleCloseModal();
  };

  const handleDeleteSetlist = async (id, setlistTitle, e) => {
    e.stopPropagation(); // Evita que se expanda el setlist al hacer clic en eliminar
    const confirmDelete = window.confirm(`¿Estás seguro de que deseas eliminar el setlist "${setlistTitle}"?`);
    if (confirmDelete) {
      await deleteDoc(doc(db, "setlists", id));
    }
  };

  const handleCloseModal = () => {
    setTitle('');
    setDate('');
    setSelectedSongIds([]);
    setMainSingerId('');
    setChoirSingerIds([]);
    setEditingId(null);
    setSearchTerm('');
    setShowModal(false);
  };

  // Filtrar y agrupar canciones para el modal
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

  // Cantantes disponibles para el coro (excluyendo al principal)
  const availableChoirSingers = singers.filter(singer => singer.id !== mainSingerId);

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Repertorios de Culto</h2>
          <p className="text-xs text-slate-400">Orden de canciones y asignaciones</p>
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
          const mainSinger = singers.find(s => s.id === setlist.mainSingerId);
          const choirSingers = singers.filter(s => setlist.choirSingerIds?.includes(s.id));
          const isExpanded = expandedSetlists.includes(setlist.id);

          return (
            <div 
              key={setlist.id} 
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all duration-200"
            >
              {/* Cabecera del Setlist (Siempre visible) */}
              <div 
                className="p-5 cursor-pointer hover:bg-slate-800/50 transition-colors"
                onClick={() => toggleSetlistExpand(setlist.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">{setlist.title}</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Calendar size={14} />
                        <span>{setlist.date || 'Sin fecha'}</span>
                      </div>
                      {mainSinger && (
                        <div className="flex items-center gap-1 text-xs text-indigo-300">
                          <Mic size={14} />
                          <span className="font-medium">{mainSinger.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2.5 py-1 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-full font-mono">
                        {listSongs.length} canciones
                      </span>
                      {isAdmin && (
                        <div className="flex items-center gap-1 ml-1">
                          <button
                            onClick={(e) => handleOpenEditModal(setlist, e)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Editar setlist"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteSetlist(setlist.id, setlist.title, e)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Eliminar setlist"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                    {isExpanded ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
                  </div>
                </div>
              </div>

              {/* Contenido Detallado (Visible solo si está expandido) */}
              {isExpanded && (
                <div className="p-5 pt-0 border-t border-slate-800/50 bg-slate-900/50">
                  
                  {/* Sección de Voces */}
                  {(mainSinger || choirSingers.length > 0) && (
                    <div className="mb-6 mt-4 p-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Equipo Vocal</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {mainSinger && (
                          <div>
                            <p className="text-[10px] text-slate-500 mb-1">Principal</p>
                            <div className="flex items-center gap-2 text-sm text-slate-200">
                              <Mic size={16} className="text-indigo-400" />
                              {mainSinger.name}
                            </div>
                          </div>
                        )}
                        {choirSingers.length > 0 && (
                          <div>
                            <p className="text-[10px] text-slate-500 mb-1">Coros</p>
                            <div className="flex items-center gap-2 text-sm text-slate-200">
                              <Users size={16} className="text-emerald-400" />
                              {choirSingers.map(s => s.name).join(', ')}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Lista de Canciones */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Canciones ({listSongs.length})</h4>
                    <div className="space-y-2">
                      {listSongs.map((song, idx) => (
                        <div key={song.id} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg text-sm border border-slate-700/30">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-400 font-mono font-bold">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-semibold text-slate-200">{song.title}</p>
                              <p className="text-xs text-slate-400">{song.singerName}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/50 px-2 py-0.5 rounded text-xs">
                              {song.key}
                            </span>
                            {song.chordUrl && (
                              <a href={song.chordUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 p-1 bg-slate-800 rounded">
                                <ExternalLink size={16} />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
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
            
            <form onSubmit={handleSaveSetlist} className="flex-1 overflow-y-auto pr-2 space-y-5">
              
              {/* Datos Básicos */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Nombre del Servicio/Reunión</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                    placeholder="Ej. Domingo Mañana"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Asignación de Voces */}
              <div className="pt-4 border-t border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase">Asignación Vocal</h4>
                
                <div>
                  <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <Mic size={12}/> Cantante Principal
                  </label>
                  <select
                    value={mainSingerId}
                    onChange={(e) => {
                      setMainSingerId(e.target.value);
                      // Si el principal estaba en coros, lo quitamos
                      if (choirSingerIds.includes(e.target.value)) {
                        setChoirSingerIds(choirSingerIds.filter(id => id !== e.target.value));
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Seleccionar Principal --</option>
                    {singers.map(singer => (
                      <option key={singer.id} value={singer.id}>{singer.name}</option>
                    ))}
                  </select>
                </div>

                {mainSingerId && availableChoirSingers.length > 0 && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-2 flex items-center gap-1">
                      <Users size={12}/> Coros (Múltiple)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableChoirSingers.map(singer => (
                        <button
                          key={singer.id}
                          type="button"
                          onClick={() => handleToggleChoirSelect(singer.id)}
                          className={`px-3 py-1.5 rounded-full text-xs transition-colors border ${
                            choirSingerIds.includes(singer.id) 
                            ? 'bg-emerald-900/50 border-emerald-500 text-emerald-300' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          {singer.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Selección de Canciones */}
              <div className="pt-4 border-t border-slate-800">
                <label className="block text-xs font-bold text-slate-300 mb-2 uppercase">Repertorio</label>
                
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

                <div className="space-y-4 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
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
                    {selectedSongIds.length} canciones seleccionadas
                  </span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-800 flex-shrink-0 bg-slate-900 sticky bottom-0">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={selectedSongIds.length === 0 || !title}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
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