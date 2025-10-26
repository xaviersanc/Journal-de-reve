# 🌙 Journal de Rêves — App mobile

Application mobile pour consigner ses rêves, les éditer, les taguer et visualiser des statistiques. Projet Expo + React Native + TypeScript, avec thème clair/sombre et stockage local (aucune donnée envoyée en ligne).

## Sommaire

- Aperçu
- Objectifs & valeur
- Public cible
- Fonctionnalités
- Pile technique
- Architecture (résumé)
- Installation & démarrage
- Build & distribution (aperçu)
- Personnalisation (icônes & splash)
- Dépannage (aperçu)
- Qualité & tests
- Accessibilité & UX
- Confidentialité & sécurité
- Performance
- Compatibilité
- Licence

## ✨ Aperçu

Notez vos rêves, ajoutez des tags, marquez des favoris, recherchez par période, personne ou mot-clé, et consultez des statistiques visuelles pour mieux comprendre vos nuits.

## ✅ Fonctionnalités

- Saisie complète (date/heure, titre, description, lieu, personnes)
- Types: lucide, cauchemar, agréable; Intensité & Qualité
- Tags normalisés (jusqu’à 3), favoris
- Liste avec édition/suppression (modale)
- Recherche simple et avancée; statistiques et tendances
- Thème clair/sombre automatique

## 🧰 Pile technique

- Expo (managed) + Expo Router
- React Native + React + TypeScript
- UI: React Native Paper, @expo/vector-icons
- Stockage local: AsyncStorage
- Graphiques: victory-native + react-native-svg

## 🧱 Architecture (résumé)

- Routage par onglets (Expo Router) et une modale Statistiques
- Composants majeurs: DreamForm (saisie) et DreamList (liste + édition)
- Service AsyncStorage centralisé pour la persistance
- Thème et styles via React Native Paper

## 🚀 Installation & démarrage (Windows / PowerShell)

Exécutez ces commandes pour cloner le projet, installer les dépendances et lancer le serveur Expo:

```powershell
git clone https://github.com/xaviersanc/Journal-de-reve.git
cd Journal-de-reve
npm install
npx expo start
```

Astuce: dans Expo Dev Tools, utilisez les raccourcis pour ouvrir sur Android, iOS (macOS) ou Web.

## 🎯 Objectifs & valeur

- Consigner ses rêves simplement au quotidien
- Retrouver facilement des entrées (recherche, filtres, tags)
- Comprendre ses tendances (types, intensité, qualité, récurrences)
- Protéger la vie privée: les données restent sur l’appareil

## 👥 Public cible

- Étudiants, passionnés d’UX et du sommeil
- Pratiquants de rêves lucides
- Toute personne souhaitant mieux suivre ses nuits

## 🧭 Parcours utilisateur

1. Ajouter un rêve depuis l’onglet dédié
2. Enrichir avec tags, personnes, lieu, type, intensité/qualité
3. Parcourir et filtrer la liste des rêves
4. Consulter les statistiques pour dégager des tendances

## 🧾 Données & règles métier

- Un rêve comprend un texte et une date/heure de référence
- Tags limités et normalisés pour une analyse cohérente
- Intensité/Qualité bornées pour la comparaison dans le temps
- Les dates ISO servent de base aux regroupements

## 🏗️ Architecture logique

- Présentation: onglets + modale Statistiques
- Domaine: modèle de rêve et règles (tags, dates)
- Données: service de persistance local unique
- UI/Thème: React Native Paper pour une cohérence visuelle

## 📦 Build & distribution (aperçu)

Compatible avec le service de build Expo. Prévoir un compte, des icônes configurées et les éléments de fiche store. Les instructions de build et de soumission peuvent être fournies séparément si besoin.

## 🖼️ Personnalisation (icônes & splash)

Placer les images d’icône, adaptive icon, splash et favicon dans le dossier des images et mettre à jour la configuration de l’app. Respecter les dimensions recommandées pour un rendu optimal.

## 🛟 Dépannage (aperçu)

- Éviter d’imbriquer des listes virtualisées dans un conteneur scrollable
- Conserver un fichier de lock pour stabiliser les installations
- Vérifier les dépendances graphiques selon la plateforme

## 🧪 Qualité & tests

- Typage fort pour limiter les régressions
- Tests de base fournis à titre d’exemple
- Recommandations: typecheck, lint (si présent) et smoke test

## ♿ Accessibilité & UX

- Thème clair/sombre automatique
- Tailles et contrastes lisibles, libellés explicites
- Écrans structurés et champs cohérents

## 🔒 Confidentialité & sécurité

- Données locales uniquement
 

## ⚡ Performance

- Liste virtualisée pour conserver la fluidité
- Calculs de statistiques pensés pour rester rapides

## 🧭 Compatibilité

- Android, iOS et Web (selon disponibilité des dépendances)
- Vérifications recommandées sur appareil réel

 

## 📜 Licence

Projet académique.


