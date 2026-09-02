import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Search, ExternalLink, Music2, Trash2 } from 'lucide-react';

export const SingersPage = () => {
  const { userData, isAdmin } = useAuth();
  const [singers, setSingers] = useState([]);
  const [songs, setSongs] = useState([]);
  const [selectedSingerId, setSelectedSingerId] = useState(null);
  
  // Estados de búsqueda
  const [singerSearch, setSingerSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Formulario nuevo cantante
  const [showModal, setShowModal] = useState(false);
  const [singerName, setSingerName] = useState('');
  const [voiceType, setVoiceType] = useState('Soprano');

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
      if (data.length > 0 && !selectedSingerId) {
        setSelectedSingerId(data[0].id);
      }
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
    setShowModal(false);
  };

  const handleDeleteSinger = async (singerId) => {
    if (window.confirm("¿Seguro que deseas eliminar este cantante?")) {
      await deleteDoc(doc(db, "singers", singerId));
      if (selectedSingerId === singerId) {
        setSelectedSingerId(null);
      }
    }
  };

  // Filtrar cantantes por barra de búsqueda
  const filteredSingers = singers.filter(singer => 
    singer.name.toLowerCase().includes(singerSearch.toLowerCase()) ||
    singer.voiceType.toLowerCase().includes(singerSearch.toLowerCase())
  );

  // Filtrar canciones por cantante seleccionado y término de búsqueda
  const filteredSongs = songs.filter(song => {
    const matchesSinger = selectedSingerId ? song.singerId === selectedSingerId : true;
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
          <p className="text-xs text-slate-400">Consulta y filtro de tonalidades asignadas</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <UserPlus size={16} />
            <span>Nuevo Cantante</span>
          </button>
        )}
      </div>

      {/* Buscador y Selector de Cantantes */}
      <div className="mb-8 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Buscar cantante por nombre o tipo de voz..."
            value={singerSearch}
            onChange={(e) => setSingerSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {filteredSingers.map((singer) => (
            <button
              key={singer.id}
              onClick={() => setSelectedSingerId(singer.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 border ${
                selectedSingerId === singer.id
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800'
              }`}
            >
              <span>{singer.name}</span>
              <span className="text-[10px] opacity-70 px-1.5 py-0.5 bg-black/20 rounded">
                {singer.voiceType}
              </span>
            </button>
          ))}
          {filteredSingers.length === 0 && (
            <p className="text-xs text-slate-500 py-2 pl-1">
              {singers.length === 0 ? "No hay cantantes registrados en esta iglesia." : "No se encontraron cantantes."}
            </p>
          )}
        </div>
      </div>

      {/* Buscador de Canciones para el cantante seleccionado */}
      {selectedSinger && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Repertorio de {selectedSinger.name}</h3>
              <p className="text-xs text-slate-400">{filteredSongs.length} canción(es) registrada(s)</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => handleDeleteSinger(selectedSinger.id)}
                className="text-slate-500 hover:text-rose-400 transition-colors p-1 bg-slate-800 hover:bg-rose-500/10 rounded-md"
                title="Eliminar cantante"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Buscar canción por título o tonalidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      )}

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

        {selectedSinger && filteredSongs.length === 0 && (
          <div className="col-span-full text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
            No se encontraron canciones para esta búsqueda.
          </div>
        )}
      </div>

      {/* Modal Registrar Cantante */}
      {showModal && (
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
                  onClick={() => setShowModal(false)}
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
    </div>
  );
};