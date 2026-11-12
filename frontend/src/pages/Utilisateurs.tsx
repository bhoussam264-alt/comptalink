/**
 * COMPTALINK - Écran 7 : Gestion des utilisateurs (réservé au rôle Admin)
 */
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { api, messageErreur } from '../lib/api';
import { formaterDate } from '../lib/format';
import type { Role, User } from '../types';

const ROLES: Role[] = ['Collaborateur', 'Valideur', 'Comptable', 'Admin'];

/** Couleur associée à chaque rôle */
const couleurRole: Record<Role, string> = {
  Collaborateur: 'bg-slate-100 text-slate-700',
  Valideur: 'bg-orange/10 text-orange',
  Comptable: 'bg-blue-50 text-blue-700',
  Admin: 'bg-nuit text-white',
};

export default function Utilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState<User[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [message, setMessage] = useState('');
  const [enCours, setEnCours] = useState(false);

  const [nouveau, setNouveau] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Collaborateur' as Role,
  });

  /** Liste des utilisateurs (GET /api/users) */
  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const reponse = await api.get<User[]>('/users');
      setUtilisateurs(reponse.data);
      setErreur('');
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  /** Création d'un utilisateur (POST /api/users — réservé à l'Admin) */
  const creerUtilisateur = async (evenement: FormEvent) => {
    evenement.preventDefault();
    setEnCours(true);
    setErreur('');
    try {
      await api.post('/users', {
        ...nouveau,
        password_confirmation: nouveau.password,
      });
      setNouveau({ name: '', email: '', password: '', role: 'Collaborateur' });
      setMessage('Utilisateur créé : il peut dès maintenant se connecter à COMPTALINK.');
      await charger();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(false);
    }
  };

  /** Modification du rôle (PUT /api/users/{id}) */
  const changerRole = async (utilisateur: User, role: Role) => {
    try {
      await api.put(`/users/${utilisateur.id}`, { role });
      setMessage(`Rôle de ${utilisateur.name} mis à jour : ${role}.`);
      await charger();
    } catch (e) {
      setErreur(messageErreur(e));
    }
  };

  /** Suppression d'un utilisateur (DELETE /api/users/{id}) */
  const supprimerUtilisateur = async (utilisateur: User) => {
    if (!window.confirm(`Supprimer définitivement le compte de ${utilisateur.name} ?`)) return;
    try {
      await api.delete(`/users/${utilisateur.id}`);
      setMessage(`Utilisateur ${utilisateur.name} supprimé.`);
      await charger();
    } catch (e) {
      setErreur(messageErreur(e));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-nuit">Gestion des utilisateurs</h1>
        <p className="text-sm text-gris">
          Comptes et rôles COMPTALINK : Collaborateur, Valideur, Comptable, Admin
        </p>
      </div>

      {erreur && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erreur}
        </div>
      )}
      {message && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span>{message}</span>
          <button
            type="button"
            className="text-xs font-semibold hover:underline"
            onClick={() => setMessage('')}
          >
            Fermer
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Liste */}
        <section className="cl-card overflow-hidden xl:col-span-2">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-lg font-semibold text-nuit">Utilisateurs COMPTALINK</h2>
            <p className="text-xs text-gris">{utilisateurs.length} compte(s) actif(s)</p>
          </div>

          {chargement ? (
            <p className="p-5 text-sm text-gris">Chargement des utilisateurs…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="cl-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>E-mail</th>
                    <th>Rôle</th>
                    <th>Créé le</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {utilisateurs.map((utilisateur) => (
                    <tr key={utilisateur.id}>
                      <td className="font-semibold text-nuit">{utilisateur.name}</td>
                      <td className="text-gris">{utilisateur.email}</td>
                      <td>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            couleurRole[utilisateur.role] ?? 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {utilisateur.role}
                        </span>
                      </td>
                      <td className="text-gris">{formaterDate(utilisateur.created_at)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <select
                            className="cl-input !w-auto !py-1 !text-xs"
                            value={utilisateur.role}
                            onChange={(e) =>
                              changerRole(utilisateur, e.target.value as Role)
                            }
                          >
                            {ROLES.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="text-xs font-semibold text-red-600 hover:underline"
                            onClick={() => supprimerUtilisateur(utilisateur)}
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Création */}
        <section className="cl-card p-5">
          <h2 className="text-lg font-semibold text-nuit">Nouvel utilisateur</h2>
          <p className="mt-1 text-xs text-gris">
            Le compte pourra se connecter immédiatement avec le mot de passe défini.
          </p>

          <form onSubmit={creerUtilisateur} className="mt-4 space-y-4">
            <div>
              <label className="cl-label" htmlFor="name">
                Nom complet
              </label>
              <input
                id="name"
                className="cl-input"
                value={nouveau.name}
                onChange={(e) => setNouveau((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ex. Salma Bennani"
                required
              />
            </div>
            <div>
              <label className="cl-label" htmlFor="email-utilisateur">
                Adresse e-mail
              </label>
              <input
                id="email-utilisateur"
                type="email"
                className="cl-input"
                value={nouveau.email}
                onChange={(e) => setNouveau((p) => ({ ...p, email: e.target.value }))}
                placeholder="prenom.nom@comptalink.ma"
                required
              />
            </div>
            <div>
              <label className="cl-label" htmlFor="password-utilisateur">
                Mot de passe
              </label>
              <input
                id="password-utilisateur"
                type="password"
                className="cl-input"
                value={nouveau.password}
                onChange={(e) => setNouveau((p) => ({ ...p, password: e.target.value }))}
                minLength={6}
                required
              />
            </div>
            <div>
              <label className="cl-label" htmlFor="role-utilisateur">
                Rôle
              </label>
              <select
                id="role-utilisateur"
                className="cl-input"
                value={nouveau.role}
                onChange={(e) => setNouveau((p) => ({ ...p, role: e.target.value as Role }))}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="cl-btn-primary w-full" disabled={enCours}>
              {enCours ? 'Création…' : "Créer l'utilisateur"}
            </button>
          </form>

          <div className="mt-5 rounded-lg bg-grisclair p-3 text-xs text-gris">
            <p className="font-semibold text-nuit">Droits par rôle</p>
            <p className="mt-1">Collaborateur : import et saisie des factures</p>
            <p>Valideur : approuve, rejette ou demande une correction</p>
            <p>Comptable : contrôle, validation et préparation de l'export Sage</p>
            <p>Admin : administration complète et gestion des comptes</p>
          </div>
        </section>
      </div>
    </div>
  );
}
