/**
 * COMPTALINK - Écran 1 : Connexion / Inscription (Laravel Sanctum)
 */
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import { messageErreur } from '../lib/api';
import type { Role } from '../types';

/** Comptes de démonstration créés par le seeder Laravel */
const COMPTES_DEMO: { email: string; role: Role }[] = [
  { email: 'admin@comptalink.ma', role: 'Admin' },
  { email: 'comptable@comptalink.ma', role: 'Comptable' },
  { email: 'valideur@comptalink.ma', role: 'Valideur' },
  { email: 'collab@comptalink.ma', role: 'Collaborateur' },
];

const ROLES: Role[] = ['Collaborateur', 'Valideur', 'Comptable', 'Admin'];

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'connexion' | 'inscription'>('connexion');
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');

  const [email, setEmail] = useState('admin@comptalink.ma');
  const [password, setPassword] = useState('123456');
  const [nom, setNom] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [role, setRole] = useState<Role>('Collaborateur');

  /** Soumission du formulaire (connexion ou inscription) */
  const soumettre = async (evenement: FormEvent) => {
    evenement.preventDefault();
    setErreur('');
    setChargement(true);
    try {
      if (mode === 'connexion') {
        await login(email, password);
      } else {
        await register({
          name: nom,
          email,
          password,
          password_confirmation: confirmation,
          role,
        });
      }
      navigate('/dashboard', { replace: true });
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setChargement(false);
    }
  };

  /** Pré-remplit le formulaire avec un compte de démonstration */
  const remplirCompte = (compte: string) => {
    setMode('connexion');
    setEmail(compte);
    setPassword('123456');
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Colonne de présentation */}
      <div className="flex flex-col justify-between bg-nuit p-8 text-white lg:w-1/2 lg:p-14">
        <Logo clair />
        <div className="my-10 max-w-lg">
          <h1 className="text-3xl font-bold leading-tight lg:text-4xl">
            Centralisez, contrôlez et validez vos factures fournisseurs
          </h1>
          <p className="mt-4 text-white/80">
            COMPTALINK organise l'amont de votre comptabilité : collecte des factures, lecture OCR,
            détection des erreurs et des doublons, suivi de validation et préparation de l'export
            vers <strong className="text-orange">Sage 100</strong>.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/85">
            <li className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-orange" />
              Lecture automatique des factures (OCR)
            </li>
            <li className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-orange" />
              Alertes : doublons, TVA incohérente, champs manquants
            </li>
            <li className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-orange" />
              Circuit de validation avec piste d'audit complète
            </li>
            <li className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-orange" />
              Application Web + iOS pour les PME marocaines
            </li>
          </ul>
        </div>
        <p className="text-xs text-white/50">
          COMPTALINK ne remplace pas Sage — il prépare et fiabilise vos données en amont.
        </p>
      </div>

      {/* Colonne formulaire */}
      <div className="flex flex-1 items-center justify-center bg-grisclair p-6">
        <div className="w-full max-w-md">
          <div className="cl-card p-6 sm:p-8">
            <div className="mb-6 flex rounded-lg bg-grisclair p-1">
              <button
                type="button"
                onClick={() => setMode('connexion')}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
                  mode === 'connexion' ? 'bg-white text-nuit shadow-sm' : 'text-gris'
                }`}
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={() => setMode('inscription')}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
                  mode === 'inscription' ? 'bg-white text-nuit shadow-sm' : 'text-gris'
                }`}
              >
                Inscription
              </button>
            </div>

            <h2 className="text-xl font-bold text-nuit">
              {mode === 'connexion' ? 'Accédez à votre espace' : 'Créer un compte COMPTALINK'}
            </h2>
            <p className="mt-1 text-sm text-gris">
              {mode === 'connexion'
                ? 'Utilisez vos identifiants professionnels.'
                : 'Renseignez vos informations et choisissez votre rôle.'}
            </p>

            {erreur && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {erreur}
              </div>
            )}

            <form onSubmit={soumettre} className="mt-5 space-y-4">
              {mode === 'inscription' && (
                <div>
                  <label className="cl-label" htmlFor="nom">
                    Nom complet
                  </label>
                  <input
                    id="nom"
                    className="cl-input"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Ex. Yassine El Amrani"
                    required
                  />
                </div>
              )}

              <div>
                <label className="cl-label" htmlFor="email">
                  Adresse e-mail
                </label>
                <input
                  id="email"
                  type="email"
                  className="cl-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="prenom.nom@comptalink.ma"
                  required
                />
              </div>

              <div>
                <label className="cl-label" htmlFor="password">
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  className="cl-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  required
                />
              </div>

              {mode === 'inscription' && (
                <>
                  <div>
                    <label className="cl-label" htmlFor="confirmation">
                      Confirmer le mot de passe
                    </label>
                    <input
                      id="confirmation"
                      type="password"
                      className="cl-input"
                      value={confirmation}
                      onChange={(e) => setConfirmation(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="cl-label" htmlFor="role">
                      Rôle
                    </label>
                    <select
                      id="role"
                      className="cl-input"
                      value={role}
                      onChange={(e) => setRole(e.target.value as Role)}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <button type="submit" className="cl-btn-primary w-full" disabled={chargement}>
                {chargement
                  ? 'Veuillez patienter…'
                  : mode === 'connexion'
                    ? 'Se connecter'
                    : "S'inscrire"}
              </button>
            </form>
          </div>

          {/* Comptes de démonstration */}
          <div className="cl-card mt-4 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gris">
              Comptes de démonstration (mot de passe : 123456)
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {COMPTES_DEMO.map((compte) => (
                <button
                  key={compte.email}
                  type="button"
                  onClick={() => remplirCompte(compte.email)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs transition hover:border-bleu hover:bg-bleu/5"
                >
                  <span className="block font-semibold text-nuit">{compte.role}</span>
                  <span className="block truncate text-gris">{compte.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
