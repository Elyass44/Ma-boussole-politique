# Cahier des charges fonctionnel — Ma boussole politique
**Version** : 1.1 — MVP  
**Date** : Juin 2026  
**Statut** : Draft — mis à jour après exploration API CIVIX

---

## Changelog

| Version | Date | Modification |
|---|---|---|
| 1.0 | Juin 2026 | Version initiale |
| 1.1 | Juin 2026 | Suppression du bloc "député le plus proche" — l'API CIVIX ne fournit pas les votes nominatifs par député individuel, seulement par groupe. Résultats recentrés sur la comparaison par groupe parlementaire. |

---

## 1. Présentation du projet

### 1.1 Concept

Ma boussole politique est une web-app ludique et citoyenne qui permet à un utilisateur de voter sur de vraies propositions passées à l'Assemblée nationale, puis de découvrir quel groupe parlementaire est le plus proche de ses convictions.

L'objectif est de rendre le travail parlementaire accessible et compréhensible au grand public, sans prise de position éditoriale.

### 1.2 Cible

Grand public, curieux de politique, peu ou pas familier du fonctionnement de l'Assemblée nationale. Aucune connaissance préalable n'est requise pour jouer.

### 1.3 Plateforme

Web responsive (desktop + mobile). Aucune installation requise.

---

## 2. Parcours utilisateur

### 2.1 Vue d'ensemble

```
Accueil → Lancement de la partie → 15 questions → Résultats → Partage (optionnel)
```

### 2.2 Écran d'accueil

- Titre et accroche courte expliquant le concept en 2 phrases maximum
- Bouton principal : **"Commencer"**
- Mention de la source des données (Assemblée nationale – open data via CIVIX)
- Aucune inscription requise, aucune donnée personnelle collectée

### 2.3 Écran de question (×15)

Chaque question présente un scrutin réel de l'Assemblée nationale sous une forme lisible :

| Élément | Description |
|---|---|
| Numéro de question | Ex. : "Question 7 / 15" |
| Barre de progression | Visuelle, linéaire |
| Titre du scrutin | Reproduit fidèlement depuis l'API |
| Contexte court | Date du scrutin + résultat officiel (adopté / rejeté) |
| Choix de l'utilisateur | 3 boutons : **Pour** / **Contre** / **Je ne sais pas** |

**Règle "Je ne sais pas"** : ce choix est neutre, il n'est pas comptabilisé dans le calcul de proximité. L'utilisateur peut l'utiliser librement mais il n'influe pas sur le score final.

**Comportement** : dès qu'un choix est sélectionné, on passe automatiquement à la question suivante (pas de bouton "Valider").

### 2.4 Écran de résultats

Affiché après les 15 questions. Il présente deux blocs :

#### Bloc 1 — Profil politique
- Positionnement de l'utilisateur sur un axe gauche–droite–centre, calculé à partir de ses votes comparés aux positions des groupes parlementaires
- Représentation visuelle simple (curseur sur une ligne)
- Pas de label stigmatisant : on indique une tendance, pas une étiquette définitive

#### Bloc 2 — Classement des groupes parlementaires
- Tous les groupes classés du plus au moins proche du joueur
- Pour chaque groupe : nom, abréviation, score de concordance (ex. : "73% d'accord")
- Le groupe en tête est mis en avant visuellement (encadré, couleur)
- Lien vers la page CIVIX du groupe pour en savoir plus

#### Actions disponibles
- Bouton **"Rejouer"** → recharge 15 nouveaux scrutins aléatoires
- Bouton **"Partager"** → (hors scope MVP, prévu v2)

---

## 3. Règles de gestion

### 3.1 Sélection des scrutins

- 15 scrutins tirés aléatoirement parmi les scrutins publics récents de la législature en cours (17e)
- Source : API CIVIX — endpoint `GET /api/v1/scrutins?page_size=N`
- Critères de filtre appliqués côté client :
  - Scrutin ayant au moins 8 groupes ayant voté (données `results_by_group` non vides)
  - Total de votants > 50 (scrutins significatifs, pas les votes de procédure à 3 personnes)
- Les 15 scrutins sont tirés aléatoirement à chaque nouvelle partie (pas de cache)

### 3.2 Calcul du score de proximité (groupe)

Pour chaque groupe parlementaire, on dispose de la position officielle du groupe sur chaque scrutin via le champ `results_by_group` de l'API CIVIX, qui fournit le décompte `pour / contre / abstention`.

Algorithme :

1. Pour chaque scrutin, on détermine la **position majoritaire du groupe** : le maximum parmi `pour`, `contre`, `abstention`
2. On compare cette position avec le choix du joueur (`pour` / `contre`)
3. Correspondance = +1 point ; désaccord = 0 point ; "Je ne sais pas" = scrutin ignoré pour ce calcul
4. Score final = (nombre de correspondances) / (nombre de questions répondues hors "Je ne sais pas")
5. Tous les groupes sont classés par score décroissant

**Cas d'égalité** : ordre alphabétique.

**Cas d'abstention du groupe** : si la position majoritaire du groupe est "abstention", ce scrutin est ignoré dans le calcul pour ce groupe (position non tranchée).

### 3.3 Calcul du profil politique (axe gauche–droite)

On attribue à chaque groupe une valeur fixe sur un axe de 0 à 10 :

| Groupe | Abrév. | Valeur axe |
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

Le profil de l'utilisateur est la **moyenne pondérée** des valeurs des groupes avec lesquels il est en accord, pondérée par leur score de concordance.

Résultat affiché sous forme de curseur sur une ligne graduée, avec les labels : "Gauche" — "Centre" — "Droite".

**Note importante** : ce positionnement est une estimation indicative basée sur les votes, pas un jugement de valeur. Il est clairement présenté comme tel dans l'interface.

---

## 4. Source de données — API CIVIX

Base URL : `https://www.civix.fr/api/v1`  
Accès : ouvert, sans clé API  
Licence : Licence Ouverte Etalab 2.0 (données Assemblée nationale)

### Endpoints utilisés

| Endpoint | Usage |
|---|---|
| `GET /scrutins?page_size=100` | Charger un pool de scrutins récents au démarrage |
| `GET /scrutins/{uid}/votes` | Récupérer les votes par groupe pour un scrutin |
| `GET /groupes` | Liste des groupes parlementaires (noms, abréviations, effectifs) |

### Structure des données clés

**Scrutin** (depuis `/scrutins`) :
```json
{
  "uid": "VTANR5L17V6284",
  "numero": 6284,
  "date_scrutin": "2026-04-16",
  "titre": "le projet de loi ...",
  "sort_code": "adopté",
  "is_adopted": true
}
```

**Votes par groupe** (depuis `/scrutins/{uid}/votes`) :
```json
{
  "results_by_group": [
    {
      "groupe_uid": "PO845401",
      "pour": 117,
      "contre": 0,
      "abstention": 0,
      "total": 117
    }
  ]
}
```

**Groupes** (depuis `/groupes`) :
```json
{
  "uid": "PO845401",
  "abbr": "RN",
  "libelle": "Rassemblement National",
  "effectif": 117
}
```

Les données ne sont pas modifiées, interprétées ou filtrées politiquement par l'application.

---

## 5. Contraintes et exigences non fonctionnelles

### 5.1 Performance
- Chargement initial en moins de 3 secondes sur connexion mobile 4G
- Les scrutins sont chargés en une seule requête au démarrage (`page_size=100`), les 15 sont tirés côté client
- Les votes par groupe (`/votes`) sont chargés uniquement pour les 15 scrutins retenus, en parallèle (`Promise.all`)

### 5.2 Neutralité éditoriale
- Aucun commentaire ni prise de position sur les scrutins présentés
- Les titres des scrutins sont reproduits fidèlement depuis l'API
- Le positionnement gauche-droite est clairement présenté comme une estimation indicative
- Les valeurs d'axe gauche-droite attribuées aux groupes (section 3.3) sont documentées et stables

### 5.3 Accessibilité
- Contraste suffisant pour les textes (WCAG AA)
- Boutons de taille suffisante pour usage mobile (min. 44×44px)
- Pas de dépendance aux couleurs seules pour transmettre l'information

### 5.4 Données personnelles
- Aucune donnée personnelle collectée
- Aucun cookie de tracking
- Les réponses du joueur ne sont pas envoyées à un serveur

---

## 6. Ce qui est hors scope pour le MVP

| Fonctionnalité | Raison du report |
|---|---|
| Député le plus proche (individuel) | API CIVIX ne fournit pas les votes nominatifs par député |
| Filtrage des scrutins par thème | Complexité de catégorisation, v2 |
| Partage des résultats | Dépend d'un backend ou d'une solution de screenshot, v2 |
| Comparaison avec son député local | Nécessite géolocalisation + votes nominatifs, v3 |
| Mode duel entre deux utilisateurs | Backend requis, v3 |
| Historique des parties | Stockage local ou backend, v2 |
| Version multilingue | V3 |

---

## 7. Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React |
| Style | Tailwind CSS |
| Données | API CIVIX (`civix.fr/api/v1`) — appels directs depuis le client |
| Hébergement | Docker (Vite dev server, port 5174) |

---

## 8. Critères de succès du MVP

- [ ] Une partie de 15 questions se joue de bout en bout sans erreur
- [ ] Les résultats sont cohérents (même jeu de réponses = même résultat)
- [ ] L'app est utilisable sur mobile sans zoom ni scroll horizontal
- [ ] Les données affichées sont traçables jusqu'à leur source officielle (CIVIX / Assemblée nationale)
- [ ] Un non-initié comprend le concept sans lire de documentation
- [ ] Aucune requête API n'échoue silencieusement (gestion d'erreur visible)

---

*Prochaine étape : développement du prototype React.*