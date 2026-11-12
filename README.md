# COMPTALINK MAROC

Application **Web + iOS** complémentaire à **Sage 100 Comptabilité**.

COMPTALINK **ne remplace pas Sage** : il organise l'amont de la chaîne comptable —
**collecte**, **contrôle**, **validation** et **préparation** des factures fournisseurs
pour les PME marocaines.

> Public cible : Assistants comptables, Comptables, Valideurs, Dirigeants PME, Cabinets comptables.

---

## Sommaire

- [Objectif](#objectif)
- [Stack technique](#stack-technique)
- [Architecture du projet](#architecture-du-projet)
- [Prérequis](#prérequis)
- [Installation & lancement](#installation--lancement)
  - [1. Backend Laravel](#1-backend-laravel-php--mysql)
  - [2. Frontend React](#2-frontend-react--vite)
  - [3. Application iOS (SwiftUI)](#3-application-ios-swiftui-optionnel)
- [Comptes de démonstration](#comptes-de-démonstration)
- [Fonctionnalités](#fonctionnalités)
- [Écrans](#écrans)
- [Cycle de vie d'une facture](#cycle-de-vie-dune-facture)
- [API REST](#api-rest)
- [Design](#design)

---

## Objectif

Centraliser les factures fournisseurs, extraire les données par **OCR**, détecter les
**erreurs et doublons**, suivre la **validation** et préparer l'**export vers Sage**.

Les alertes affichées sont des **risques à examiner**, jamais des certitudes :
chaque alerte peut être ignorée avec traçabilité (piste d'audit).

---

## Stack technique

| Couche        | Technologies                                                            |
| ------------- | ----------------------------------------------------------------------- |
| **Frontend**  | React 19 + Vite + TypeScript + Tailwind CSS 3 + React Router + Axios    |
| **Backend**   | Laravel 11 (PHP 8.2+) + MySQL / MariaDB                                 |
| **API**       | REST + authentification par jetons **Laravel Sanctum**                  |
| **OCR**       | Tesseract.js (côté navigateur) + API OCR simulée côté serveur           |
| **Mobile**    | SwiftUI (iOS) — mêmes fonctionnalités : scan, liste, validation         |

> Aucune dépendance à Node/Express ni à Supabase : le back-office est **100 % Laravel**.

---

## Architecture du projet

```
temp_20261109_01/
├── backend/                  # API Laravel 11
│   ├── app/
│   │   ├── Http/Controllers/Api/   # Auth, Facture, Fournisseur, Validation, Dashboard, User, Ocr
│   │   └── Models/                 # User, Fournisseur, Facture, Validation, Alerte, PieceJustificative
│   ├── database/
│   │   ├── migrations/             # users, fournisseurs, factures, validations, alertes, pieces_justificatives
│   │   └── seeders/                # 4 utilisateurs + 5 fournisseurs + 8 factures de démo
│   ├── routes/api.php              # Toutes les routes REST (/api/...)
│   └── .env                        # Configuration (BDD, nom, fuseau horaire)
│
├── frontend/                 # Application Web React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/                  # 7 écrans (Login, Dashboard, Factures, ...)
│   │   ├── components/             # Layout, Logo, StatutBadge, ProtectedRoute
│   │   ├── context/AuthContext.tsx # Session + rôles (Sanctum)
│   │   ├── lib/                    # api.ts (axios), format.ts, ocr.ts (Tesseract.js)
│   │   └── types.ts                # Types TypeScript partagés
│   └── .env                        # VITE_API_URL
│
└── ios/COMPTALINK/           # Application iOS SwiftUI
    ├── COMPTALINKApp.swift
    ├── APIClient.swift / SessionStore.swift / Models.swift
    └── Views/                      # Login, Dashboard, Factures, Détail, Validation, Scan
```

---

## Prérequis

- **PHP** ≥ 8.2 et **Composer**
- **Node.js** ≥ 20 et **npm**
- **MySQL** ou **MariaDB** (démarré, ex. via XAMPP)
- **Xcode** ≥ 15 (uniquement pour la partie iOS)

---

## Installation & lancement

### 1. Backend Laravel (PHP + MySQL)

```bash
cd backend

# Dépendances PHP
composer install

# Configuration de l'environnement
copy .env.example .env        # Windows (PowerShell)
# cp .env.example .env        # macOS / Linux
php artisan key:generate
```

Créer la base de données MySQL nommée **`comptalink`**, puis vérifier les identifiants
dans `backend/.env` :

```env
APP_NAME=COMPTALINK
APP_TIMEZONE=Africa/Casablanca
APP_URL=http://127.0.0.1:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=comptalink
DB_USERNAME=root
DB_PASSWORD=
DB_COLLATION=utf8mb4_unicode_ci

FRONTEND_URL=http://localhost:5173
```

> `DB_COLLATION=utf8mb4_unicode_ci` est indispensable pour MariaDB (10.4),
> qui ne connaît pas le collation `utf8mb4_0900_ai_ci` de MySQL 8.

Ensuite : migrations, données de démo et lien de stockage.

```bash
php artisan migrate:fresh --seed
php artisan storage:link
```

Démarrer l'API :

```bash
php artisan serve
```

→ API disponible sur **http://127.0.0.1:8000/api**

### 2. Frontend React + Vite

```bash
cd frontend

npm install
npm run dev
```

→ Application disponible sur **http://localhost:5173**

Le fichier `frontend/.env` doit pointer vers l'API :

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

> **Les deux serveurs doivent tourner en parallèle** (un terminal pour
> `php artisan serve`, un autre pour `npm run dev`).

Build de production (optionnel) :

```bash
npm run build      # génère le dossier frontend/dist
```

### 3. Application iOS SwiftUI (optionnel)

1. Ouvrir Xcode → **File ▸ New ▸ Project ▸ App** (Interface : **SwiftUI**, Langage : **Swift**),
   nommer le projet **COMPTALINK**.
2. Glisser les fichiers du dossier `ios/COMPTALINK/` dans le projet Xcode.
3. Dans `APIClient.swift`, vérifier l'URL de base de l'API
   (`http://127.0.0.1:8000/api` sur simulateur).
4. Ajouter `NSCameraUsageDescription` dans le fichier `Info.plist` (autorisation caméra
   pour le scan de documents).
5. Lancer sur simulateur ou appareil (⌘R).

---

## Comptes de démonstration

| Rôle              | Email                     | Mot de passe |
| ----------------- | ------------------------- | ------------ |
| **Admin**         | `admin@comptalink.ma`     | `123456`     |
| **Comptable**     | `comptable@comptalink.ma` | `123456`     |
| **Valideur**      | `valideur@comptalink.ma`  | `123456`     |
| **Collaborateur** | `collab@comptalink.ma`    | `123456`     |

Les mêmes comptes sont cliquables directement sur l'écran de connexion (remplissage
automatique) pour faciliter la démonstration.

**Données de démo** : 8 factures réparties sur les 6 statuts, avec des fournisseurs
marocains — **Maroc Telecom, ONEE, IAM, Lydec, Fournisseur X** — dont une facture en
**doublon potentiel** et une avec **TVA incohérente** pour illustrer les contrôles.

---

## Fonctionnalités

### 1. Centralisation

- Page **Mes Factures** : liste, **recherche** (numéro / fournisseur) et **filtres par statut**.
- Boutons **Importer PDF/Image** et **Transférer par Email** (simulation).
- Chaque facture possède un **dossier** regroupant le fichier d'origine et ses
  **pièces justificatives**.

### 2. Lecture OCR

- Après import, un **formulaire pré-rempli** propose : Fournisseur, N° Facture,
  Date, Échéance, Montant HT, TVA, Montant TTC.
- **Tous les champs sont modifiables** + bouton **Confirmer les champs**.
- Badge **« Proposé par OCR – À vérifier »** pour signaler l'origine des données.
- OCR réel via **Tesseract.js** pour les images ; API simulée (`/api/ocr/extract`) pour les PDF.

### 3. Contrôles et alertes

Logique exécutée automatiquement dans `FactureController` :

| Règle                       | Condition                                                | Niveau  |
| --------------------------- | -------------------------------------------------------- | ------- |
| **TVA incohérente**         | `montant_HT + tva ≠ montant_TTC` (écart > 0.01)          | 🔴 Rouge |
| **Doublon potentiel**       | même fournisseur + même numéro + même montant TTC        | 🟠 Orange |
| **Champ manquant**          | champ obligatoire non renseigné                          | 🟡 Jaune |

- Ce sont des **risques**, pas des certitudes.
- Boutons **Ignorer l'alerte** et **Voir l'autre facture** (pour le doublon).

### 4. Validation et suivi

- Page **Détail Facture** avec **timeline** : Reçue → À vérifier → En validation →
  Validée → Prête pour Sage → Archivée.
- **Assigner un Responsable** via une liste déroulante d'utilisateurs.
- Boutons **Approuver**, **Rejeter**, **Demander correction**.
- **Historique complet** (qui, quand, quoi) : véritable **piste d'audit**.

### 5. Tableau de bord et historique

- **4 cartes** : Factures en attente, Échéances proches, En retard, Validées ce mois.
- Listes **Échéances proches** et **Dernières actions**.
- **Graphique** : répartition des factures par statut.

---

## Écrans

| # | Écran                          | Rôle principal          |
| - | ------------------------------ | ----------------------- |
| 1 | Login / Inscription            | Tous (Sanctum)          |
| 2 | Dashboard COMPTALINK           | Tous                    |
| 3 | Liste des Factures             | Tous                    |
| 4 | Détail Facture + OCR + Alertes | Comptable / Valideur    |
| 5 | Nouvelle Facture (Import)      | Collaborateur           |
| 6 | Validation                     | Valideur / Comptable    |
| 7 | Gestion Utilisateurs           | Admin                   |

---

## Cycle de vie d'une facture

```
Reçue ──▶ À vérifier ──▶ En validation ──▶ Validée ──▶ Prête pour Sage ──▶ Archivée
                              │                                            ▲
                              └──────────── Rejeté ────────────────────────┘
```

- **Approuvé** → statut **Validée**
- **Demander correction** → statut **À vérifier**
- **Rejeté** → statut **Archivée**

---

## API REST

Authentification par **jeton Bearer** (Laravel Sanctum). Le login renvoie
`{ token, user }` ; le jeton est ensuite envoyé dans l'en-tête `Authorization: Bearer <token>`.

### Routes publiques

| Méthode | Endpoint         | Description                     |
| ------- | ---------------- | ------------------------------- |
| POST    | `/api/login`     | Connexion (renvoie un jeton)    |
| POST    | `/api/register`  | Création de compte              |

### Routes protégées (`auth:sanctum`)

| Méthode       | Endpoint                              | Description                              |
| ------------- | ------------------------------------- | ---------------------------------------- |
| GET           | `/api/me`                             | Utilisateur connecté                     |
| POST          | `/api/logout`                         | Déconnexion                              |
| GET/POST/PUT/DELETE | `/api/users`                    | Gestion des utilisateurs (Admin)         |
| GET/POST/PUT/DELETE | `/api/fournisseurs`             | Gestion des fournisseurs                 |
| GET/POST/PUT/DELETE | `/api/factures`                 | Gestion des factures                     |
| POST          | `/api/factures/{id}/statut`           | Changement de statut                     |
| POST          | `/api/factures/{id}/assigner`         | Assigner un responsable                   |
| POST          | `/api/factures/{id}/ignorer-alerte`   | Ignorer une alerte                       |
| POST          | `/api/factures/{id}/pieces-justificatives` | Ajouter une pièce justificative     |
| POST          | `/api/factures/{id}/transferer-email` | Transfert par email (simulation)         |
| GET/POST      | `/api/validations`                    | Historique et enregistrement des décisions |
| GET           | `/api/dashboard`                      | Données du tableau de bord               |
| POST          | `/api/ocr/extract`                    | Extraction OCR simulée                   |

---

## Design

- **Bleu nuit** `#1E3A5F`
- **Bleu** `#2E86AB`
- **Orange** `#F18F01`
- **Blanc** & **Gris clair** `#F4F6F9`

Interface **100 % en français**, **responsive** (Web + Mobile), police Inter.

---

## Auteur / Contexte

Projet **COMPTALINK** — développement frontend React + backend Laravel, dans le cadre
d'une soutenance. Code commenté et structuré pour la démonstration.
