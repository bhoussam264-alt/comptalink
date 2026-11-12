/**
 * COMPTALINK - Routage principal de l'application
 */
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Factures from './pages/Factures';
import FactureDetail from './pages/FactureDetail';
import NouvelleFacture from './pages/NouvelleFacture';
import Validation from './pages/Validation';
import Utilisateurs from './pages/Utilisateurs';

export default function App() {
  return (
    <Routes>
      {/* Écran 1 : connexion / inscription */}
      <Route path="/login" element={<Login />} />

      {/* Écrans protégés (authentification Sanctum obligatoire) */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Écran 2 : tableau de bord */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Écran 3 : liste des factures */}
        <Route path="/factures" element={<Factures />} />

        {/* Écran 5 : import / nouvelle facture (OCR) */}
        <Route
          path="/factures/nouvelle"
          element={
            <ProtectedRoute roles={['Collaborateur', 'Comptable', 'Admin']}>
              <NouvelleFacture />
            </ProtectedRoute>
          }
        />

        {/* Écran 4 : détail facture + OCR + alertes */}
        <Route path="/factures/:id" element={<FactureDetail />} />

        {/* Écran 6 : validation et suivi */}
        <Route
          path="/validation"
          element={
            <ProtectedRoute roles={['Valideur', 'Comptable', 'Admin']}>
              <Validation />
            </ProtectedRoute>
          }
        />

        {/* Écran 7 : gestion des utilisateurs (Admin) */}
        <Route
          path="/utilisateurs"
          element={
            <ProtectedRoute roles={['Admin']}>
              <Utilisateurs />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
