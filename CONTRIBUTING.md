# Guide de contribution — RealTimeRoom

Ce document décrit le workflow de développement, les conventions de code et les règles à respecter pour contribuer au projet.

---

## Sommaire

- [Workflow Git](#workflow-git)
- [Scripts disponibles](#scripts-disponibles)
- [Conventions de code](#conventions-de-code)
- [Conventions CSS / SCSS (BEM)](#conventions-css--scss-bem)
- [Règles TypeScript](#règles-typescript)
- [Intégration continue (CI)](#intégration-continue-ci)
- [Structure des commits](#structure-des-commits)

---

## Workflow Git

### Modèle de branches

Ce projet suit un workflow simple à deux niveaux :

```
main
└── feature/<nom-feature>
└── fix/<nom-bug>
└── chore/<nom-tache>
```

| Préfixe     | Usage                                         |
|-------------|-----------------------------------------------|
| `feature/`  | Nouvelle fonctionnalité                        |
| `fix/`      | Correction de bug                              |
| `chore/`    | Tâche technique (deps, config, docs)          |
| `refactor/` | Refactorisation sans ajout de fonctionnalité  |

### Créer une branche

```bash
# Toujours partir d'un main à jour
git checkout main
git pull origin main

# Créer et basculer sur la nouvelle branche
git checkout -b feature/nom-de-la-feature
```

### Cycle de travail

```
1. Créer la branche depuis main
2. Développer + commiter régulièrement
3. Lancer le lint avant de pousser
4. Ouvrir une Pull Request vers main
5. Review (si en équipe) → merge
6. Supprimer la branche après merge
```

### Pousser et ouvrir une PR

```bash
git push origin feature/nom-de-la-feature
# Ouvrir la PR depuis GitHub
```

---

## Scripts disponibles

### Depuis la racine (monorepo)

| Script        | Commande            | Description                                       |
|---------------|---------------------|---------------------------------------------------|
| Dev (tout)    | `pnpm dev`          | Lance API + Web en parallèle                     |
| Install (tout)| `pnpm install`      | Installe les dépendances de tous les packages    |

### Package `api/`

| Script | Commande                       | Description                             |
|--------|--------------------------------|-----------------------------------------|
| Dev    | `pnpm --filter api dev`        | Node.js avec `--watch` (rechargement auto) |

### Package `web/`

| Script   | Commande                        | Description                          |
|----------|---------------------------------|--------------------------------------|
| Dev      | `pnpm --filter web dev`         | Vite dev server avec HMR             |
| Build    | `pnpm --filter web build`       | Compile TypeScript + bundle Vite     |
| Preview  | `pnpm --filter web preview`     | Prévisualisation du build production |
| Lint     | `pnpm --filter web lint`        | ESLint sur tout le code frontend     |

### Docker

```bash
# Build image API
docker build -t realtimeroom-api ./api

# Build image Web
docker build -t realtimeroom-web ./web

# Lancer API
docker run -p 3000:3000 realtimeroom-api

# Lancer Web
docker run -p 80:80 realtimeroom-web
```

---

## Conventions de code

### JavaScript / Backend (`api/`)

- CommonJS (`require` / `module.exports`) — le backend est en JavaScript pur, sans TypeScript.
- Pas d'async/await inutile sur des opérations synchrones.
- Garder `index.js` minimal : logique Socket.io et routes HTTP uniquement.
- Nommer les variables et fonctions en **camelCase**.

### TypeScript / Frontend (`web/`)

- Tous les fichiers `.ts` / `.tsx` doivent compiler sans erreurs TypeScript.
- Ne pas utiliser `any` sauf cas exceptionnel justifié par un commentaire.
- Les interfaces partagées entre composants se définissent dans le fichier qui les expose en premier (exemple : `ChatMessage` dans `Chat.tsx`).
- Nommer les composants React en **PascalCase**, les fichiers aussi.
- Nommer les fonctions et variables en **camelCase**.
- Les props des composants sont typées avec une `interface` ou un type inline simple.

Exemple de typage correct :

```tsx
// Bien : interface explicite exportée
export interface ChatMessage {
  id: string;
  user: string;
  text: string;
  time: string;
  self: boolean;
}

// Bien : props typées inline pour composants simples
function ChatBar({ onSend, isConnected }: { onSend: (text: string) => void; isConnected: boolean }) { ... }
```

---

## Conventions CSS / SCSS (BEM)

Les styles utilisent la méthodologie **BEM** (Block, Element, Modifier) avec un préfixe de namespace `skype-` pour l'ensemble du thème.

### Règle de nommage

```
.[namespace]-[block]
.[namespace]-[block]__[element]
.[namespace]-[block]--[modifier]
```

### Exemples concrets du projet

```css
/* Block */
.skype-app { }

/* Element */
.skype-titlebar { }
.skype-titlebar-left { }  /* sous-élément de titlebar */
.skype-chat-title { }

/* Modifier */
.skype-avatar.self { }    /* avatar de l'utilisateur courant */
.skype-avatar.offline { } /* avatar d'un contact hors-ligne */
.skype-contact.active { } /* contact sélectionné */
```

### Organisation des fichiers CSS

| Fichier              | Contenu                                              |
|----------------------|------------------------------------------------------|
| `src/index.css`      | Reset global, variables CSS (`:root`), typographie  |
| `src/pages/Login.css`| Styles de la page de connexion uniquement            |
| `src/pages/Chat.css` | Styles de la page de chat et tous ses sous-blocs    |

### Variables CSS

Déclarer les valeurs réutilisables dans `:root` dans `index.css` :

```css
:root {
  --skype-blue: #00aff0;
  --skype-blue-dark: #0093cc;
  --skype-online: #44cc44;
  --skype-offline: #999999;
  /* ... */
}
```

### Règles à respecter

- **Un fichier CSS par page** — ne pas mélanger les styles Chat et Login.
- Les composants (`ChatBar`, `MessagesBox`, etc.) utilisent les classes définies dans le CSS de la page parente (`Chat.css`).
- Pas de styles inline dans les composants React (`style={{}}`), sauf animation dynamique impossible autrement.
- Les classes utilitaires génériques vont dans `index.css`.
- Éviter la profondeur de sélecteurs supérieure à 3 niveaux.

---

## Règles TypeScript

Le fichier `tsconfig.json` est configuré avec les options strictes de Vite.

### Ce qui est interdit

```ts
// Interdit : any implicite
function foo(x) { return x; }

// Interdit : any explicite sans commentaire
const data: any = fetchData();

// Interdit : assertion non nulle non justifiée
const el = document.getElementById('app')!;
```

### Ce qui est requis

```ts
// Requis : typer les paramètres de fonction
function sendMessage(text: string): void { ... }

// Requis : typer les états React
const [messages, setMessages] = useState<ChatMessage[]>([]);

// Requis : typer les props des composants
function MessagesBox({ messages }: { messages: ChatMessage[] }) { ... }
```

### ESLint

La configuration ESLint (`eslint.config.js`) étend les règles recommandées pour React + TypeScript. Lancer le lint avant chaque commit :

```bash
pnpm --filter web lint
```

Les erreurs de lint bloquent le build (`tsc -b && vite build`). Ne pas ignorer les warnings avec `eslint-disable` sans justification.

---

## Intégration continue (CI)

Il n'y a pas encore de pipeline CI automatisé. Les vérifications suivantes doivent être faites **manuellement avant chaque push** :

### Checklist pré-push

```bash
# 1. Vérifier que le lint passe sans erreur
pnpm --filter web lint

# 2. Vérifier que le build TypeScript compile
pnpm --filter web build

# 3. Vérifier que le serveur API démarre
pnpm --filter api dev
# → "server running at 3000" doit apparaître

# 4. Vérifier que le frontend se connecte en dev
pnpm --filter web dev
# → Ouvrir http://localhost:5173 et tester le chat
```

### Règles sur la branche `main`

- Ne jamais pousser directement sur `main` du code cassant le build.
- Le build Docker (`docker build`) doit réussir avant de merger.
- Le fichier `render.yaml` est la source de vérité pour le déploiement.

### À venir (recommandations CI)

Si un pipeline GitHub Actions est ajouté, il devra inclure :

```yaml
# Exemple de jobs recommandés
- name: Install
  run: pnpm install

- name: Lint
  run: pnpm --filter web lint

- name: Build
  run: pnpm --filter web build

- name: Docker build API
  run: docker build ./api

- name: Docker build Web
  run: docker build ./web
```

---

## Structure des commits

Utiliser le format **Conventional Commits** :

```
<type>(<scope>): <description courte>

[corps optionnel]
```

### Types autorisés

| Type       | Usage                                              |
|------------|----------------------------------------------------|
| `feat`     | Nouvelle fonctionnalité                            |
| `fix`      | Correction de bug                                  |
| `chore`    | Mise à jour de dépendances, config, fichiers       |
| `docs`     | Documentation uniquement                           |
| `refactor` | Refactorisation sans changement de comportement    |
| `style`    | Formatage, espaces, CSS pur (sans logique)         |
| `test`     | Ajout ou modification de tests                     |

### Scopes

| Scope   | Concerne                         |
|---------|----------------------------------|
| `api`   | Backend Node.js                  |
| `web`   | Frontend React                   |
| `docker`| Dockerfiles ou docker-compose    |
| `ci`    | Configuration CI/CD              |
| `deps`  | Mise à jour de dépendances       |

### Exemples

```
feat(web): add emoji picker to chat bar
fix(api): handle missing user field in chat message
chore(deps): update socket.io to 4.8.3
docs: add CONTRIBUTING.md
style(web): fix inconsistent spacing in Chat.css
refactor(web): extract socket initialization to socket.ts
```

### Règles supplémentaires

- La description est en **anglais**, à l'impératif, sans majuscule initiale, sans point final.
- Les commits doivent être atomiques : un commit = un changement logique.
- Ne pas commiter de fichiers générés (`node_modules/`, `dist/`, `.env`).
