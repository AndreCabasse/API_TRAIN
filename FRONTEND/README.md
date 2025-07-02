# Train Depot Simulation Frontend

## Description

Frontend React moderne pour l'application de simulation d'occupation des voies ferroviaires. Cette application permet de :

- **Gérer les trains** : Ajouter, modifier, supprimer des trains avec leurs caractéristiques
- **Visualiser l'occupation** : Voir l'état des voies en temps réel
- **Analyser les statistiques** : Graphiques et métriques de performance
- **Support multilingue** : Français, anglais, danois
- **Interface responsive** : Adaptée aux différentes tailles d'écran

## Fonctionnalités principales

### 🚄 Gestion des trains
- Formulaire d'ajout/modification avec validation
- Liste complète avec actions (éditer, supprimer)
- Support des trains électriques
- Gestion des types (storage, testing, pit)
- Sélection des dépôts (Glostrup, Naestved)

### 📊 Visualisations
- Dashboard avec statistiques clés
- Graphiques de répartition (type, longueur, dépôt)
- Occupation des voies en temps réel
- Indicateurs de performance

### 🌍 Internationalisation
- Interface en français, anglais et danois
- Traductions complètes de l'interface
- Formats de date/heure localisés

### 🎨 Interface moderne
- Design Material-UI
- Thème cohérent et professionnel
- Navigation intuitive par onglets
- Responsive design

## Technologies utilisées

- **React 18** avec TypeScript
- **Material-UI (MUI)** pour l'interface
- **Recharts** pour les graphiques
- **Axios** pour les appels API
- **Date-fns** pour la gestion des dates

## Installation

1. **Installer les dépendances** :
```bash
npm install
```

2. **Démarrer l'application** :
```bash
npm start
```

3. **Construire pour la production** :
```bash
npm run build
```

## Configuration

L'application se connecte par défaut au backend FastAPI sur `http://localhost:8000`.

Pour changer l'URL de l'API, modifiez `API_BASE_URL` dans `src/services/api.ts`.

## Structure du projet

```
src/
├── components/           # Composants React
│   ├── Dashboard.tsx    # Tableau de bord principal
│   ├── Header.tsx       # Navigation et sélecteur de langue
│   ├── TrainManagement.tsx  # Gestion CRUD des trains
│   ├── StatisticsView.tsx   # Visualisations et statistiques
│   └── DepotView.tsx    # Vue des dépôts et occupation
├── contexts/            # Contextes React
│   └── LanguageContext.tsx  # Gestion de la langue
├── services/            # Services API
│   └── api.ts          # Client API
├── types/               # Types TypeScript
│   └── index.ts        # Interfaces principales
├── utils/               # Utilitaires
│   └── translations.ts # Système de traduction
├── App.tsx             # Composant principal
└── index.tsx           # Point d'entrée
```

## API Backend

L'application utilise les endpoints suivants :

- `GET /trains` - Récupérer tous les trains
- `POST /trains` - Ajouter un nouveau train
- `PUT /trains/{id}` - Modifier un train
- `DELETE /trains/{id}` - Supprimer un train
- `GET /statistics` - Récupérer les statistiques
- `GET /requirements` - Récupérer les besoins
- `POST /reset` - Réinitialiser la simulation
- `POST /recalculate` - Recalculer la simulation

## Développement

### Ajout de nouvelles traductions

1. Modifier le fichier `src/utils/translations.ts`
2. Ajouter les nouvelles clés dans l'objet `TRANSLATIONS`
3. Utiliser `t('cle', language)` dans les composants

### Ajout de nouveaux composants

1. Créer le composant dans `src/components/`
2. Ajouter l'import dans `App.tsx`
3. Intégrer dans la navigation si nécessaire

## Production

Pour déployer en production :

1. Construire l'application : `npm run build`
2. Servir les fichiers statiques depuis le dossier `build/`
3. Configurer le serveur web pour rediriger toutes les routes vers `index.html`

## Intégration avec le backend

Assurez-vous que votre backend FastAPI :

1. Active CORS pour permettre les requêtes depuis le frontend
2. Expose les endpoints nécessaires
3. Retourne les données au format JSON attendu

Exemple de configuration CORS pour FastAPI :

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # URL du frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
