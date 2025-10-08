# 🌙 Journal de Rêves — Starter Kit (Expo + React Native + TypeScript)

Bienvenue dans le **starter kit du projet _Journal de Rêves_**, une base solide pour initier un projet étudiant autour d’une application mobile immersive dédiée à l’enregistrement, l’analyse et le partage des rêves.  
Ce projet a été pensé pour offrir une **structure claire, modulaire et évolutive**, afin de faciliter le développement et l’expérimentation autour du thème du monde onirique.

---

## ⚙️ Technologies utilisées

- **[Expo](https://expo.dev/)** — pour le développement et le déploiement multiplateforme  
- **React Native** — pour la création de l’interface mobile  
- **TypeScript** — pour une base de code robuste et typée
- **React Native Paper** — pour une librairie graphique simple d'utilisation
- **AsyncStorage** — pour la gestion de la persistance locale des données  

---

## 🧩 Structure et architecture

Le projet suit une architecture simple mais extensible.  
Une évolution importante a été réalisée par rapport au projet du cours: **la mise en place de services et de constantes dédiés à la gestion du stockage local via AsyncStorage**.  

### Structure générale :
```
dreams-report-app/
├── components/
│ ├── DreamForm.tsx // Exemple de formulaire d’ajout de rêve (TypeScript)
│ ├── DreamList.tsx // Exemple de liste d’affichage des rêves (TypeScript)
│
├── services/
│ ├── AsyncStorageService.ts // Gestion centralisée du stockage AsyncStorage
│
├── constants/
│ ├── AsyncStorageConfig.ts // Clés de stockage et constantes globales
│
├── interfaces/
│ ├── DreamData.ts // Définition du type Dream
│
├── app/ // Point d’entrée de l’application
```

---

## 🚀 Lancer le projet

### 1️⃣ Installation des dépendances
```bash
npm install
```

### 2️⃣ Démarrage du serveur de développement
```bash
npx expo start
```

### 3️⃣ Exécution sur un appareil ou un émulateur
Vous pouvez lancer l’application de plusieurs manières :

📱 Sur un appareil physique :
Scannez le QR Code affiché dans le terminal ou le navigateur à l’aide de l’application Expo Go (disponible sur iOS et Android).

💻 Sur un émulateur :
"Run Web", “Run on iOS simulator” ou “Run on Android device/emulator” dans Expo Developer Tools, selon votre environnement.

4️⃣ Nettoyer le cache (optionnel)

Si vous rencontrez des comportements inattendus :
```bash
npx expo start -c
```
Cette commande reconstruit le cache de bundling d’Expo.

🧑‍💻 Auteur & Licence

Projet académique — Starter Kit “Journal de Rêves” - Julien COURAUD
Développé avec ❤️ pour servir de base à un projet étudiant.
