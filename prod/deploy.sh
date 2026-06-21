#!/bin/bash
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Charger les variables d'environnement
if [ ! -f .env ]; then
  echo "Erreur : fichier .env manquant (voir .env.example)"
  exit 1
fi
source .env

echo "==> Déploiement Ma boussole politique (${TAG:-latest})"

# Créer le volume SQLite si nécessaire (opération idempotente)
if ! docker volume inspect poliquiz_sqlite &>/dev/null; then
  echo "==> Création du volume poliquiz_sqlite"
  docker volume create poliquiz_sqlite
fi

# Pull des images
echo "==> Pull des images..."
docker compose pull

# Redémarrage des conteneurs
echo "==> Démarrage des conteneurs..."
docker compose up -d --remove-orphans

# Nettoyage des anciennes images
echo "==> Nettoyage des images inutilisées..."
docker image prune -f

echo "==> OK — statut :"
docker compose ps
