# Moodly : réseau social autour des émotions

> Projet académique réalisé en équipe. Partagez votre humeur, suivez vos proches et discutez en temps réel.

Moodly est une application web full-stack : un backend Django (API REST et WebSockets) et un frontend React (Vite). Les utilisateurs publient des posts associés à une émotion, partagent des stories de 24 h, échangent des messages (texte, image, audio), reçoivent des notifications en temps réel et peuvent passer leur compte en privé avec des demandes de suivi.

## Sommaire
1. [Fonctionnalités](#fonctionnalités)
2. [Stack technique](#stack-technique)
3. [Architecture](#architecture)
4. [Prérequis](#prérequis)
5. [Configuration](#configuration)
6. [Installation et lancement](#installation-et-lancement)
7. [Limites connues et pistes d'amélioration](#limites-connues-et-pistes-damélioration)
8. [Auteurs](#auteurs)

---

## Fonctionnalités

| Domaine | Description |
|---|---|
| **Compte** | Inscription avec vérification de l'email, authentification JWT, gestion de plusieurs comptes liés (passer de l'un à l'autre) |
| **Posts** | Posts associés à une émotion, likes, commentaires imbriqués, favoris |
| **Stories** | Stories qui disparaissent après 24 h, avec la liste des vues et des réponses |
| **Messagerie** | Messages en temps réel (texte, image, audio) par WebSocket |
| **Notifications** | En temps réel : like, commentaire, abonnement, message |
| **Confidentialité** | Comptes privés et demandes de suivi |
| **Découverte** | Recherche d'utilisateurs et suggestions |

## Stack technique

| Couche | Technologies |
|---|---|
| Backend | Django 4.2, Django REST Framework 3.14, SimpleJWT 5.3, python-decouple |
| Temps réel | Django Channels 4, Daphne (ASGI), `InMemoryChannelLayer` en développement |
| Base de données | SQLite en développement (le pilote PostgreSQL `psycopg2` est déjà installé) |
| Frontend | React 19, Vite, React Router 7, Axios |
| Interface | Tailwind CSS 3.4, Framer Motion, Lucide React |

## Architecture

```
Moodly/
├── backend/                 Projet Django (ASGI)
│   ├── social_app/          Configuration : settings, urls, asgi
│   ├── users/               Utilisateur, authentification, abonnements, comptes liés
│   ├── posts/               Posts, likes, commentaires, favoris
│   ├── stories/             Stories de 24 h
│   ├── chat/                Messagerie et WebSocket
│   ├── notifications/       Notifications et WebSocket
│   └── follow_requests/     Demandes de suivi et confidentialité
└── frontend/                Application React
    └── src/
        ├── pages/           Accueil, connexion, profil, explorer, messages…
        ├── components/      Layout, Sidebar, PostCard, CreatePost, AccountManager…
        ├── contexts/        AuthContext (JWT)
        ├── hooks/           useNotifications (WebSocket)
        └── services/        api.js, storiesAPI.js
```

Documentation détaillée : [backend/README.md](backend/README.md) (routes, WebSockets) et [frontend/README.md](frontend/README.md).

## Prérequis

- Python 3.10 ou plus
- Node.js 18 ou plus

## Configuration

Créer `backend/.env` à partir de `backend/.env.example` :

| Variable | Obligatoire | Défaut | Description |
|---|---|---|---|
| `SECRET_KEY` | oui | | Clé secrète Django (sert aussi à signer les JWT) |
| `DEBUG` | | `False` | Mettre `True` en développement |
| `ALLOWED_HOSTS` | | `localhost,127.0.0.1` | Hôtes autorisés |
| `EMAIL_HOST_USER` | oui | | Adresse Gmail d'envoi |
| `EMAIL_HOST_PASSWORD` | oui | | Mot de passe d'application Google |

Le frontend appelle l'API à l'adresse `http://localhost:8000/api`, définie dans `frontend/src/services/api.js`.

## Installation et lancement

```bash
# Backend : http://localhost:8000
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows : .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # puis remplir
python manage.py migrate
python manage.py createsuperuser # facultatif
python manage.py runserver

# Frontend : http://localhost:3000 (autre terminal)
cd frontend
npm install
npm run dev
```

## Limites connues et pistes d'amélioration

- **URL de l'API écrite en dur** dans `frontend/src/services/api.js`. *Piste :* passer par une variable `VITE_API_URL`.
- **CORS ouvert à toutes les origines** (`CORS_ALLOW_ALL_ORIGINS = True`). À restreindre avant tout déploiement.
- **`InMemoryChannelLayer`** : les WebSockets ne fonctionnent qu'avec une seule instance du serveur. *Piste :* `RedisChannelLayer`.
- **SQLite** en développement. *Piste :* PostgreSQL pour un déploiement.
- **Pas de tests automatisés** : les fichiers `tests.py` de chaque application sont vides.
- **Composants volumineux** (`Messages`, `Profile`, `PostCard`) à découper.

## Auteurs

| Nom | Rôle |
|---|---|
| **Oumaima Damiri** | Développeuse Full-Stack & IoT |
| **Jihane EL Berkaoui** | Développeuse Full-Stack |
| **KAWTAR ELHAMRAOUI** | Développeuse Full-Stack |

**Superviseur :** Pr. EL KASMI ALAOUI Seddiq
