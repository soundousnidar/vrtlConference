# Utiliser l'image officielle de Python
FROM python:3.9-slim

# Définir le répertoire de travail dans le container
WORKDIR /app

# Copier les fichiers requirements.txt et installer les dépendances
COPY requirements.txt .
RUN pip install -r requirements.txt

# Installer alembic
RUN pip install alembic psycopg2-binary

# Copier tout le code source dans le container
COPY . .

# Exposer le port que FastAPI va utiliser
EXPOSE 8000

RUN pip install PyJWT

# Commande pour démarrer l'application FastAPI
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
