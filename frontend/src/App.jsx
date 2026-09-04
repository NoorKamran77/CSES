import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProblemListPage from './pages/ProblemListPage';
import ProblemPage from './pages/ProblemPage';
import SubmissionPage from './pages/SubmissionPage';
import MySubmissionsPage from './pages/MySubmissionsPage';
import AuthPage from './pages/AuthPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-layout">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<ProblemListPage />} />
              <Route path="/problem/:slug" element={<ProblemPage />} />
              <Route path="/submission/:id" element={<SubmissionPage />} />
              <Route path="/my-submissions" element={<MySubmissionsPage />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

