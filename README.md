<p align="center">
  <img src="frontend/src/assets/moodly-logo.svg" alt="Logo Moodly" width="120"/>
</p>

<h1 align="center">💜 Moodly</h1>

<p align="center">
  <strong>Réseau social autour des émotions : partagez votre humeur, discutez en temps réel</strong><br/>
  <em>Projet académique — Master en Ingénierie des Systèmes Intelligents</em><br/>
  <em>Faculté des Sciences Aïn Chock, Casablanca</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Django-4.2-092E20?logo=django&logoColor=white" alt="Django"/>
  <img src="https://img.shields.io/badge/DRF-3.14-A30000?logo=django&logoColor=white" alt="Django REST Framework"/>
  <img src="https://img.shields.io/badge/WebSocket-Channels%204-4B32C3" alt="Django Channels"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React"/>
  <img src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/Tailwind%20CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS"/>
  <img src="https://img.shields.io/badge/database-SQLite-003B57?logo=sqlite&logoColor=white" alt="SQLite"/>
</p>

---

## 📋 Présentation

Moodly est un réseau social web centré sur les émotions. Chaque post porte une humeur (heureux, triste, inspiré, motivé, excité, réfléchi). Les utilisateurs partagent des stories qui disparaissent après 24 h, discutent en temps réel et reçoivent leurs notifications instantanément grâce aux WebSockets. L'application repose sur un backend Django (API REST et WebSockets) et un frontend React.

### Fonctionnalités Clés

| Fonctionnalité | Description |
|---|---|
| 😊 **Posts et émotions** | Chaque post porte une émotion ; likes, commentaires imbriqués, favoris |
| ⏳ **Stories 24 h** | Stories texte, image ou vidéo, avec la liste des vues, des réactions et des réponses |
| 💬 **Messagerie temps réel** | Conversations par WebSocket (texte, image, audio), messages lus, suppression pour tous |
| 🔔 **Notifications temps réel** | Like, commentaire, abonnement, message, envoyés instantanément par WebSocket |
| 🔒 **Comptes privés** | Demandes de suivi à accepter ou refuser, paramètres de confidentialité |
| 🔁 **Comptes liés** | Création de plusieurs comptes et passage de l'un à l'autre |
| 🔍 **Découverte** | Recherche d'utilisateurs et suggestions de profils |
| 📧 **Vérification de l'email** | Activation du compte par email, authentification JWT |

---

## 🏗️ Architecture

```text
┌──────────────────────────┐          ┌─────────────────────────────────────┐
│   Frontend React (Vite)  │          │      Backend Django (ASGI / Daphne) │
│   :3000                  │          │      :8000                          │
│                          │  HTTP    │                                     │
│  • Pages et composants   │  + JWT   │  • API REST (Django REST Framework) │
│  • AuthContext (JWT)     │◄────────►│    /api/…                           │
│  • Axios (api.js)        │          │                                     │
│  • useNotifications      │◄────────►│  • WebSockets (Django Channels)     │
│                          │ WebSocket│    ws/chat/<id>/                    │
└──────────────────────────┘          │    ws/notifications/                │
                                      └──────────┬───────────────┬──────────┘
                                                 │               │
                                         ┌───────▼──────┐ ┌──────▼─────────┐
                                         │    SQLite    │ │ Médias (posts, │
                                         │  (dév.)      │ │ stories, audio)│
                                         └──────────────┘ └────────────────┘
```

### Technologies Utilisées

| Couche | Technologie |
|---|---|
| API | Django 4.2, Django REST Framework 3.14, SimpleJWT 5.3, python-decouple |
| Temps réel | Django Channels 4, Daphne (ASGI), `InMemoryChannelLayer` en développement |
| Base de données | SQLite en développement (le pilote PostgreSQL `psycopg2` est déjà installé) |
| Médias | Pillow |
| Frontend | React 19, Vite, React Router 7, Axios |
| Interface | Tailwind CSS 3.4, Framer Motion, Lucide React |

---

## 📁 Structure du Projet

```text
Moodly/
├── backend/                     # Django — API REST et WebSockets
│   ├── social_app/              # Configuration : settings, urls, asgi
│   ├── users/                   # Utilisateur, authentification, abonnements, comptes liés
│   ├── posts/                   # Posts, likes, commentaires, favoris
│   ├── stories/                 # Stories 24 h, vues, réactions, réponses
│   ├── chat/                    # Conversations, messages, WebSocket (consumers.py)
│   ├── notifications/           # Notifications, WebSocket (consumers.py)
│   ├── follow_requests/         # Demandes de suivi et confidentialité
│   ├── requirements.txt         # Dépendances Python
│   ├── .env.example             # Modèle de configuration
│   └── README.md                # Documentation du backend
│
├── frontend/                    # React — interface web
│   ├── src/
│   │   ├── pages/               # Home, Explore, Messages, Notifications, Profile…
│   │   ├── components/          # Layout, Sidebar, PostCard, CreatePost, StoriesSidebar…
│   │   ├── contexts/            # AuthContext (JWT)
│   │   ├── hooks/               # useNotifications (WebSocket)
│   │   ├── services/            # api.js, storiesAPI.js
│   │   └── assets/              # moodly-logo.svg
│   ├── vite.config.js           # Port 3000, proxy /api → localhost:8000
│   └── README.md                # Documentation du frontend
│
└── README.md
```

---

## 📦 Prérequis

| Outil | Version |
|---|---|
| Python | 3.10 ou plus |
| Node.js | 18 ou plus |
| Compte Gmail avec « mot de passe d'application » | Envoi des emails de vérification |

---

## 🚀 Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/oumaimadamiri/Moodly.git
cd Moodly
```

### 2. Configurer le backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows : .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # puis remplir
```

| Variable | Obligatoire | Défaut | Description |
|---|---|---|---|
| `SECRET_KEY` | oui | — | Clé secrète Django (sert aussi à signer les JWT) |
| `DEBUG` | | `False` | Mettre `True` en développement |
| `ALLOWED_HOSTS` | | `localhost,127.0.0.1` | Hôtes autorisés |
| `EMAIL_HOST_USER` | oui | — | Adresse Gmail d'envoi |
| `EMAIL_HOST_PASSWORD` | oui | — | Mot de passe d'application Google |

### 3. Créer la base et lancer le backend

```bash
python manage.py migrate
python manage.py createsuperuser   # facultatif
python manage.py runserver
```

Le backend écoute sur `http://localhost:8000`.

### 4. Lancer le frontend

```bash
cd ../frontend
npm install
npm run dev
```

Le frontend est disponible sur `http://localhost:3000`. L'adresse de l'API est définie dans `frontend/src/services/api.js`.

---

## 🔄 Fonctionnement

### Publication d'un post
```text
L'utilisateur écrit un post et choisit une émotion (😊 😢 💡 🚀 🎉 🤔)
  → Post enregistré → visible dans le fil de ses abonnés
  → Like / commentaire d'un autre utilisateur
       → Notification créée → envoyée en direct (ws/notifications/)
```

### Messagerie
```text
Ouverture d'une conversation → connexion WebSocket (ws/chat/<id>/)
  → Message texte, image ou audio → reçu instantanément par l'autre personne
  → Compteur de messages non lus mis à jour
```

### Compte privé
```text
Demande de suivi envoyée
  ├─ ✅ Acceptée → posts et stories visibles
  └─ ❌ Refusée  → profil toujours privé
```

---

## 🌐 Pages

| Page | Description |
|---|---|
| **Connexion / Inscription** | Création de compte, vérification de l'email |
| **Accueil** | Fil des posts, stories, création d'un post |
| **Explorer** | Recherche d'utilisateurs et suggestions |
| **Messages** | Conversations en temps réel |
| **Notifications** | Activité récente, en temps réel |
| **Profil** | Posts, abonnés, abonnements, paramètres, comptes liés |
| **Demandes de suivi** | Accepter ou refuser les demandes reçues |

---

## 🔌 API REST et WebSockets

| Domaine | Routes principales |
|---|---|
| Authentification | `POST /api/auth/register/`, `/verify-email/`, `/login/`, `/logout/`, `/token/refresh/` |
| Utilisateurs | `/api/users/me/`, `/api/users/profile/<username>/`, `/search/`, `/suggestions/`, `/<username>/follow/`, `/<username>/unfollow/` |
| Comptes liés | `/api/users/linked_accounts/`, `/create_linked_account/`, `/switch_account/` |
| Posts | `/api/posts/`, `/api/posts/<id>/like/`, `/unlike/`, `/comments/` |
| Demandes de suivi | `/api/follow-requests/pending_requests/`, `/<id>/accept/`, `/<id>/reject/` |
| Messagerie | `/api/conversations/<id>/messages/`, `/send_message/`, `/mark-read/`, `/api/conversations/unread-count/` |
| WebSockets | `ws/chat/<conversation_id>/`, `ws/notifications/` |

La liste complète est dans [backend/README.md](backend/README.md).

---

## 🗄️ Schéma de la Base de Données

| Table | Description |
|---|---|
| `User` | Utilisateur, abonnés, demandes de suivi en attente, compte principal (comptes liés) |
| `Post` | Post avec son émotion |
| `Like` · `Comment` · `Bookmark` | Interactions sur un post ; commentaires imbriqués |
| `Story` | Story texte, image ou vidéo, avec sa date d'expiration |
| `StoryView` · `StoryReply` | Vues, réactions et réponses aux stories |
| `Conversation` · `Message` | Messagerie entre utilisateurs |
| `Notification` | Notification (like, commentaire, abonnement, message) |

---

## ⚠️ Limites Connues

- **URL de l'API écrite en dur** dans `frontend/src/services/api.js`. *Piste :* utiliser une variable `VITE_API_URL`.
- **CORS ouvert à toutes les origines** (`CORS_ALLOW_ALL_ORIGINS = True`). À restreindre avant tout déploiement.
- **`InMemoryChannelLayer`** : les WebSockets ne fonctionnent qu'avec une seule instance du serveur. *Piste :* `RedisChannelLayer`.
- **SQLite** en développement. *Piste :* PostgreSQL pour un déploiement.
- **Pas de tests automatisés** : les fichiers `tests.py` sont vides.

---

## 👥 Auteurs

| Nom | Rôle |
|---|---|
| **Oumaima Damiri** | Développeuse Full-Stack & IoT |
| **Jihane El Berkaoui** | Développeuse Full-Stack |
| **KAWTAR Elhamraoui** | Développeuse Full-Stack |

**Superviseur :** Pr. EL KASMI ALAOUI Seddiq

---

<p align="center">
Faculté des Sciences Aïn Chock, Casablanca
</p>
