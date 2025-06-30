# vrtlConference: Plateforme de Conférences Virtuelles

Une solution complète pour l'organisation et la gestion de conférences virtuelles, incluant la gestion des sessions, les paiements, la soumission de résumés et la visioconférence en direct.

## ✨ Fonctionnalités

- Gestion complète des conférences et des sessions.
- Inscription des participants avec paiement en ligne (Stripe).
- Soumission et évaluation des résumés (abstracts).
- Sessions de visioconférence en direct avec Jitsi Meet.
- Authentification des utilisateurs basée sur les rôles (organisateur, participant).
- Panneau d'administration pour les organisateurs.

## 🚀 Stack Technique

- **Backend**: Python, FastAPI
- **Frontend**: React, TypeScript, Vite
- **Base de données**: PostgreSQL
- **ORM & Migrations**: SQLAlchemy, Alembic
- **Paiements**: Stripe
- **Visioconférence**: Jitsi Meet
- **Gestion des dépendances**: `pip` (backend), `bun` (frontend)

---

## ⚙️ Prérequis

Avant de commencer, assurez-vous d'avoir installé les outils suivants sur votre machine :

- [Python 3.9+](https://www.python.org/downloads/)
- [Node.js](https://nodejs.org/en/) (v18+) et [Bun](https://bun.sh/)
- [Docker](https://www.docker.com/products/docker-desktop/) et Docker Compose (pour Jitsi et PostgreSQL)
- Un compte [Stripe](https://dashboard.stripe.com/register) pour les clés API.

---

## 🛠️ Installation et Configuration

Suivez ces étapes pour configurer le projet en local.

### 1. Cloner le Dépôt

```bash
git clone <URL_DU_DEPOT>
cd vrtlConference
```

### 2. Configuration du Backend

**a. Créer un environnement virtuel et installer les dépendances**

```bash
# Créer un environnement virtuel
python -m venv env

# Activer l'environnement (Windows)
.\env\Scripts\activate

# Activer l'environnement (macOS/Linux)
# source env/bin/activate

# Installer les dépendances Python
pip install -r requirements.txt
```

**b. Configurer les variables d'environnement du backend**

Créez un fichier `.env` à la racine du projet et copiez-y le contenu suivant. Remplacez les valeurs par vos propres informations.

```ini
# .env

# PostgreSQL Database Configuration
# Assurez-vous que la base de données 'vrtlconference' existe
DATABASE_URL=postgresql://user:password@localhost/vrtlconference

# JWT (JSON Web Token) Settings
# Générez une clé secrète forte (ex: openssl rand -hex 32)
SECRET_KEY=votre_super_cle_secrete_ici
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Stripe API Keys
# Remplacez par vos clés de test Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...

# Jitsi Meet Server URL
# URL de votre instance Jitsi (locale ou publique)
JITSI_SERVER_URL=http://localhost:8000
```

### 3. Configuration du Frontend

**a. Installer les dépendances**

```bash
cd conf-connect-hub-main
bun install
```

**b. Configurer les variables d'environnement du frontend**

Créez un fichier `.env` dans le dossier `conf-connect-hub-main` et ajoutez-y le contenu suivant :

```ini
# conf-connect-hub-main/.env

# URL de l'API backend
VITE_API_URL=http://localhost:8001

# Clé publique Stripe (sécuritaire à exposer)
VITE_STRIPE_PUBLIC_KEY=pk_test_... # Mettez la même que dans le .env du backend
```

### 4. Configuration de la Base de Données (PostgreSQL avec Docker)

Vous pouvez lancer une instance PostgreSQL facilement avec Docker.

```bash
# Lancez cette commande depuis la racine du projet
docker run --name vrtl-postgres -e POSTGRES_USER=user -e POSTGRES_PASSWORD=password -e POSTGRES_DB=vrtlconference -p 5432:5432 -d postgres
```
*Cela créera une base de données nommée `vrtlconference` avec l'utilisateur `user` et le mot de passe `password`.*

**Appliquer les migrations de la base de données :**
Assurez-vous que votre environnement virtuel backend est activé, puis lancez Alembic.

```bash
# Depuis la racine du projet
alembic upgrade head
```

### 5. Configuration de Jitsi Meet (avec Docker)

Pour des tests en local sans les contraintes du service public (lobby, authentification), il est recommandé de lancer votre propre instance Jitsi.

Consultez le guide officiel de [docker-jitsi-meet](https://github.com/jitsi/docker-jitsi-meet) ou suivez ces étapes rapides :

```bash
# 1. Clonez le dépôt et configurez-le
git clone https://github.com/jitsi/docker-jitsi-meet.git
cd docker-jitsi-meet
cp env.example .env

# 2. Désactivez le lobby (facultatif, pour les tests)
# Dans le fichier .env, trouvez et modifiez cette ligne :
ENABLE_LOBBY=0

# 3. Générez les mots de passe
./gen-passwords.sh

# 4. Lancez Jitsi
docker-compose up -d
```
Votre instance Jitsi sera accessible sur `http://localhost:8000`.

---

## ▶️ Lancer l'Application

1.  **Lancer Jitsi Meet** (si ce n'est pas déjà fait) :
    ```bash
    cd docker-jitsi-meet
    docker-compose up -d
    ```

2.  **Lancer le Backend FastAPI** :
    Depuis la racine du projet `vrtlConference`, avec l'environnement virtuel activé :
    ```bash
    uvicorn main:app --reload --port 8001
    ```
    L'API sera disponible sur `http://localhost:8001`.

3.  **Lancer le Frontend React** :
    Dans un autre terminal, depuis le dossier `conf-connect-hub-main` :
    ```bash
    bun dev
    ```
    L'application web sera accessible sur `http://localhost:5173` (ou un autre port si celui-ci est occupé).

---

## 📂 Structure du Projet

```
vrtlConference/
├── alembic/              # Migrations de base de données
├── conf-connect-hub-main/ # Application Frontend (React)
│   ├── src/
│   ├── public/
│   └── bun.lockb
├── models/               # Modèles de données SQLAlchemy
├── utils/                # Fonctions utilitaires (ex: envoi d'emails)
├── .env                  # (À créer) Variables d'environnement du backend
├── abstracts.py          # Logique métier pour les abstracts
├── auth.py               # Logique d'authentification et JWT
├── conference.py         # Logique métier pour les conférences
├── main.py               # Point d'entrée de l'API FastAPI
└── requirements.txt      # Dépendances Python
```