// src/routes/PrivateRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PrivateRoute({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (!user) {
    // Si aucun utilisateur connecté, on redirige vers la page de login
    return <Navigate to="/login" replace />;
  }

  // Sinon, on affiche la page demandée (ex: Dashboard)
  return children;
}
