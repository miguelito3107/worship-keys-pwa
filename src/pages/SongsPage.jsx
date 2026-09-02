import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, ExternalLink, Pencil } from 'lucide-react';

export const SongsPage = () => {
  const { userData, isAdmin } = useAuth();
  const [songs, setSongs] = useState([]);
  const [singers, setSingers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null); // Nuevo estado para saber si editamos

  // Formulario Canción
  const [title, setTitle] = useState('');
  const [singerId, setSingerId] = useState('');
  const [key, setKey] = useState('G');
  const [chordUrl, setChordUrl] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [bpm, setBpm] = useState('');
  const [timeSignature, setTimeSignature] = useState('4/4');

  useEffect(() => {
    if (!userData?.churchId) return;

    // Cargar Cantantes
    const qSingers = query(collection(db, "singers"), where("churchId", "==", userData.churchId));
    const unsubscribeSingers = onSnapshot(qSingers, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setSingers(data);
      // Solo auto-seleccionar si no estamos editando y no hay un cantante seleccionado
      if (data.length > 0 && !singerId && !editingId) setSingerId(data[0].id);
    });

    // Cargar Canciones
    const qSongs = query(collection(db, "songs"), where("churchId", "==", userData.churchId));
    const unsubscribeSongs = onSnapshot(qSongs, (snapshot) => {
      setSongs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubscribeSingers();
      unsubscribeSongs();
    };
  }, [userData, editingId, singerId]);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setSingerId(singers.length > 0 ? singers[0].id : '');
    setKey('G');
    setChordUrl('');
    setReferenceUrl('');
    setBpm('');
    setTimeSignature('4/4');
    setShowModal(true);
  };

  const handleOpenEditModal = (song) => {
    setEditingId(song.id);
    setTitle(song.title || '');
    setSingerId(song.singerId || '');
    setKey(song.key || 'G');
    setChordUrl(song.chordUrl || '');
    setReferenceUrl(song.referenceUrl || '');
    setBpm(song.bpm ? song.bpm.toString() : '');
    setTimeSignature(song.timeSignature || '4/4');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setTitle('');
    setChordUrl('');
    setReferenceUrl('');
    setBpm('');
  };

  const handleSaveSong = async (e) => {
    e.preventDefault();
    if (!title.trim() || !singerId) return;

    const singerObj = singers.find(s => s.id === singerId);
    
    const songData = {
      title,
      singerId,
      singerName: singerObj ? singerObj.name : 'Desconocido',
      key,
      chordUrl,
      referenceUrl,
      bpm: bpm ? parseInt(bpm) : null,
      timeSignature,
    };

    if (editingId) {
      // Actualizar canción existente
      const songRef = doc(db, "songs", editingId);
      await updateDoc(songRef, songData);
    } else {
      // Crear nueva canción
      await addDoc(collection(db, "songs"), {
        ...songData,
        churchId: userData.churchId,
        createdAt: serverTimestamp()
      });
    }

    handleCloseModal();
  };

  const handleDeleteSong = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar esta canción?")) {
      await deleteDoc(doc(db, "songs", id));
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Catálogo General de Canciones</h2>
          <p className="text-xs text-slate-400">Todas las canciones registradas por la iglesia</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <Plus size={16} />
            <span>Nueva Canción</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {songs.map((song) => (
          <div key={song.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-100">{song.title}</h3>
                <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-indigo-300 rounded-full border border-slate-700">
                  {song.singerName}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/50 px-2 py-0.5 rounded">
                  {song.key}
                </span>
                {song.bpm && <span className="text-slate-400 font-mono">{song.bpm} BPM</span>}
                {song.timeSignature && <span className="text-slate-400 font-mono">{song.timeSignature}</span>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {song.chordUrl && (
                <a href={song.chordUrl} target="_blank" rel="noreferrer" className="p-2 bg-slate-800 text-indigo-400 hover:bg-slate-700 rounded-lg text-xs" title="Ver Acordes">
                  <ExternalLink size={14} />
                </a>
              )}
              {isAdmin && (
                <>
                  <button
                    onClick={() => handleOpenEditModal(song)}
                    className="p-2 text-slate-500 hover:text-indigo-400 transition-colors"
                    title="Editar canción"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteSong(song.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Eliminar canción"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Registrar / Editar Canción */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md">
            <h3 className="text-base font-bold text-slate-100 mb-4">
              {editingId ? 'Editar Canción' : 'Registrar Nueva Canción'}
            </h3>
            <form onSubmit={handleSaveSong} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Título de la Canción</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  placeholder="Ej. Cuan Grande es Él"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Cantante Asignado</label>
                  <select
                    value={singerId}
                    onChange={(e) => setSingerId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Seleccionar --</option>
                    {singers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Tonalidad</label>
                  <input
                    type="text"
                    required
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    placeholder="Ej. G / F#m"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Tempo (BPM)</label>
                  <input
                    type="number"
                    value={bpm}
                    onChange={(e) => setBpm(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    placeholder="Ej. 72"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Métrica</label>
                  <input
                    type="text"
                    value={timeSignature}
                    onChange={(e) => setTimeSignature(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    placeholder="4/4, 6/8..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Enlace de Acordes (Cifra/PDF)</label>
                <input
                  type="url"
                  value={chordUrl}
                  onChange={(e) => setChordUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  placeholder="https://lacucaracha.com/acordes..."
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Enlace de Referencia (YouTube/Spotify)</label>
                <input
                  type="url"
                  value={referenceUrl}
                  onChange={(e) => setReferenceUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  placeholder="https://youtube.com/watch..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg"
                >
                  {editingId ? 'Actualizar Canción' : 'Guardar Canción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};