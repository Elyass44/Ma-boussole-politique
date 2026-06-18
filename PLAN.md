# Plan de développement — Ma boussole politique

## Stack

- **Frontend** : React + Vite + Tailwind CSS
- **State** : useState (pas de lib externe)
- **Routing** : aucun — état `step` dans App.jsx (`accueil | loading | quiz | resultats`)
- **Backend** : Express + SQLite (`better-sqlite3`) — port 3001
- **Hébergement** : Docker Compose (deux services : `web` + `backend`)
- **Cache partagé** : SQLite sur volume Docker nommé `sqlite_data` → `/data/poliquiz.db`
- **Proxy** : Vite `/api/*` → `http://backend:3001` (pas de CORS, URL unique)

## Architecture réelle

```
poliquiz/
  src/
    services/
      civix.js        ← thin client : appelle /api/game (backend fait le vrai travail)
      ai.js           ← Mistral via VITE_MISTRAL_KEY, stockage résumés via /api/summaries
      gameState.js    ← localStorage : sauvegarde/reprise partie en cours
    logic/
      scoring.js      ← algorithme de proximité + axe gauche-droite
      filters.js      ← hasEnoughGroups, deduplicateByDossier, pickRandom (dead code)
    screens/
      Accueil.jsx     ← sélecteur 15/30/50, checkbox vie privée, auto-resume si save
      Loading.jsx     ← étapes animées (✓ fait / spinner en cours)
      Quiz.jsx        ← header bleu, card blanche, résumé IA, boutons Pour/Sans avis/Contre
      Resultats.jsx   ← axe gauche-droite, classement groupes, bouton rejouer
    App.jsx           ← lazy initializers pour auto-resume
    main.jsx
    index.css         ← @keyframes pop, .btn-pop
  server/
    index.js          ← Express + SQLite (cache scrutins/votes/résumés)
    package.json
    Dockerfile        ← node:20-alpine + python3 make g++ (pour better-sqlite3)
  docker-compose.yml  ← services web + backend, volume sqlite_data
  vite.config.js      ← proxy /api → backend:3001
  .env                ← VITE_MISTRAL_KEY=
  Makefile            ← make start / make stop / make logs
```

---

## Phase 1 — Data layer ✅ TERMINÉ

### Backend (`server/index.js`)

- **SQLite tables** : `cache` (scrutins + groupes, TTL 24h), `votes` (permanent), `summaries` (permanent)
- **`GET /api/game?count=N`** :
  1. Fetch 12 pages × 50 scrutins CIVIX en parallèle (600 scrutins, législature 17)
  2. Cache tous les votes individuellement (permanent)
  3. Filtre : ≥ 6 groupes actifs ET total votants > 50
  4. Shuffle → dédup par `dossierRef` (max `ceil(count/10)` par dossier) → slice count
  5. Retourne `{ scrutins, groupes }` avec votes embarqués
- **`GET/POST /api/summaries/:uid`** : cache résumés IA
- WAL journal mode pour la concurrence

### Algorithme de score (`src/logic/scoring.js`)

Pour chaque groupe, position majoritaire (`max(pour, contre, abstention)`).
Si position = abstention → scrutin ignoré pour ce groupe.
Correspondance avec le joueur = +1, désaccord = 0, `je_ne_sais_pas` = ignoré.
Score = correspondances / questions répondues (hors `je_ne_sais_pas`).

**Axe gauche-droite** (valeurs fixes 0–10) :

| Groupe | Abrév. | Valeur |
|---|---|---|
| La France insoumise - NFP | LFI-NFP | 1 |
| Écologiste et Social | ECOS | 2 |
| Socialistes et apparentés | SOC | 3 |
| Gauche Démocrate et Républicaine | GDR | 3 |
| Libertés, Indépendants, OM et Territoires | LIOT | 5 |
| Les Démocrates | DEM | 6 |
| Horizons & Indépendants | HOR | 6 |
| Ensemble pour la République | EPR | 7 |
| Droite Républicaine | DR | 8 |
| Rassemblement National | RN | 9 |

Calcul : moyenne pondérée des valeurs, pondérée par score de concordance.

---

## Phase 2 — UI ✅ TERMINÉ

### Accueil
- Sélecteur 15 (~2min) / 30 (~4min) / 50 (~7min)
- Checkbox vie privée obligatoire avant Commencer
- Aucune UI de reprise (auto-resume transparent si partie en cours)

### Loading
- Liste d'étapes animées : ✓ vert pour les étapes passées, spinner pour l'étape en cours

### Quiz
- Header bleu foncé : numéro de question (padding 2 chiffres), barre de progression blanche, pourcentage
- Card blanche : badge date + lien "Dossier législatif" (ExternalLink icon, bg-blue-600)
- Bloc résumé IA (bg-indigo-50, Sparkles icon) : toujours visible, skeleton pendant chargement, caché si pas de clé Mistral
- Boutons sur une ligne : Contre (flex-1, rouge, ThumbsDown) | Sans avis (w-20, ghost, Minus) | Pour (flex-1, vert, ThumbsUp)
- Animation `.btn-pop` au clic (définie dans `index.css`, pas Tailwind)
- canvas-confetti : 35 particules vertes pour Pour, 25 rouges pour Contre

### Résultats
- Curseur sur axe Gauche–Centre–Droite
- Classement de tous les groupes avec score en %
- Bouton Rejouer

---

## Phase 3 — Polish ✅ TERMINÉ

- [x] Responsive mobile (boutons ≥ 44×44px)
- [x] Transitions entre écrans (fade-up Tailwind animation)
- [x] Contraste WCAG AA
- [x] Gamification : confettis, animation bounce au clic
- [x] Sauvegarde partie en cours (localStorage, auto-resume au rechargement)
- [ ] Gestion d'erreur API — affichée mais à vérifier sur mobile / réseau lent

---

## Phase 4 — Résumés IA ⚠️ PARTIEL

- [x] Appel Mistral (`mistral-small-latest`, 2-3 phrases neutres)
- [x] Cache résumés dans SQLite backend (partagé entre tous les joueurs)
- [x] Graceful degradation si pas de clé (bloc caché, aucune erreur)
- [ ] **Clé Mistral côté client** — `VITE_MISTRAL_KEY` est exposée dans le bundle JS → à migrer vers le backend (variable d'environnement serveur + route `/api/summaries/:uid/generate`)

---

## Critères de succès MVP

- [x] Une partie de 15/30/50 questions se joue de bout en bout sans erreur
- [x] Mêmes réponses = mêmes résultats (scoring déterministe)
- [x] Données traçables jusqu'à CIVIX / Assemblée nationale
- [x] Sauvegarde et reprise transparente (localStorage)
- [x] Cache partagé serveur (un joueur charge pour tous)
- [ ] Utilisable sur mobile (à vérifier)
- [ ] Un non-initié comprend sans documentation (à tester avec un vrai utilisateur)
- [ ] Aucune requête API n'échoue silencieusement (à vérifier)

---

## Prochaines priorités

| Priorité | Tâche | Effort |
|---|---|---|
| 🔴 Sécurité | Migrer clé Mistral vers backend (route `/api/summaries/:uid/generate`) | ~1h |
| 🟡 UX | Bouton "Abandonner la partie" dans le header Quiz | ~15min |
| 🟡 UX | Vérifier mobile (boutons, scroll, lisibilité) | ~30min |
| 🟢 Clean | Supprimer `pickRandom` mort dans `filters.js` | 5min |

---

## Hors scope MVP

| Fonctionnalité | Raison |
|---|---|
| Votes nominatifs par député | API CIVIX ne les fournit pas |
| Filtrage par thème | v2 |
| Partage des résultats (image/lien) | v2 |
| Comparaison avec son député local | v3 |
| Mode duel | v3 |
| Historique des parties | v2 |
| Version multilingue | v3 |
