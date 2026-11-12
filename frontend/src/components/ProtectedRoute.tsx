/**
 * COMPTALINK - Garde de route : restreint l'accès selon le rôle
 */
import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';

export function ProtectedRoute({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: Role[];
}) {
  const { user, chargement } = useAuth();
  const emplacement = useLocation();

  if (chargement) {
    return (
      <div className="flex h-screen items-center justify-center bg-grisclair">
        <p className="text-nuit">Chargement de COMPTALINK…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ depuis: emplacement.pathname }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
