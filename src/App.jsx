import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { SingersPage } from './pages/SingersPage';
import { SongsPage } from './pages/SongsPage';
import { SetlistsPage } from './pages/SetlistsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-slate-950">
                  <Navbar />
                  <Routes>
                    <Route path="/" element={<SingersPage />} />
                    <Route path="/songs" element={<SongsPage />} />
                    <Route path="/setlists" element={<SetlistsPage />} />
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute requireAdmin={true}>
                          <AdminUsersPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}