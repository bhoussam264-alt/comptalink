/**
 * COMPTALINK - Contexte d'authentification (Laravel Sanctum)
 * Expose : utilisateur courant, connexion, inscription, déconnexion.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api, TOKEN_KEY, USER_KEY } from '../lib/api';
import type { LoginResponse, Role, User } from '../types';

interface AuthContexte {
  user: User | null;
  chargement: boolean;
  connecte: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (donnees: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: Role;
  }) => Promise<User>;
  logout: () => Promise<void>;
  aLeRole: (roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContexte | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [chargement, setChargement] = useState(true);

  // Restauration de la session au démarrage de l'application
  useEffect(() => {
    const utilisateurStocke = localStorage.getItem(USER_KEY);
    const token = localStorage.getItem(TOKEN_KEY);

    if (utilisateurStocke && token) {
      setUser(JSON.parse(utilisateurStocke) as User);
      // Vérification de la validité du jeton auprès de l'API
      api
        .get<{ user: User }>('/me')
        .then((reponse) => {
          setUser(reponse.data.user);
          localStorage.setItem(USER_KEY, JSON.stringify(reponse.data.user));
        })
        .catch(() => {
          setUser(null);
        })
        .finally(() => setChargement(false));
    } else {
      setChargement(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const reponse = await api.post<LoginResponse>('/login', { email, password });
    localStorage.setItem(TOKEN_KEY, reponse.data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(reponse.data.user));
    setUser(reponse.data.user);
    return reponse.data.user;
  }, []);

  const register = useCallback(
    async (donnees: {
      name: string;
      email: string;
      password: string;
      password_confirmation: string;
      role: Role;
    }) => {
      const reponse = await api.post<LoginResponse>('/register', donnees);
      localStorage.setItem(TOKEN_KEY, reponse.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(reponse.data.user));
      setUser(reponse.data.user);
      return reponse.data.user;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/logout');
    } catch {
      // Le jeton est peut-être déjà révoqué : on nettoie quand même la session locale
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const aLeRole = useCallback((roles: Role[]) => (user ? roles.includes(user.role) : false), [user]);

  const valeur = useMemo<AuthContexte>(
    () => ({
      user,
      chargement,
      connecte: Boolean(user),
      login,
      register,
      logout,
      aLeRole,
    }),
    [user, chargement, login, register, logout, aLeRole],
  );

  return <AuthContext.Provider value={valeur}>{children}</AuthContext.Provider>;
}

/** Hook d'accès au contexte d'authentification */
export function useAuth(): AuthContexte {
  const contexte = useContext(AuthContext);
  if (!contexte) {
    throw new Error("useAuth doit être utilisé à l'intérieur de <AuthProvider>");
  }
  return contexte;
}
