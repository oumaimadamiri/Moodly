# Frontend Moodly

Interface utilisateur du réseau social Moodly, construite avec React 19 et Vite.

---

## Stack

| Bibliothèque | Version | Rôle |
|---|---|---|
| React | 19.1.1 | Framework UI (React Compiler activé) |
| Vite (rolldown-vite) | 7.1.14 | Bundler / serveur de développement |
| react-router-dom | 7.9.5 | Routing |
| Axios | 1.13.1 | Requêtes HTTP |
| TailwindCSS | 3.4.18 | Styles utilitaires |
| Framer Motion | 12.23.24 | Animations |
| Lucide React | 0.54.0 | Icônes |
| ESLint | 9.36 | Lint (react-hooks, react-refresh) |

**Plugins Tailwind** : `@tailwindcss/forms`, `@tailwindcss/typography`, `@tailwindcss/aspect-ratio`

---

## Scripts

```bash
npm run dev      # Serveur de développement (port 3000)
npm run build    # Build de production
npm run preview  # Prévisualiser le build
npm run lint     # Vérification ESLint
```

---

## Structure `src/`

```
src/
├── pages/
│   ├── Home.jsx              # Feed principal
│   ├── Login.jsx             # Connexion
│   ├── Register.jsx          # Inscription
│   ├── VerifyEmail.jsx       # Vérification d'email
│   ├── Profile.jsx           # Profil utilisateur (propre ou autre)
│   ├── Explore.jsx           # Découvrir des comptes (accessible sans auth)
│   ├── Messages.jsx          # Messagerie temps réel
│   ├── Notifications.jsx     # Centre de notifications
│   └── FollowRequestsPage.jsx # Demandes de suivi
├── components/
│   ├── Layout.jsx            # Layout principal avec sidebars
│   ├── Sidebar.jsx           # Barre de navigation gauche
│   ├── MobileMenu.jsx        # Menu mobile
│   ├── RightSidebar.jsx      # Sidebar droite
│   ├── StoriesSidebar.jsx    # Stories dans la sidebar
│   ├── PostCard.jsx          # Carte de post (like, commentaire, bookmark)
│   ├── CreatePost.jsx        # Formulaire de création de post
│   ├── CommentsSection.jsx   # Section commentaires
│   ├── FollowRequest.jsx     # Composant demande de suivi
│   ├── AccountManager.jsx    # Gestion multi-comptes
│   ├── CreateAccount.jsx     # Créer un compte lié
│   └── DeleteAccount.jsx     # Supprimer le compte
├── contexts/
│   └── AuthContext.jsx       # Contexte auth JWT (login, logout, refresh, switch account)
├── hooks/
│   └── useNotifications.js   # WebSocket notifications temps réel
├── services/
│   ├── api.js                # Instance Axios + tous les endpoints
│   └── storiesAPI.js         # Endpoints stories (à dédoublonner avec api.js)
├── styles/
│   └── theme.js              # Tokens de design
└── assets/
    └── moodly-logo.svg       # Logo Moodly
```

---

## Routing

| Route | Protection | Composant |
|---|---|---|
| `/login` | Publique (redirige si connecté) | `Login` |
| `/register` | Publique (redirige si connecté) | `Register` |
| `/verify-email` | Publique (redirige si connecté) | `VerifyEmail` |
| `/explore` | Libre | `Explore` |
| `/` | Protégée | `Home` |
| `/profile` | Protégée | `Profile` (utilisateur connecté) |
| `/profile/:username` | Protégée | `Profile` (autre utilisateur) |
| `/notifications` | Protégée | `Notifications` |
| `/messages` | Protégée | `Messages` |
| `/accounts` | Protégée | `AccountManager` |
| `/follow-requests` | Protégée | `FollowRequestsPage` |
| `/home` | — | Redirige vers `/` |
| `/manage-accounts` | — | Redirige vers `/accounts` |

---

## Configuration API

Le proxy Vite `/api → http://localhost:8000` est configuré dans `vite.config.js`.

En attendant la migration vers les variables d'environnement, l'URL est définie dans `src/services/api.js` :

```js
const API_BASE_URL = 'http://localhost:8000/api'
```

**À faire** : externaliser vers `import.meta.env.VITE_API_URL` (voir `.env.example` une fois créé) et utiliser le proxy Vite en développement.

De même, l'URL WebSocket dans `src/hooks/useNotifications.js` est actuellement hardcodée à `ws://localhost:8000/ws/notifications/`.

---

## Connexion au backend

Le backend Django doit tourner sur **http://localhost:8000** avant de lancer le frontend. Voir [backend/README.md](../backend/README.md) pour les instructions d'installation.
