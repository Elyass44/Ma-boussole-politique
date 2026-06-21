# Déploiement en production

## Architecture

```
VPS (Debian)
└── /var/www/apps/ma-boussole-politique/
    ├── docker-compose.yml   ← copié depuis prod/
    ├── .env                 ← à créer à partir de .env.example
    └── deploy.sh            ← script de déploiement
```

Deux conteneurs Docker :
- **web** — Nginx servant le frontend React buildé + proxy `/api/` vers le backend
- **backend** — Node.js/Express + SQLite

Traefik (réseau `web`) gère le TLS et le routage. La base SQLite est dans un volume nommé `poliquiz_sqlite` externe à Docker Compose (protégé contre les `down -v`).

## Setup initial (une seule fois)

### 1. DNS
Créer un enregistrement A : `ma-boussole-politique.asmaryn.dev → IP du VPS`

### 2. Fichiers sur le VPS
```bash
mkdir /var/www/apps/ma-boussole-politique
cd /var/www/apps/ma-boussole-politique

curl -O https://raw.githubusercontent.com/Elyass44/Ma-boussole-politique/main/prod/docker-compose.yml
curl -O https://raw.githubusercontent.com/Elyass44/Ma-boussole-politique/main/prod/deploy.sh
curl -O https://raw.githubusercontent.com/Elyass44/Ma-boussole-politique/main/prod/.env.example
mv .env.example .env
nano .env   # remplir MISTRAL_KEY et vérifier DOMAIN + TAG

chmod +x deploy.sh
```

### 3. Premier déploiement
```bash
./deploy.sh v0.3
```
Le script crée le volume SQLite automatiquement si besoin.

## Déployer une nouvelle version

### Depuis la machine de dev
```bash
git tag v1.1.0
git push --tags
```
→ GitHub Actions build et push les images sur GHCR automatiquement.

### Sur le VPS
```bash
cd /var/www/apps/ma-boussole-politique
./deploy.sh v1.1.0
```

## CI/CD

Le workflow `.github/workflows/docker.yml` se déclenche sur chaque tag `v*` et publie deux images sur GHCR :
- `ghcr.io/elyass44/poliquiz-web:<tag>`
- `ghcr.io/elyass44/poliquiz-backend:<tag>`
