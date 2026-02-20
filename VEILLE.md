# Veille technologique — RealTimeRoom

Ce document structure la veille technique effectuée autour des choix technologiques du projet. Chaque section répond à la question **"Pourquoi ?"** pour justifier les décisions d'architecture et d'outillage.

---

## Sommaire

1. [WebSocket & Socket.io — Pourquoi du temps réel ?](#1-websocket--socketio--pourquoi-du-temps-réel-)
2. [Node.js & Express — Pourquoi ce backend ?](#2-nodejs--express--pourquoi-ce-backend-)
3. [React 19 — Pourquoi ce framework frontend ?](#3-react-19--pourquoi-ce-framework-frontend-)
4. [TypeScript — Pourquoi typer le frontend ?](#4-typescript--pourquoi-typer-le-frontend-)
5. [Vite — Pourquoi ce bundler ?](#5-vite--pourquoi-ce-bundler-)
6. [SASS — Pourquoi un préprocesseur CSS ?](#6-sass--pourquoi-un-préprocesseur-css-)
7. [pnpm Workspaces — Pourquoi un monorepo ?](#7-pnpm-workspaces--pourquoi-un-monorepo-)
8. [Docker — Pourquoi conteneuriser ?](#8-docker--pourquoi-conteneuriser-)
9. [Nginx — Pourquoi devant React en production ?](#9-nginx--pourquoi-devant-react-en-production-)
10. [Render.com — Pourquoi cette plateforme de déploiement ?](#10-rendercom--pourquoi-cette-plateforme-de-déploiement-)

---

## 1. WebSocket & Socket.io — Pourquoi du temps réel ?

### Le problème du HTTP classique

HTTP est un protocole **requête/réponse** : le client demande, le serveur répond, la connexion se ferme. Pour un chat, cela implique que le client doit constamment interroger le serveur pour savoir si de nouveaux messages sont arrivés (**polling**). Cette approche génère :

- Des requêtes inutiles (le serveur répond souvent "rien de nouveau").
- Une latence perceptible entre l'envoi et la réception.
- Une charge serveur proportionnelle au nombre de clients × fréquence de polling.

### WebSocket : la connexion persistante

WebSocket est un protocole (RFC 6455) qui établit une connexion **bidirectionnelle et persistante** sur une seule socket TCP après une négociation HTTP initiale (handshake). Une fois établie :

- Le serveur peut **pousser** des données au client sans qu'il ne les demande.
- Le client peut envoyer des données à tout moment.
- La latence descend à quelques millisecondes.

C'est le protocole naturel pour le chat, les jeux multijoueurs, les tableaux de bord temps réel.

### Pourquoi Socket.io plutôt que WebSocket natif ?

Socket.io est une bibliothèque qui **abstrait** WebSocket et ajoute des fonctionnalités indispensables en production :

| Fonctionnalité          | WebSocket natif | Socket.io |
|-------------------------|:--------------:|:---------:|
| Reconnexion automatique | Non            | Oui       |
| Fallback HTTP long-poll | Non            | Oui       |
| Rooms & namespaces      | Non            | Oui       |
| Broadcast simplifié     | Manuel         | `io.emit()`|
| Acknowledgements        | Non            | Oui       |
| Gestion d'erreurs       | Basique        | Robuste   |

La reconnexion automatique est particulièrement critique sur des environnements cloud où les connexions peuvent tomber sans prévenir.

---

## 2. Node.js & Express — Pourquoi ce backend ?

### Node.js : JavaScript côté serveur

Node.js permet d'utiliser JavaScript côté serveur, ce qui présente des avantages concrets dans ce contexte :

- **Unification du langage** : frontend et backend partagent le même écosystème (npm, outils, syntaxe). Un développeur peut travailler sur les deux.
- **Modèle événementiel** : Node.js gère les I/O de manière asynchrone et non bloquante, ce qui le rend très efficace pour des applications gérant beaucoup de connexions simultanées avec peu de calcul CPU — exactement le profil d'un chat.
- **Socket.io est natif Node** : la bibliothèque Socket.io est écrite pour Node.js et s'intègre directement avec le serveur HTTP natif de Node.

### Express : le minimum nécessaire

Express est choisi pour sa **légèreté**. Le backend de ce projet n'a que deux routes HTTP (`/` et `/health`). Un framework complet (NestJS, Fastify avec plugins) apporterait une complexité injustifiée. Express permet de bootstrapper un serveur HTTP en 3 lignes et de s'y greffer Socket.io directement.

### Express 5

La version 5 (sortie stable en 2024) est utilisée. Elle apporte la gestion native des erreurs asynchrones dans les middlewares — les `async/await` dans les routes ne nécessitent plus de try/catch explicite pour propager les erreurs à Express.

---

## 3. React 19 — Pourquoi ce framework frontend ?

### Le besoin : une UI réactive aux événements temps réel

L'interface doit se mettre à jour automatiquement à chaque nouveau message reçu via Socket.io, sans rechargement de page. React est conçu précisément pour ce cas : on met à jour l'état (`useState`), React se charge de recalculer et de re-rendre uniquement les parties de l'UI impactées.

### Pourquoi React plutôt que Vue ou Angular ?

- **Popularité et écosystème** : React est le framework UI le plus utilisé en production (données npm downloads). La base de ressources, d'exemples et de solutions à des problèmes est plus large.
- **Modèle mental simple** : `state → UI`. Les composants sont des fonctions qui reçoivent des props et retournent du JSX. Pas de système de templates propriétaires à apprendre.
- **Hooks** : `useEffect` permet de s'abonner aux événements Socket.io au montage du composant et de se désabonner proprement au démontage — exactement ce que fait `Chat.tsx`.

### React 19

La version 19 introduit des améliorations de performance du reconcilieur et simplifie l'usage de certains patterns asynchrones. Elle est la version stable actuelle et est supportée par Vite 7.

---

## 4. TypeScript — Pourquoi typer le frontend ?

### Le problème sans TypeScript

JavaScript est dynamiquement typé : une variable peut changer de type en cours d'exécution. Dans un chat, les données circulent entre Socket.io (côté serveur, non typé) et React (côté client). Sans typage, une faute de frappe sur le nom d'une propriété (`msg.texte` au lieu de `msg.text`) ne provoque pas d'erreur à la compilation, mais un bug silencieux en production.

### Ce que TypeScript apporte

- **Détection des erreurs à la compilation** : les types définissent un contrat. Violer ce contrat provoque une erreur avant même d'exécuter le code.
- **Autocomplétion dans l'IDE** : l'interface `ChatMessage` permet à l'éditeur de proposer `id`, `user`, `text`, `time`, `self` directement.
- **Documentation vivante** : les types servent de documentation des structures de données. `ChatMessage` dit exactement ce qu'un message contient.
- **Refactorisation sûre** : renommer une propriété sur l'interface provoque des erreurs partout où elle est utilisée, permettant de trouver et corriger tous les usages.

### Pourquoi uniquement sur le frontend ?

Le backend est volontairement laissé en JavaScript. Le serveur est minimaliste (36 lignes), et ajouter TypeScript sur Node.js nécessite une étape de compilation supplémentaire ou `ts-node`. Le rapport bénéfice/coût ne justifie pas cette complexité pour un fichier aussi court.

---

## 5. Vite — Pourquoi ce bundler ?

### Le problème de Webpack

Webpack (l'outil historique) charge et compile l'intégralité du code source au démarrage du serveur de développement. Sur des projets de taille moyenne, cela peut prendre 10 à 60 secondes. Les modifications entraînent un re-bundle complet, ralentissant la boucle de développement.

### L'approche Vite

Vite tire parti des **ES Modules natifs** supportés par les navigateurs modernes :

- Au démarrage, Vite ne bundle rien : il sert les fichiers source directement comme modules ES.
- Seul le fichier modifié est re-transformé à chaque sauvegarde (HMR — Hot Module Replacement).
- Le démarrage passe de plusieurs secondes à **quelques dizaines de millisecondes**.

Pour la production, Vite utilise **Rollup** pour produire un bundle optimisé (tree-shaking, code splitting, minification).

### Vite 7

Vite 7 est la version majeure actuelle. Elle supporte React 19, TypeScript 5, et optimise la gestion des CSS modules et SASS.

---

## 6. SASS — Pourquoi un préprocesseur CSS ?

### Les limites du CSS natif pour un thème complexe

Le thème Skype implique 583 lignes de CSS pour la page Chat seule. Sans préprocesseur :

- Les couleurs répétées (`#00aff0`) doivent être copiées-collées partout — un changement de palette nécessite de modifier des dizaines d'occurrences.
- L'organisation en un seul fichier plat devient difficile à maintenir.
- Les sélecteurs imbriqués doivent être répétés : `.skype-chat .skype-avatar {}` au lieu de nicher `.skype-avatar {}` dans `.skype-chat {}`.

### Ce que SASS apporte

- **Variables** : `$skype-blue: #00aff0` défini une fois, utilisé partout. Un changement = une ligne.
- **Nesting** : les sélecteurs peuvent être imbriqués logiquement, reflétant la structure HTML/BEM.
- **Partials & imports** : possibilité de découper les styles en fichiers `_variables.scss`, `_mixins.scss` importés dans un fichier principal.
- **Mixins** : factoriser des blocs de CSS réutilisables (ex: un mixin pour les effets de survol).

Bien que le projet utilise actuellement du CSS plain (`.css`), SASS est installé et prêt. L'utilisation de variables CSS natives (`:root { --var: value }`) est une alternative moderne sans préprocesseur, que le projet utilise aussi dans `index.css`.

---

## 7. pnpm Workspaces — Pourquoi un monorepo ?

### Le problème des multi-dépôts

Sans monorepo, `api/` et `web/` seraient deux dépôts Git séparés. Pour travailler sur les deux en même temps (ex: modifier le format d'un message Socket.io côté API et adapter le composant React), il faudrait :

- Cloner deux dépôts.
- Lancer deux terminaux.
- Synchroniser les versions des dépendances partagées manuellement.

### pnpm Workspaces

`pnpm-workspace.yaml` déclare `api/` et `web/` comme packages du même workspace. Avantages :

- **Un seul `pnpm install`** depuis la racine installe toutes les dépendances.
- **Scripts globaux** : `pnpm dev` depuis la racine lance les deux services en parallèle.
- **Dépendances partagées** : si `api` et `web` utilisent la même version de Socket.io, pnpm peut la déduplicater sur le disque.
- **Cohérence du lockfile** : un seul `pnpm-lock.yaml` garantit que toute l'équipe utilise exactement les mêmes versions.

### Pourquoi pnpm plutôt que npm ou yarn ?

- **Performances** : pnpm utilise un store global avec des liens symboliques. Les installations sont plus rapides et consomment moins d'espace disque.
- **Strictness** : pnpm empêche d'accéder à des dépendances non déclarées dans `package.json` (phantom dependencies), évitant des bugs subtils.
- **Support workspaces** : pnpm a un support natif et mature des workspaces monorepo.

---

## 8. Docker — Pourquoi conteneuriser ?

### Le problème de l'"ça marche chez moi"

Sans Docker, le déploiement dépend de l'environnement de la machine cible : version de Node.js installée, variables système, chemins de fichiers. Les différences entre l'environnement de développement et le serveur de production causent des bugs difficiles à reproduire.

### Docker : l'environnement reproductible

Une image Docker embarque :
- Le système de base (Alpine Linux).
- La version exacte de Node.js (20).
- Les dépendances de l'application.
- Le code source.

Le comportement est **identique** quel que soit l'hôte qui exécute le conteneur.

### Multi-stage build pour le frontend

Le `Dockerfile` du frontend utilise deux stages :

1. **Build stage** (`node:20-alpine`) : installe les dépendances, compile TypeScript, bundle avec Vite. Produit `dist/`.
2. **Runtime stage** (`nginx:alpine`) : copie uniquement le dossier `dist/` dans Nginx. L'image finale ne contient pas Node.js, pnpm ni le code source TypeScript.

Résultat : l'image de production est beaucoup plus légre et la surface d'attaque est réduite.

### Sécurité : utilisateur non-root

Les deux Dockerfiles créent un utilisateur système dédié (`api`/`web`) et basculent sur cet utilisateur avant de lancer l'application. Si un attaquant compromet le process, il n'a pas les droits root sur le conteneur.

---

## 9. Nginx — Pourquoi devant React en production ?

### React est une Single Page Application

Vite génère un `index.html` et des fichiers JS/CSS. Il n'y a pas de serveur capable de répondre aux requêtes HTTP dans le build final. En développement, c'est Vite qui joue ce rôle. En production, il faut un serveur.

### Pourquoi Nginx plutôt que `vite preview` ou `serve` ?

`vite preview` et `npx serve` sont des outils de développement non optimisés pour la production :
- Pas de compression des réponses.
- Pas de gestion fine des headers de cache.
- Non conçus pour la haute disponibilité.

Nginx est un serveur web de production haute performance :

- **SPA routing** : `try_files $uri /index.html` redirige toutes les URLs vers `index.html`, permettant à React Router (si ajouté) de gérer la navigation côté client.
- **Gzip** : compresse les assets JS/CSS avant envoi, réduisant la taille des transferts de 60–80 %.
- **Cache long terme** : les fichiers versionnés par Vite (hash dans le nom) peuvent être mis en cache 1 an côté navigateur (`Cache-Control: immutable`), économisant des requêtes réseau.

---

## 10. Render.com — Pourquoi cette plateforme de déploiement ?

### Les alternatives

| Plateforme    | Avantages                         | Inconvénients                          |
|---------------|-----------------------------------|----------------------------------------|
| Render.com    | Docker natif, free tier, render.yaml | Cold start sur free tier             |
| Railway       | Rapide à configurer               | Coût après quota                       |
| Fly.io        | Performances, anycast             | CLI plus complexe                      |
| Heroku        | Historiquement populaire          | Supprimé le free tier en 2022          |
| VPS (Hetzner) | Contrôle total                    | Configuration manuelle (Nginx, HTTPS)  |

### Pourquoi Render

- **Support Docker natif** : `render.yaml` pointe directement vers les Dockerfiles. Render build et déploie les images sans configuration supplémentaire.
- **Infrastructure as Code** : `render.yaml` dans le dépôt Git signifie que la configuration de déploiement est versionnée et reproductible.
- **Free tier** : permet de déployer deux services sans coût pour un projet pédagogique ou de démonstration.
- **HTTPS automatique** : Render gère les certificats TLS Let's Encrypt automatiquement.
- **Redéploiement sur push** : un push sur `main` déclenche automatiquement un nouveau build et déploiement.

### Limitation connue

Le **cold start** sur le free tier : si aucune requête n'a été reçue pendant 15 minutes, Render éteint le service. La première requête suivante prend ~30 secondes le temps de redémarrer le conteneur. Ce comportement est acceptable pour un projet de démonstration mais inacceptable en production réelle (un plan payant supprime ce comportement).
