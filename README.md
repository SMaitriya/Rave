
## Lancement de l'application

Pour lancer l'application sur votre appareil mobile, ouvrez ce lien Expo avec un navigateur, puis scannez le QR code affiché avec l'application Expo Go :

[Ouvrir la page Expo pour le QR code](https://expo.dev/preview/update?message=Initial+publish&updateRuntimeVersion=1.0.0&createdAt=2025-07-11T12%3A59%3A59.876Z&slug=exp&projectId=91af44a5-35b4-4d47-a26d-8253f006d06a&group=40d582bd-5353-478f-801b-9a17b37d5ada)




# Rave - Application d'Enregistrement Audio via Transfert  Serveur et Transformation

Rave est une application mobile React Native développée avec Expo qui permet d'enregistrer des sons, de les sauvegarder localement, puis de les transférer vers un serveur pour traitement. L'application offre une interface intuitive avec gestion des enregistrements audio, lecture, suppression, et upload vers un serveur distant. 

Elle permet également de transformer les enregistrements audio en appliquant différents modèles sonores (comme jazz, cat, dog, etc.) sélectionnables par l'utilisateur, offrant ainsi une expérience ludique et créative.


---

## Fonctionnalités principales

- Enregistrement audio haute qualité via microphone.
- Sauvegarde locale des enregistrements avec nom personnalisé.
- Lecture et pause des enregistrements.
- Suppression sécurisée avec confirmation.
- Upload des fichiers audio vers un serveur 
- Transformation des enregistrements audio en appliquant différents modèles sonores (jazz, cat, dog, etc.) sélectionnables par l'utilisateur.


---

## Technologies utilisées

- React Native 
- Expo SDK
- expo-audio pour l'enregistrement et la lecture audio
- Redux Toolkit + react-redux pour la gestion d'état globale
- redux-persist avec AsyncStorage pour la persistance des données
- @expo/vector-icons pour les icônes
- React Native Gesture Handler, React Navigation, etc.

---

## Installation

1. **Cloner le dépôt**

```bash
git clone <https://github.com/SMaitriya/Rave.git>
cd rave



##Installer les dépendances

```bash
npm install
# ou
yarn install
```


## Utilisation

- Autorisez l'accès au microphone à la première ouverture.

- Appuyez sur le bouton **mic** pour commencer un enregistrement.

- Appuyez sur **stop** pour terminer l'enregistrement.

- Donnez un nom à votre enregistrement et sauvegardez-le.

- Vos enregistrements apparaissent dans la liste où vous pouvez les écouter ou supprimer.

- L'application envoie automatiquement les fichiers vers un serveur si l'IP et le port sont configurés dans Redux.

---

