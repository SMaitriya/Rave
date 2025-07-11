import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from 'redux-persist';
import audioReducer from './audioSlice';
import serverReducer from './serverSlice';

// On configure la persistance uniquement pour la partie audio (les enregistrements)
const persistConfig = {
  key: 'audio',
  storage: AsyncStorage,
  whitelist: ['recordings'], // On ne persiste que la liste des enregistrements
};

// On combine les reducers de l'app
const rootReducer = combineReducers({
  server: serverReducer,
  audio: persistReducer(persistConfig, audioReducer),
});

// Création du store Redux avec la configuration de persistance
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // On ignore les actions redux-persist pour éviter les warnings
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// On crée le persistor pour gérer la sauvegarde/restauration automatique
export const persistor = persistStore(store);

// Types utiles pour l'app (pour TypeScript)
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
