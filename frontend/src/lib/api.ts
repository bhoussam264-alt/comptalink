/**
 * COMPTALINK - Client HTTP centralisé vers l'API REST Laravel
 */
import axios from 'axios';
import type { AxiosError } from 'axios';

export const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://127.0.0.1:8000/api';

export const TOKEN_KEY = 'comptalink_token';
export const USER_KEY = 'comptalink_user';

/** Instance axios partagée par toute l'application */
export const api = axios.create({
  baseURL: API_URL,
  headers: { Accept: 'application/json' },
  timeout: 30000,
});

/** Ajoute le jeton Sanctum à chaque requête */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Déconnexion automatique si le jeton est expiré / révoqué */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

/** Transforme une erreur axios en message lisible (en français) */
export function messageErreur(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
  if (axiosError?.response) {
    const data = axiosError.response.data;
    if (data?.errors) {
      const premier = Object.values(data.errors)[0];
      if (premier?.length) return premier[0];
    }
    if (data?.message) return data.message;
    return `Erreur serveur (${axiosError.response.status})`;
  }
  if (axiosError?.request) {
    return "Impossible de joindre l'API COMPTALINK. Vérifiez que le backend Laravel est démarré (php artisan serve).";
  }
  return 'Une erreur inattendue est survenue.';
}
