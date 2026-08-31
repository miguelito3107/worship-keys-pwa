import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Registro de nueva Iglesia + Usuario Administrador
  const registerChurchAndAdmin = async (email, password, churchName, userName) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const churchId = "church_" + Date.now();

    // Crear registro de la iglesia
    await setDoc(doc(db, "churches", churchId), {
      name: churchName,
      createdAt: new Date(),
      adminUid: res.user.uid
    });

    // Crear perfil del usuario admin
    const userPayload = {
      uid: res.user.uid,
      name: userName,
      email,
      churchId,
      role: "admin",
      createdAt: new Date()
    };
    await setDoc(doc(db, "users", res.user.uid), userPayload);
    setUserData(userPayload);
  };

  // Registro de un usuario secundario en una iglesia existente
  const registerUser = async (email, password, churchId, userName) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    
    // Verificar que la iglesia exista
    const churchSnap = await getDoc(doc(db, "churches", churchId));
    if (!churchSnap.exists()) {
      throw new Error("El Código de Iglesia especificado no existe.");
    }

    const userPayload = {
      uid: res.user.uid,
      name: userName,
      email,
      churchId,
      role: "member", // Por defecto es miembro
      createdAt: new Date()
    };
    await setDoc(doc(db, "users", res.user.uid), userPayload);
    setUserData(userPayload);
  };

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    registerChurchAndAdmin,
    registerUser,
    login,
    logout,
    isAdmin: userData?.role === "admin"
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};