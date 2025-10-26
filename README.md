# 🌙 Journal de Rêves — App mobile (Expo + React Native + TypeScript)

Application mobile pour consigner ses rêves, les éditer, les taguer et visualiser des statistiques. Le projet utilise Expo Router, React Native Paper et un service de persistance local basé sur AsyncStorage.


## ⚙️ Stack technique

- Expo 54 (managed workflow) et Expo Router 6
- React Native 0.81 + React 19 + TypeScript 5
- UI: React Native Paper, @expo/vector-icons, Keyboard Aware ScrollView
- Persistance: @react-native-async-storage/async-storage via un service dédié
- Graphiques: victory-native + react-native-svg (web: fallback automatique)


## ✨ Fonctionnalités

- Ajout d’un rêve avec date/heure, titre, description, lieu, personnes
- Typologie du rêve: lucide, cauchemar, agréable
- Mesures: Intensité et Qualité (0–10)
- Hashtags (jusqu’à 3, normalisés) et favoris
- Liste des rêves avec cartes et édition/suppression via modale
- Statistiques: volume par semaine/mois, répartition par type, mots récurrents, heatmap 30 jours, tendances Intensité/Qualité, “Top” personnages/lieux/tags
- Thème clair/sombre (auto) via useColorScheme + React Navigation ThemeProvider


## 🧩 Architecture

```
app/
	_layout.tsx           # Provider (Paper, Theme), Stack Router ((tabs), modal)
	+html.tsx             # Config web (fond, reset scroll)
	+not-found.tsx        # Écran 404
	modal.tsx             # Statistiques (chargement dynamique Victory)
	(modals)/
		StatsModal.tsx      # Variante statistiques (imports Victory natifs)
	(tabs)/
		_layout.tsx         # Tabs
		index.tsx           # Onglet 1: form d’ajout (DreamForm)
		two.tsx             # Onglet 2: liste/édition (DreamList)
		three.tsx           # Onglet 3: accueil

components/
	DreamForm.tsx         # Formulaire complet, gestion date/heure, sliders, tags
	DreamList.tsx         # Liste + modale d’édition, suppression, refresh
	Themed.tsx, StyledText.tsx, hooks de thème

services/
	AsyncStorageService.tsx  # getData/setData centralisés

constants/
	AsyncStorageConfig.ts    # Clés de stockage (dreamFormDataArray)

interfaces/
	DreamData.tsx            # Type principal des rêves
```


## 🗄️ Modèle de données et stockage

- Clé AsyncStorage: `dreamFormDataArray` (voir `constants/AsyncStorageConfig.ts`)
- Service: `AsyncStorageService.getData(key)` / `setData(key, data)`
- Type: `interfaces/DreamData.tsx`

Exemple d’objet persistant (simplifié):

```ts
type DreamData = {
	dreamText: string;
	isLucidDream: boolean;
	// Optionnels
	dateISO?: string;      // ISO fiable pour statistiques
	dateDisplay?: string;  // ex: 24/10/2025
	timeDisplay?: string;  // ex: 12:20
	title?: string;
	tags?: string[];       // max 3
	dreamType?: 'lucid' | 'nightmare' | 'pleasant';
};
```

Règles :
- Les tags sont normalisés: suppression des ‘#’, espaces → tirets, lowercase; max 3.
- La date/heure affichées sont formatées en FR; `dateISO` sert de source unique pour les graphiques.


## 🧭 Navigation

- Expo Router (Stack): écran racine affiche `(tabs)` et la modale `modal`.
- Onglets:
	- Tab 1 (`app/(tabs)/index.tsx`): Enregistrer un rêve (`DreamForm`).
	- Tab 2 (`app/(tabs)/two.tsx`): Liste + édition/suppression (`DreamList`).
	- Tab 3 (`app/(tabs)/three.tsx`): Accueil.
- Modale statistiques:
	- `app/modal.tsx` (détection automatique Victory web/native), ou
	- `app/(modals)/StatsModal.tsx` (imports explicites `victory-native`).

Astuce: pour ouvrir la modale via le routeur, pousser la route `/modal`.


## 🚀 Démarrage rapide

Prérequis:
- Node.js LTS, npm
- Expo CLI non requis (utilisation via `npx`)
- Optionnel: Android Studio (AVD) ou Xcode (simulateur iOS)

Installation:

```bash
npm install
```

Lancer le serveur Expo:

```bash
npx expo start
```

Exécuter:
- Web: presse « w » ou utilise le bouton « Run in web »
- Android: « a » (ou `npm run android`)
- iOS: « i » (ou `npm run ios`)
- Appareil physique: scanne le QR code dans Expo Go

Nettoyer le cache (si comportement étrange):

```bash
npx expo start -c
```


## 📜 Scripts npm

- `npm start` — démarre Expo Dev Server
- `npm run android` — lance sur un émulateur/appareil Android
- `npm run ios` — lance sur un simulateur iOS (macOS)
- `npm run web` — lance dans le navigateur


## 🧪 Qualité & tests

- TypeScript strict pour sécuriser les interfaces (`DreamData`).
- Un test d’exemple est présent (`components/__tests__/StyledText-test.js`).
- Configuration Jest non incluse par défaut; à ajouter si tu étends la couverture de tests.


## 🎨 UI/UX

- Design system basé sur React Native Paper.
- Thème clair/sombre automatique via `useColorScheme` et `ThemeProvider`.
- Gestion clavier et scrolling: `react-native-keyboard-aware-scroll-view`.
- Accessibilité basique: labels, tailles de police lisibles.


## 📈 Statistiques & graphiques

- Dépendances: `victory-native` et `react-native-svg` (déjà déclarées).
- Web: `app/modal.tsx` bascule automatiquement sur `victory` côté web.
- Cartes & graphiques fournis: barres par semaine/mois, pie par type, barres des mots récurrents, heatmap 30 jours, lignes Intensité/Qualité, “Top” entités et corrélations simples.


## 🔧 Dépannage

- Erreurs de bundling après des changements de dépendances: `npx expo start -c`.
- Police non chargée (SpaceMono): assure-toi que `assets/fonts/SpaceMono-Regular.ttf` existe et que `_layout.tsx` charge bien la police via `useFonts`.
- Problèmes Android/iOS: vérifie que les émulateurs/simulateurs sont correctement installés et démarrés avant `npm run android`/`ios`.
- Si Victory ne s’affiche pas: confirme l’installation de `react-native-svg` et `victory-native`, puis relance le bundler.


## 🧑‍� Auteur & Licence

Projet académique — “Journal de Rêves”.
Développé avec ❤️ comme base pour un projet étudiant.


## ✅ Ce qui est livré (fidèle au code)

- Enregistrement de rêves avec: titre, description, lieu, personnes, type (lucide/cauchemar/agréable), favoris, intensité, qualité, tags (3 max), date/heure FR
- Persistance locale via AsyncStorage sous la clé `dreamFormDataArray`
- Liste des rêves avec édition et suppression (modale interne), tri récent→ancien
- Deux variantes d’écran statistiques:
	- `app/modal.tsx`: barres par semaine, pie par type, mots récurrents (active si Victory dispo)
	- `app/(modals)/StatsModal.tsx`: version complète incluant mois, heatmap 30j, lignes intensité/qualité, top entités et corrélations simples (dont phases lunaires)
- Thème clair/sombre auto, Paper + Navigation ThemeProvider
- Web supporté (fallback conditionnel pour Victory)
- Pas d’i18n, pas de backend, pas d’authentification


## 📚 Documentation technique

Cette section détaille les contrats, flux, invariants et choix techniques, en restant strictement alignée avec l’implémentation actuelle (pas d’i18n, persistance locale uniquement).

### Plateformes, build et runtime

- Cibles: Android, iOS, Web (Expo managed)
- Config Expo (`app.json`):
	- `newArchEnabled: true`
	- `experiments.typedRoutes: true` (Expo Router)
	- Schéma de linking: `liveapp` (deep links possibles, non câblés dans le code)
	- Web: bundler `metro`, sortie `static`
- Entrée: `expo-router/entry`; stack et tabs définis sous `app/`

### Navigation (Expo Router)

- Stack racine: défini dans `app/_layout.tsx`
	- Écrans:
		- `(tabs)` sans header (3 onglets)
		- `modal` en présentation modale
- Onglets:
	- `app/(tabs)/index.tsx`: “Enregistrer un rêve” (embeds `DreamForm`)
	- `app/(tabs)/two.tsx`: “Liste de rêves” (embeds `DreamList`)
	- `app/(tabs)/three.tsx`: “Accueil” (placeholder)
- Modales statistiques:
	- `app/modal.tsx`: chargement conditionnel de `victory` (web) ou `victory-native` (native)
	- `app/(modals)/StatsModal.tsx`: import direct de `victory-native`
- Thème: `ThemeProvider` (React Navigation) + `PaperProvider` (React Native Paper)

### Theming, splash, polices

- Thème auto clair/sombre via `useColorScheme()` => `ThemeProvider` Dark/Default
- Splash: contrôle manuel avec `SplashScreen.preventAutoHideAsync()` et hide lorsque `useFonts` est chargé
- Font: `SpaceMono` chargée depuis `assets/fonts/SpaceMono-Regular.ttf`

### Persistance locale (AsyncStorage)

- Clé: `dreamFormDataArray` (voir `constants/AsyncStorageConfig.ts`)
- Service (`services/AsyncStorageService.tsx`):
	- `getData(key): Promise<DreamData[]>` — parse JSON, renvoie `[]` si vide
	- `setData(key, data: DreamData[]): Promise<void>` — stringify et sauvegarde
- Invariants:
	- Le store est toujours un tableau
	- Pas de versionnage ni de migrations; robustesse assurée par typage permissif côté lecture

### Modèle de données (runtime vs interface)

Interface déclarée (`interfaces/DreamData.tsx`):

```ts
export interface DreamData {
	dreamText: string;
	isLucidDream: boolean;
	dateISO?: string;
	dateDisplay?: string;
	timeDisplay?: string;
	title?: string;
	tags?: string[];
	emotions?: string[];
	dreamType?: 'lucid' | 'nightmare' | 'pleasant';
}
```

Champs effectivement manipulés ailleurs (non typés dans l’interface, accédés via `as any`):
- `location: string`
- `character: string`
- `favorite: boolean`
- `intensity: number` (0–10)
- `qualityDream: number` (0–10)

Conséquence: le code reste compatible avec d’anciens objets; l’interface peut être étendue ultérieurement pour refléter ces champs.

### Contrats UI (composants clés)

1) `components/DreamForm.tsx`
- Entrées: aucune prop (composant autonome)
- États gérés localement: `dreamText`, `dreamDescription`, `location`, `character`, `signification`, `favorite`, `intensity`, `quality`, `dreamType`, `dateObj`, `tags`, `tagInput`, `showDatePicker`, `showTimePicker`
- Règles:
	- Tags: max 3; normalisés (trim, suppression `#` en tête, espaces→tirets, lowercase)
	- Date/Heure: `Intl.DateTimeFormat('fr-FR')`; 24h, pas d’i18n
	- Soumission: push dans le tableau existant, puis reset intégral du formulaire
	- Champ `isLucidDream` dérivé de `dreamType === 'lucid'`
- Erreurs: try/catch autour de la persistance; log console en cas d’erreur

2) `components/DreamList.tsx`
- Récupération: `AsyncStorageService.getData` puis inversion d’ordre pour afficher le plus récent en haut
- Édition: ouverture d’une modale interne (`Portal`/`Modal` Paper) avec copie éditable du rêve
- Mapping index: l’UI est inversée; conversion d’index via `getStorageIndex` avant update/delete
- Sauvegarde: merge non destructif; `dateISO`/`dateDisplay`/`timeDisplay` recalculés à partir du `dateObj` sélectionné; `isLucidDream` recalculé si type changé
- Suppression: `splice`, puis réécriture du tableau
- UX: `RefreshControl` pour recharger; rendu `FlatList`; keyExtractor basé sur l’index (limitation connue)

3) Statistiques (`app/modal.tsx` et `app/(modals)/StatsModal.tsx`)
- Normalisation des dates: priorité à `dateISO`; fallback parse de `dateDisplay` (FR `dd/mm/yyyy`)
- Agrégations: par semaine (lundi=0), par mois; répartition par type; mots fréquents (stoplist FR minimaliste)
- Variantes:
	- `modal.tsx`: require conditionnel `victory` (web) vs `victory-native` (native)
	- `StatsModal.tsx`: imports directs `victory-native`, heatmap custom, corrélations simples

### Flux de données (simplifié)

Ajout: Form -> getData -> push -> setData -> reset -> (List rechargée via onglet 2)

Édition: List (open editor) -> getStorageIndex -> getData -> merge edit -> setData -> reload list -> close editor

Suppression: List (delete) -> getStorageIndex -> getData -> splice -> setData -> reload list

Statistiques: Load -> map/normalize -> agrégations -> graphiques

### Formats et locale

- Langue: FR uniquement, pas d’i18n (souhaité)
- Format de date: `dd/mm/yyyy`, heure 24h
- `dateISO` est la source fiable pour toute logique temporelle

### Contraintes et limites connues

- Pas d’ID unique par item (utilisation de l’index pour la clé de liste)
- `DreamData` n’expose pas tous les champs utilisés (ex: `location`, `intensity`), d’où des casts `any`
- Pas de validation forte des champs (ex: longueur, caractères interdits)
- Aucune confirmation de suppression
- Aucune recherche/filtre/pagination
- Pas d’export/import ni synchronisation cloud
- Pas de chiffrement local ni protection (biométrie/code)

### Performance et UX

- `FlatList` pour virtualisation basique; `keyExtractor` sur index (risque de re-render non optimal)
- `useMemo`/`useCallback` utilisés pour limiter les recomputations de listes et contrôles
- Les graphiques peuvent être coûteux sur de très gros volumes: rester sur des agrégations simples

### Accessibilité

- Labels explicites pour les champs; tailles de texte lisibles
- Thème auto améliore le contraste en mode sombre
- Pas de support screen-reader spécifique ni de navigation clavier dédiée

### Qualité logicielle (garde-fous)

- TypeScript 5; interfaces principales tapées
- Test de démonstration présent (`components/__tests__/StyledText-test.js`)
- Conseils manuels “quality gates” avant PR:
	- Build TypeScript: erreurs bloquantes
	- Lint (optionnel si ajouté): corriger les warnings majeurs
	- Smoke-test: ajout d’un rêve, édition, suppression, affichage stats

### Dépendances clés (versions)

- Expo `~54.0.10`, Expo Router `~6.0.8`, React `19.1.0`, React Native `0.81.4`
- UI: `react-native-paper@^5.14.5`, `@expo/vector-icons@^15.0.2`
- Stockage: `@react-native-async-storage/async-storage@2.2.0`
- Graphiques: `victory-native@^41.20.1`, `react-native-svg@15.12.1`
- Autres: `react-native-keyboard-aware-scroll-view@^0.9.5`, `@react-native-community/datetimepicker@^8.4.5`, `@react-native-community/slider@^5.0.1`

### Exécution (Windows / PowerShell)

```powershell
npm install
npx expo start
```

Raccourcis Expo: `a` (Android), `i` (iOS sur macOS), `w` (Web)

Nettoyage cache si nécessaire:

```powershell
npx expo start -c
```

### Pistes d’amélioration technique (sans divergence fonctionnelle)

- Étendre `DreamData` avec les champs réellement utilisés (`location`, `character`, `favorite`, `intensity`, `qualityDream`)
- Ajouter des IDs (`uuid`) pour stabiliser les clés de liste et simplifier l’édition/suppression
- Confirmation de suppression et toasts d’état (Paper `Snackbar`)
- Validation légère (ex: longueur minimale du titre/description)
- Factoriser l’utilitaire de formatage date/heure et la normalisation de tags
