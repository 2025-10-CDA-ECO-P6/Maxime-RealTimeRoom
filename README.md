# RealTimeRoom

Application de chat en temps réel avec une interface inspirée de l'ancien Skype, construite avec React, Node.js et Socket.io.

---

## Sommaire

- [Aperçu](#aperçu)
- [Architecture](#architecture)
- [Prérequis](#prérequis)
- [Variables d'environnement](#variables-denvironnement)
- [Installation & Développement](#installation--développement)
- [Production](#production)
- [Déploiement sur Render](#déploiement-sur-render)
- [Structure du projet](#structure-du-projet)
- [Stack technique](#stack-technique)
- [Événements Socket.io](#événements-socketio)

---

## Aperçu

RealTimeRoom est un chat multi-utilisateurs temps réel. L'utilisateur choisit un pseudo sur un écran de connexion stylisé façon Skype classique (2010), puis accède à un salon de discussion partagé. Tous les messages sont diffusés en broadcast à tous les clients connectés via WebSocket.

**Fonctionnalités :**

- Connexion par pseudo (2–20 caractères)
- Chat temps réel multi-utilisateurs
- Distinction visuelle messages envoyés / reçus
- Sélecteur d'emojis rapide (6 emojis)
- Indicateur de connexion en direct (online / offline)
- Design rétro Skype avec thème bleu Windows Aero
- Défilement automatique vers le dernier message

> Les messages ne sont pas persistés — ils sont perdus au redémarrage du serveur.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        CLIENT                           │
│                                                         │
│  React 19 + TypeScript + Vite                           │
│  ┌──────────┐   ┌──────────┐   ┌─────────────────────┐ │
│  │  Login   │──▶│   Chat   │──▶│  MessagesBox        │ │
│  │  (page)  │   │  (page)  │   │  ChatBar            │ │
│  └──────────┘   └──────────┘   │  ConnectionManager  │ │
│                      │         └─────────────────────┘ │
│                  socket.ts (Socket.io-client)           │
└──────────────────────┬──────────────────────────────────┘
                       │ WebSocket (Socket.io)
                       │
┌──────────────────────▼──────────────────────────────────┐
│                        SERVEUR                          │
│                                                         │
│  Node.js 20 + Express 5 + Socket.io 4                   │
│                                                         │
│  GET  /           → index.html (dev fallback)           │
│  GET  /health     → {"status":"ok"}                     │
│  WS   chat message → broadcast à tous les clients       │
└─────────────────────────────────────────────────────────┘
```

### Flux applicatif

1. L'utilisateur ouvre l'app → `App.tsx` vérifie si un `username` est défini.
2. Pas de username → affichage de `Login.tsx` (formulaire de connexion).
3. Username validé → affichage de `Chat.tsx` + connexion Socket.io.
4. À chaque message envoyé : `socket.emit('chat message', { user, text })`.
5. Le serveur reçoit l'événement et le `io.emit()` à **tous** les clients connectés.
6. Chaque client reçoit le message et met à jour son état local React.

---

## Prérequis

| Outil   | Version minimale |
|---------|-----------------|
| Node.js | 20.x            |
| pnpm    | 9.x             |
| Docker  | 24.x (production)|

---

## Variables d'environnement

### API (`api/`)

Aucune variable d'environnement requise actuellement. Le serveur écoute sur le port **3000** en dur.

> Pour configurer dynamiquement le port, ajouter dans `api/index.js` :
> ```js
> const PORT = process.env.PORT || 3000;
> ```

### Web (`web/`)

La variable est gérée par Vite via `import.meta.env.PROD` :

| Variable Vite          | Valeur en dev                     | Valeur en prod                          |
|------------------------|-----------------------------------|-----------------------------------------|
| `import.meta.env.PROD` | `false` → `http://localhost:3000` | `true` → `https://api-27op.onrender.com` |

Pour pointer vers un autre backend en production, modifier `web/src/socket.ts` :

```ts
const URL = import.meta.env.PROD
  ? 'https://VOTRE_API_URL.onrender.com'
  : 'http://localhost:3000';
```

---

## Installation & Développement

### 1. Cloner le dépôt

```bash
git clone https://github.com/VOTRE_USERNAME/Maxime-RealTimeRoom.git
cd Maxime-RealTimeRoom
```

### 2. Installer les dépendances

```bash
pnpm install
```

> pnpm workspaces installe les dépendances de `api/` et `web/` en une seule commande depuis la racine.

### 3. Lancer les serveurs de développement

```bash
pnpm dev
```

Cette commande lance en parallèle :

| Service | URL                     | Description                       |
|---------|-------------------------|-----------------------------------|
| API     | `http://localhost:3000` | Express + Socket.io avec `--watch` |
| Web     | `http://localhost:5173` | Vite HMR                          |

> Pour lancer un service individuellement :
> ```bash
> pnpm --filter api dev
> pnpm --filter web dev
> ```

### 4. Linter

```bash
pnpm --filter web lint
```

---

## Production

### Build du frontend

```bash
pnpm --filter web build
```

Les fichiers compilés sont générés dans `web/dist/`.

### Preview local du build

```bash
pnpm --filter web preview
```

### Via Docker (recommandé)

**Build des images :**

```bash
# API
docker build -t realtimeroom-api ./api

# Web
docker build -t realtimeroom-web ./web
```

**Lancer les conteneurs :**

```bash
# API – port 3000
docker run -p 3000:3000 realtimeroom-api

# Web – port 80
docker run -p 80:80 realtimeroom-web
```

---

## Déploiement sur Render

Le fichier `render.yaml` définit deux services Docker sur Render.com (free tier) :

| Service | Dockerfile          | Port exposé |
|---------|---------------------|-------------|
| `web`   | `./web/Dockerfile`  | 80          |
| `api`   | `./api/Dockerfile`  | 3000        |

### Étapes

1. Pousser le code sur GitHub.
2. Connecter le dépôt sur [render.com](https://render.com).
3. Render détecte `render.yaml` et crée les deux services automatiquement.
4. Mettre à jour l'URL de l'API dans `web/src/socket.ts` avec l'URL générée par Render.
5. Mettre à jour l'origine CORS dans `api/index.js` avec l'URL du frontend Render.

### CORS

Dans `api/index.js`, ajouter l'URL de production du frontend :

```js
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'https://web-9h33.onrender.com', // URL frontend Render
    ],
  },
});
```

---

## Structure du projet

```
Maxime-RealTimeRoom/
├── api/                        # Service backend (Node.js)
│   ├── index.js               # Point d'entrée Express + Socket.io
│   ├── package.json           # Dépendances backend
│   └── Dockerfile             # Image Docker Node 20 Alpine
│
├── web/                        # Service frontend (React)
│   ├── src/
│   │   ├── main.tsx           # Point d'entrée React
│   │   ├── App.tsx            # Routing Login ↔ Chat
│   │   ├── socket.ts          # Initialisation Socket.io-client
│   │   ├── index.css          # Styles globaux
│   │   ├── pages/
│   │   │   ├── Login.tsx      # Page de connexion
│   │   │   ├── Login.css      # Styles login (thème Skype)
│   │   │   ├── Chat.tsx       # Page de chat principale
│   │   │   └── Chat.css       # Styles chat (thème Skype)
│   │   └── components/
│   │       ├── ChatBar.tsx         # Barre d'envoi + emojis
│   │       ├── MessagesBox.tsx     # Liste des messages
│   │       └── ConnectionManager.tsx # Statut connexion
│   ├── index.html             # HTML racine (Vite)
│   ├── vite.config.ts         # Config Vite
│   ├── tsconfig.json          # Config TypeScript
│   ├── nginx.conf             # Config Nginx (SPA + cache)
│   ├── eslint.config.js       # Config ESLint
│   ├── package.json           # Dépendances frontend
│   └── Dockerfile             # Build multi-stage + Nginx
│
├── pnpm-workspace.yaml        # Config monorepo pnpm
├── render.yaml                # Config déploiement Render.com
├── package.json               # Scripts racine
├── pnpm-lock.yaml             # Lockfile pnpm
├── README.md
├── CONTRIBUTING.md
└── VEILLE.md
```

---

## Stack technique

| Couche    | Technologie        | Version | Rôle                              |
|-----------|--------------------|---------|-----------------------------------|
| Backend   | Node.js            | 20      | Runtime JavaScript côté serveur   |
| Backend   | Express            | 5.x     | Serveur HTTP                      |
| Backend   | Socket.io (server) | 4.x     | WebSocket temps réel              |
| Frontend  | React              | 19.x    | UI déclarative composants         |
| Frontend  | TypeScript         | 5.x     | Typage statique                   |
| Frontend  | Vite               | 7.x     | Bundler + serveur de dev HMR      |
| Frontend  | Socket.io (client) | 4.x     | Client WebSocket                  |
| Frontend  | SASS               | 1.x     | Préprocesseur CSS                 |
| Ops       | Docker             | —       | Conteneurisation                  |
| Ops       | Nginx              | Alpine  | Serveur de fichiers statiques     |
| Ops       | Render.com         | —       | Hébergement cloud                 |
| Outillage | pnpm workspaces    | 9.x     | Gestion monorepo                  |
| Outillage | ESLint             | 9.x     | Linting TypeScript/React          |

---

## Événements Socket.io

| Événement      | Émis par  | Reçu par           | Payload                          |
|----------------|-----------|--------------------|----------------------------------|
| `chat message` | Client    | Serveur            | `{ user: string, text: string }` |
| `chat message` | Serveur   | Tous les clients   | `{ user: string, text: string }` |
| `connect`      | Socket.io | Client             | —                                |
| `disconnect`   | Socket.io | Client             | —                                |

Le serveur effectue un **broadcast complet** (`io.emit`) — l'émetteur reçoit aussi son propre message en retour.
