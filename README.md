# Maison Marvel - L'Album de Noces

Ce projet est une application web moderne (Frontend React/Vite + Backend Node.js/Express) conçue pour permettre aux clients/couples de trier leurs photos de mariage (sélection coup de cœur, quotas par catégorie, messagerie intégrée).

---

## 🏗️ Architecture Technique

- **Frontend** : Single Page Application construite en **React** et **TypeScript** avec **Vite** et **TailwindCSS**.
- **Backend** : Serveur **Express** en TypeScript (`server.ts`), compilé en production dans `dist/server.cjs` via **esbuild**.
- **Base de données** : **Supabase** (PostgreSQL) pour stocker les métadonnées des photos, les sélections des clients, les informations des couples et les messages de chat.
- **Hébergement d'images** : **Cloudinary** pour le stockage et l'optimisation des images téléchargées par les administrateurs.
- **Déploiement en production** : **Hostinger Business Web Apps** (Node.js).

---

## 💻 Développement Local

### Prérequis
- Node.js (version 20+)
- npm

### 1. Installation des dépendances
```bash
npm install
```

### 2. Configuration de l'environnement (`.env.local`)
Créez un fichier `.env.local` à la racine du projet et remplissez les variables suivantes :
```env
GEMINI_API_KEY=""
APP_URL="http://localhost:3001"

# --- Configuration Cloudinary ---
CLOUDINARY_CLOUD_NAME="ddud0iscc"
CLOUDINARY_API_KEY="779616959764771"
CLOUDINARY_API_SECRET="nGRapy2K0fEXICbrZ-SDG9ZoQz0"
CLOUDINARY_UPLOAD_PRESET="[votre_preset_non_signe]" # Requis pour le chargement d'images

# --- Configuration Supabase ---
VITE_SUPABASE_URL="https://ibccabrmzckfmwqsevsw.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="[votre_cle_de_securite_service_role]"
```

### 3. Lancer le serveur de développement
```bash
npm run dev
```
Le site sera accessible localement sur : **http://localhost:3001**

---

## 🗄️ Structure de la Base de données (Supabase)

L'application utilise quatre tables principales dans le schéma `public` de la base Postgres :

### 1. `wedding_projects`
Représente les couples de mariés (clients).
- `id` : `TEXT` (Primary Key, identifiant unique ex: `sophie-marc`)
- `couple` : `TEXT` (Nom d'affichage des mariés)
- `wedding_date` : `TEXT`
- `country` : `TEXT`
- `status` : `TEXT`
- `progress` : `NUMERIC`
- `amount` : `NUMERIC`
- `delay_days` : `INTEGER`
- `is_legacy` : `BOOLEAN`
- `requires_sync` : `BOOLEAN`

### 2. `wedding_client_selections`
Stocke l'état d'avancement du tri pour chaque couple.
- `project_id` : `TEXT` (Primary Key, clé étrangère référençant `wedding_projects.id`)
- `target_count` : `INTEGER` (Objectif global de photos à choisir)
- `target_category_quotas` : `JSONB` (Quotas par catégorie)
- `selected_photo_ids` : `TEXT[]` (Tableau des identifiants des photos aimées)
- `disliked_photo_ids` : `TEXT[]` (Tableau des identifiants des photos rejetées)
- `notes` : `TEXT` (Notes laissées par le couple)
- `updated_at` : `TEXT`

### 3. `wedding_photos`
Stocke les métadonnées de toutes les photos du catalogue.
- `id` : `UUID` (Primary Key, généré par défaut via `gen_random_uuid()`)
- `name` : `TEXT`
- `image` : `TEXT` (URL sécurisée Cloudinary)
- `category` : `TEXT` (ex: `Dot`, `Classique`, `Album`)
- `project_id` : `TEXT` (Clé étrangère optionnelle référençant `wedding_projects.id`. Si `NULL`, la photo est globale et visible par tous les clients).
- `created_at` : `TIMESTAMPTZ`

### 4. `wedding_chats`
Stocke l'historique des discussions internes.
- `id` : `UUID` (Primary Key, `gen_random_uuid()`)
- `project_id` : `TEXT` (Clé étrangère référençant `wedding_projects.id`)
- `sender` : `TEXT` (ex: `client` ou `photographer`)
- `text` : `TEXT`
- `timestamp` : `TEXT`

---

## 🚀 Déploiement en Production (Hostinger)

Le site est déployé sur **Hostinger Web Apps** Node.js avec synchronisation automatique Git.

### Connexion GitHub
Le déploiement est connecté au dépôt privé GitHub :
👉 [https://github.com/nar6-001/tri-photo-les-marvelous-wedding](https://github.com/nar6-001/tri-photo-les-marvelous-wedding)
Chaque push sur la branche `main` déclenche un build automatique.

### Paramètres Hostinger hPanel
- **Version Node.js** : `Node 20` (ou plus récent)
- **Fichier d'entrée (Entry File)** : `dist/server.cjs`
- **Commande de Build** : `npm install && npm run build`
- **Commande de Démarrage (Start)** : `npm start` (exécute `node dist/server.cjs`)

### Variables d'environnement requises (dans hPanel)
Vous devez renseigner ces variables pour que l'application en ligne fonctionne :

| Nom de Variable | Valeur / Rôle |
| :--- | :--- |
| `VITE_SUPABASE_URL` | L'URL de votre instance Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé d'accès administrateur de Supabase (permet de contourner les règles RLS) |
| `CLOUDINARY_CLOUD_NAME` | Identifiant Cloud Name de votre console Cloudinary |
| `CLOUDINARY_API_KEY` | Clé d'API Cloudinary |
| `CLOUDINARY_API_SECRET` | Clé secrète d'API Cloudinary |
| `CLOUDINARY_UPLOAD_PRESET` | Preset d'envoi non-signé (Unsigned Upload Preset) de Cloudinary |
| `NODE_TLS_REJECT_UNAUTHORIZED` | Définir à `0`. Obligatoire pour contourner le rejet de signature SSL Supabase en mutualisé. |

---

## 🛠️ Astuces & Règlements Spécifiques de Code

- **Redirection des logs d'erreurs (Hostinger)** : 
  Le serveur web de production Hostinger ne capture pas toujours `stderr`. Au sommet de `server.ts`, `console.error` est surchargé vers `console.log` et les gestionnaires de processus `uncaughtException` capturent et affichent les traces de pile d'exécution dans le canal `stdout` pour les rendre visibles dans le panneau "Journaux d'exécution" de Hostinger.
  
- **Import sans écoute (NO_SERVER_START)** :
  L'invocation de `startServer()` est bloquée si `process.env.NO_SERVER_START === "true"`. Cela permet d'importer `DEFAULT_PHOTOS` de `server.ts` dans les scripts secondaires (comme le script d'initialisation de base de données) sans créer de conflit de port `EADDRINUSE`.
