/**
 * COMPTALINK - Mise en page principale (barre latérale + en-tête)
 * L'affichage des entrées de menu dépend du rôle de l'utilisateur connecté.
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';
import type { Role } from '../types';

interface EntreeMenu {
  libelle: string;
  chemin: string;
  roles: Role[];
  icone: ReactNode;
}

/** Icônes SVG légères (pas de dépendance externe) */
const icone = {
  dashboard: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 13h8V3H3v10Zm10 8h8V11h-8v10ZM3 21h8v-6H3v6Zm10-12h8V3h-8v6Z" strokeLinejoin="round" />
    </svg>
  ),
  factures: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 3h9l4 4v14H6V3Z" strokeLinejoin="round" />
      <path d="M9 12h7M9 16h5M9 8h4" strokeLinecap="round" />
    </svg>
  ),
  import: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 16V4m0 0L8 8m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" strokeLinecap="round" />
    </svg>
  ),
  validation: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  utilisateurs: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3 2.7-5 6-5s6 2 6 5" strokeLinecap="round" />
      <path d="M17 11a3 3 0 1 0 0-6" strokeLinecap="round" />
      <path d="M18 20c0-2.2-.7-3.8-2-4.7" strokeLinecap="round" />
    </svg>
  ),
};

/** Entrées du menu latéral avec les rôles autorisés */
const MENU: EntreeMenu[] = [
  {
    libelle: 'Tableau de bord',
    chemin: '/dashboard',
    roles: ['Collaborateur', 'Valideur', 'Comptable', 'Admin'],
    icone: icone.dashboard,
  },
  {
    libelle: 'Mes Factures',
    chemin: '/factures',
    roles: ['Collaborateur', 'Valideur', 'Comptable', 'Admin'],
    icone: icone.factures,
  },
  {
    libelle: 'Nouvelle facture',
    chemin: '/factures/nouvelle',
    roles: ['Collaborateur', 'Comptable', 'Admin'],
    icone: icone.import,
  },
  {
    libelle: 'Validation',
    chemin: '/validation',
    roles: ['Valideur', 'Comptable', 'Admin'],
    icone: icone.validation,
  },
  {
    libelle: 'Utilisateurs',
    chemin: '/utilisateurs',
    roles: ['Admin'],
    icone: icone.utilisateurs,
  },
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOuvert, setMenuOuvert] = useState(false);

  /** Déconnexion puis redirection vers l'écran de connexion */
  const gererDeconnexion = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const entreesVisibles = MENU.filter((entree) => (user ? entree.roles.includes(user.role) : false));

  const navigation = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {entreesVisibles.map((entree) => (
        <NavLink
          key={entree.chemin}
          to={entree.chemin}
          end={entree.chemin === '/factures'}
          onClick={() => setMenuOuvert(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              isActive ? 'bg-bleu text-white shadow-sm' : 'text-white/75 hover:bg-white/10 hover:text-white'
            }`
          }
        >
          {entree.icone}
          {entree.libelle}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-grisclair">
      {/* Barre latérale (desktop) */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-nuit py-5 lg:flex">
        <div className="mb-6 px-5">
          <Logo clair />
        </div>
        {navigation}
        <div className="mt-auto px-5 pt-4 text-[11px] text-white/50">
          COMPTALINK v1.0 — Préparation des factures fournisseurs pour Sage 100
        </div>
      </aside>

      {/* Barre latérale (mobile) */}
      {menuOuvert && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuOuvert(false)}
            aria-hidden="true"
          />
          <aside className="relative z-50 flex h-full w-64 flex-col bg-nuit py-5">
            <div className="mb-6 px-5">
              <Logo clair />
            </div>
            {navigation}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* En-tête */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-nuit hover:bg-grisclair lg:hidden"
              onClick={() => setMenuOuvert(true)}
              aria-label="Ouvrir le menu"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            </button>
            <div className="lg:hidden">
              <Logo compact />
            </div>
            <p className="hidden text-sm text-gris lg:block">
              Bonjour {user?.name}, bienvenue sur votre espace COMPTALINK
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-nuit">{user?.name}</p>
              <p className="text-xs text-gris">{user?.role}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bleu/10 text-sm font-bold text-bleu">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <button type="button" onClick={gererDeconnexion} className="cl-btn-ghost">
              Déconnexion
            </button>
          </div>
        </header>

        {/* Contenu des pages */}
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
