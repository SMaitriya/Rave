import { Tabs } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { Ionicons } from '@expo/vector-icons';
import { persistor, store } from '../store';

// Composant principal qui définit la structure de l'application avec Redux et la persistance
export default function Layout() {
  return (
    // Permet la gestion des gestes sur toute l'application
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Fournit le store Redux à toute l'app */}
      <Provider store={store}>
        {/* Gère la persistance du store Redux */}
        <PersistGate loading={null} persistor={persistor}>
          {/* Définition des tabs de navigation */}
          <Tabs
            screenOptions={({ route }) => ({
              headerShown: false, 
              tabBarActiveTintColor: '#4FC3F7',
              tabBarInactiveTintColor: '#555', 
              tabBarStyle: {
                backgroundColor: '#F8F9FA',
                borderTopWidth: 0,
                elevation: 5,
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: -3 },
              },
              tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: '600',
              },
              // Détermine l'icône à afficher selon l'onglet
              tabBarIcon: ({ focused, color, size }) => {
                let iconName;
                if (route.name === 'index') {
                  iconName = focused ? 'home' : 'home-outline';
                } else if (route.name === 'record') {
                  iconName = focused ? 'mic' : 'mic-outline';
                } else if (route.name === 'rave') {
                  iconName = focused ? 'musical-notes' : 'musical-notes-outline';
                }
                return <Ionicons name={iconName} size={size} color={color} />;
              },
            })}
          >
            {/* Déclaration des écrans/tabs */}
            <Tabs.Screen name="index" options={{ title: 'Home' }} />
            <Tabs.Screen name="record" options={{ title: 'Record' }} />
            <Tabs.Screen name="rave" options={{ title: 'RAVE' }} />
          </Tabs>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}
