import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Search, ExternalLink, Music2, Trash2, X, Check, Plus } from 'lucide-react';

export const SingersPage = () => {
  const { userData, isAdmin } = useAuth();
  const [singers, setSingers] = useState([]);
  const [songs, setSongs] = useState([]);
  const [selectedSingerId, setSelectedSingerId] = useState(null);
  
  // Estados de búsqueda y dropdown
  const [singerSearch, setSingerSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const searchRef = useRef(null);

  // Formulario nuevo cantante
  const [showSingerModal, setShowSingerModal] = useState(false);
  const [singerName, setSingerName] = useState('');
  const [voiceType, setVoiceType] = useState('Soprano');

  // Formulario nueva canción para el cantante seleccionado
  const [showSongModal, setShowSongModal] = useState(false);
  const [songTitle, setSongTitle] = useState('');
  const [songKey, setSongKey] = useState('C');
  const [songBpm, setSongBpm] = useState('');
  const [songTimeSignature, setSongTimeSignature] = useState('4/4');
  const [songChordUrl, setSongChordUrl] = useState('');
  const [songReferenceUrl, setSongReferenceUrl] = useState('');

  // Detectar clics fuera del buscador para cerrar la vista previa
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sincronizar Cantantes de la Iglesia en tiempo real
  useEffect(() => {
    if (!userData?.churchId) return;

    const q = query(
      collection(db, "singers"),
      where("churchId", "==", userData.churchId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSingers(data);
    });

    return unsubscribe;
  }, [userData]);

  // Sincronizar Canciones de la Iglesia en tiempo real
  useEffect(() => {
    if (!userData?.churchId) return;

    const q = query(
      collection(db, "songs"),
      where("churchId", "==", userData.churchId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSongs(data);
    });

    return unsubscribe;
  }, [userData]);

  const handleAddSinger = async (e) => {
    e.preventDefault();
    if (!singerName.trim()) return;

    await addDoc(collection(db, "singers"), {
      name: singerName,
      voiceType,
      churchId: userData.churchId,
      createdAt: serverTimestamp()
    });

    setSingerName('');
    setShowSingerModal(false);
  };

  const handleAddSong = async (e) => {
    e.preventDefault();
    if (!songTitle.trim() || !selectedSingerId) return;

    const selectedSingerObj = singers.find(s => s.id === selectedSingerId);

    await addDoc(collection(db, "songs"), {
      title: songTitle,
      key: songKey,
      bpm: songBpm ? Number(songBpm) : null,
      timeSignature: songTimeSignature,
      chordUrl: songChordUrl.trim() || null,
      referenceUrl: songReferenceUrl.trim() || null,
      singerId: selectedSingerId,
      singerName: selectedSingerObj ? selectedSingerObj.name : '',
      churchId: userData.churchId,
      createdAt: serverTimestamp()
    });

    // Limpiar campos del formulario
    setSongTitle('');
    setSongKey('C');
    setSongBpm('');
    setSongTimeSignature('4/4');
    setSongChordUrl('');
    setSongReferenceUrl('');
    setShowSongModal(false);
  };

  const handleDeleteSinger = async (singerId) => {
    if (window.confirm("¿Seguro que deseas eliminar este cantante?")) {
      await deleteDoc(doc(db, "singers", singerId));
      if (selectedSingerId === singerId) {
        setSelectedSingerId(null);
        setSingerSearch('');
      }
    }
  };

  const handleSelectSinger = (singer) => {
    setSelectedSingerId(singer.id);
    setSingerSearch(singer.name);
    setIsDropdownOpen(false);
  };

  const handleClearSingerSelection = () => {
    setSelectedSingerId(null);
    setSingerSearch('');
    setIsDropdownOpen(false);
  };

  // Filtrar cantantes por la barra de búsqueda
  const filteredSingers = singers.filter(singer => 
    singer.name.toLowerCase().includes(singerSearch.toLowerCase()) ||
    singer.voiceType.toLowerCase().includes(singerSearch.toLowerCase())
  );

  // Filtrar canciones del cantante seleccionado
  const filteredSongs = songs.filter(song => {
    const matchesSinger = selectedSingerId ? song.singerId === selectedSingerId : false;
    const matchesSearch = song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          song.key.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSinger && matchesSearch;
  });

  const selectedSinger = singers.find(s => s.id === selectedSingerId);

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24">
      {/* Encabezado y Acción */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Directorio de Cantantes</h2>
          <p className="text-xs text-slate-400">Busca un cantante para ver su repertorio y tonalidades</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowSingerModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <UserPlus size={16} />
            <span>Nuevo Cantante</span>
          </button>
        )}
      </div>

      {/* Buscador con Vista Previa Desplegable */}
      <div className="mb-8 relative" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Buscar cantante por nombre o tipo de voz..."
            value={singerSearch}
            onFocus={() => setIsDropdownOpen(true)}
            onChange={(e) => {
              setSingerSearch(e.target.value);
              setIsDropdownOpen(true);
            }}
            className="w-full pl-9 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {singerSearch && (
            <button
              onClick={handleClearSingerSelection}
              className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
              title="Limpiar búsqueda"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Vista previa / Menú desplegable */}
        {isDropdownOpen && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-30 max-h-60 overflow-y-auto divide-y divide-slate-800/60">
            {filteredSingers.length > 0 ? (
              filteredSingers.map((singer) => {
                const isSelected = selectedSingerId === singer.id;
                return (
                  <button
                    key={singer.id}
                    onClick={() => handleSelectSinger(singer)}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-800/80 transition-colors ${
                      isSelected ? 'bg-indigo-600/10 text-indigo-400' : 'text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected && <Check size={14} className="text-indigo-400" />}
                      <span className="font-medium text-xs">{singer.name}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md border border-slate-700 font-mono">
                      {singer.voiceType}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-500">
                {singers.length === 0 ? "No hay cantantes registrados." : "No se encontraron resultados."}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contenido del Cantante Seleccionado */}
      {selectedSinger ? (
        <>
          {/* Ficha del Cantante y Buscador Interno de Canciones */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-100">{selectedSinger.name}</h3>
                  <span className="text-[10px] px-2 py-0.5 bg-indigo-950 text-indigo-400 border border-indigo-800/50 rounded-full font-mono">
                    {selectedSinger.voiceType}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {filteredSongs.length} canción(es) en su repertorio
                </p>
              </div>

              {/* Botones de acción dentro de la tarjeta (Visibles para todos los usuarios) */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSongModal(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                  title="Añadir canción a este cantante"
                >
                  <Plus size={14} />
                  <span>Añadir Canción</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => handleDeleteSinger(selectedSinger.id)}
                    className="text-slate-500 hover:text-rose-400 transition-colors p-1.5 bg-slate-800 hover:bg-rose-500/10 rounded-lg"
                    title="Eliminar cantante"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
              <input
                type="text"
                placeholder={`Buscar en el repertorio de ${selectedSinger.name}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Lista de Canciones */}
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredSongs.map((song) => (
              <div key={song.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <Music2 size={16} className="text-indigo-400" />
                    <h4 className="text-sm font-semibold text-slate-100">{song.title}</h4>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/50 px-2 py-0.5 rounded">
                      {song.key}
                    </span>
                    {song.bpm && (
                      <span className="text-[10px] text-slate-400 font-mono">{song.bpm} BPM</span>
                    )}
                    {song.timeSignature && (
                      <span className="text-[10px] text-slate-400 font-mono">{song.timeSignature}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {song.chordUrl && (
                    <a
                      href={song.chordUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-slate-800 hover:bg-indigo-600/20 text-indigo-400 border border-slate-700 hover:border-indigo-500/50 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                      title="Ver Acordes"
                    >
                      Acordes <ExternalLink size={12} />
                    </a>
                  )}
                  {song.referenceUrl && (
                    <a
                      href={song.referenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs transition-colors flex items-center gap-1"
                      title="Referencia de audio/video"
                    >
                      Ref <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            ))}

            {filteredSongs.length === 0 && (
              <div className="col-span-full text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                No se encontraron canciones registradas para este cantante.
              </div>
            )}
          </div>
        </>
      ) : (
        /* Estado vacío cuando no hay cantante seleccionado */
        <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
          <Search size={32} className="mx-auto text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-300">Selecciona un cantante</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Utiliza la barra de búsqueda para seleccionar a un integrante del ministerio de alabanza.
          </p>
        </div>
      )}

      {/* Modal Registrar Cantante */}
      {showSingerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-sm">
            <h3 className="text-base font-bold text-slate-100 mb-4">Registrar Nuevo Cantante</h3>
            <form onSubmit={handleAddSinger} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={singerName}
                  onChange={(e) => setSingerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  placeholder="Ej. Ana Martínez"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Tipo de Voz</label>
                <select
                  value={voiceType}
                  onChange={(e) => setVoiceType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Soprano">Soprano</option>
                  <option value="Mezzosoprano">Mezzosoprano</option>
                  <option value="Contralto">Contralto</option>
                  <option value="Tenor">Tenor</option>
                  <option value="Barítono">Barítono</option>
                  <option value="Bajo">Bajo</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSingerModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Canción para Cantante */}
      {showSongModal && selectedSinger && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md">
            <h3 className="text-base font-bold text-slate-100 mb-1">Añadir Canción</h3>
            <p className="text-xs text-slate-400 mb-4">
              Asignando canción a <span className="text-indigo-400 font-medium">{selectedSinger.name}</span>
            </p>

            <form onSubmit={handleAddSong} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Título de la Canción *</label>
                <input
                  type="text"
                  required
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  placeholder="Ej. La Bondad de Dios"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Tonalidad</label>
                  <select
                    value={songKey}
                    onChange={(e) => setSongKey(e.target.value)}
                    className="w-full px-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    {['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B', 'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm'].map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">BPM</label>
                  <input
                    type="number"
                    value={songBpm}
                    onChange={(e) => setSongBpm(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                    placeholder="72"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Compás</label>
                  <input
                    type="text"
                    value={songTimeSignature}
                    onChange={(e) => setSongTimeSignature(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                    placeholder="4/4"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Enlace de Acordes (Opcional)</label>
                <input
                  type="url"
                  value={songChordUrl}
                  onChange={(e) => setSongChordUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  placeholder="https://lacuerda.net/..."
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Enlace Referencia Audio/Video (Opcional)</label>
                <input
                  type="url"
                  value={songReferenceUrl}
                  onChange={(e) => setSongReferenceUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  placeholder="https://youtube.com/..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setShowSongModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!songTitle.trim()}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  Guardar Canción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};