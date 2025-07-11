import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { setServer } from '../store/serverSlice';

// Écran d'accueil pour configurer la connexion au serveur
export default function HomeScreen() {
  // On stocke l'IP, le port et le statut de la connexion
  const [ip, setIp] = useState<string>('');
  const [port, setPort] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const dispatch = useDispatch();

  // Fonction appelée quand l'utilisateur appuie sur "Se connecter"
  const handleConnect = async () => {
    if (!ip || !port) {
      Alert.alert('Erreur', 'Merci de remplir les deux champs.');
      return;
    }

    try {
      // On tente de contacter le serveur avec l'IP et le port saisis
      const response = await fetch(`http://${ip}:${port}/`);
      const text = await response.text();
      if (text.toLowerCase().includes('success') || text.toLowerCase().includes('sucess')) {
        setStatus('✅ Connexion réussie');
        dispatch(setServer({ ip, port })); // On sauvegarde l'IP et le port dans le store
      } else {
        setStatus(`❌ Réponse inattendue : ${text}`);
      }
    } catch (error) {
      setStatus(`❌ Échec de connexion : ${(error as Error).message}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🌐 Connexion au serveur</Text>
        <Text style={styles.subtitle}>Configurez votre connexion réseau</Text>
      </View>
      
      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>📡 Adresse IP</Text>
          <TextInput
            style={styles.input}
            value={ip}
            onChangeText={setIp}
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>🔌 Port</Text>
          <TextInput
            style={styles.input}
            value={port}
            onChangeText={setPort}
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.buttonContainer}>
          <Button title="🚀 Se connecter" onPress={handleConnect} />
        </View>
      </View>
      
      {/* Affiche le statut de la connexion si besoin */}
      {status !== '' && (
        <View style={styles.statusContainer}>
          <Text style={styles.status}>{status}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderColor: '#E5E7EB',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },
  buttonContainer: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statusContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  status: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
});