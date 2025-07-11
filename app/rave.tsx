import { Picker } from '@react-native-picker/picker';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Route, SceneMap, TabBar, TabView } from 'react-native-tab-view';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';

// Types pour les enregistrements et le serveur
type Recording = {
  id: string;
  uri: string;
  name: string;
  date: number;
};

type ServerState = {
  ip: string;
  port: number;
};

type RootState = {
  audio: { recordings: Recording[] };
  server: ServerState;
};

type Props = {};

// Écran principal pour la transformation audio avec RAVE
export default function RaveScreen(props: Props) {
  // On récupère les enregistrements et l'adresse du serveur depuis le store
  const recordings = useSelector((state: RootState) => state.audio.recordings);
  const server = useSelector((state: RootState) => state.server);
  const { ip, port } = server;

  // Gestion des tabs (onglets)
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'default', title: 'Son par défaut' },
    { key: 'recordings', title: 'Enregistrements' },
    { key: 'files', title: 'Fichiers téléphone' },
  ]);

  // États pour la sélection et la lecture des sons
  const [selectedUri, setSelectedUri] = useState<string | null>(null);
  const [transformedUri, setTransformedUri] = useState<string | null>(null);
  const [soundOriginal, setSoundOriginal] = useState<Audio.Sound | null>(null);
  const [soundTransformed, setSoundTransformed] = useState<Audio.Sound | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // États pour les modèles RAVE
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [loadingModels, setLoadingModels] = useState(false);

  const defaultSoundAsset = require('../assets/default.wav');

  // Lecture du son original sélectionné
  const playOriginal = async () => {
    if (!selectedUri) {
      Alert.alert('Aucun son sélectionné');
      return;
    }
    try {
      if (soundOriginal) {
        await soundOriginal.unloadAsync();
        setSoundOriginal(null);
      }
      const source =
        selectedUri === 'default' ? defaultSoundAsset : { uri: selectedUri };
      const { sound } = await Audio.Sound.createAsync(source);
      setSoundOriginal(sound);
      await sound.playAsync();
    } catch (error) {
      console.error('Erreur lecture son original:', error);
      Alert.alert('Erreur lecture son original');
    }
  };

  // Lecture du son transformé par le serveur
  const playTransformed = async () => {
    if (!transformedUri) {
      Alert.alert('Aucun son transformé disponible');
      return;
    }
    try {
      if (soundTransformed) {
        await soundTransformed.unloadAsync();
        setSoundTransformed(null);
      }
      const { sound } = await Audio.Sound.createAsync({ uri: transformedUri });
      setSoundTransformed(sound);
      await sound.playAsync();
    } catch (error) {
      console.error('Erreur lecture son transformé:', error);
      Alert.alert('Erreur lecture son transformé');
    }
  };

  // Nettoyage des sons lors du démontage du composant
  useEffect(() => {
    return () => {
      soundOriginal?.unloadAsync();
      soundTransformed?.unloadAsync();
    };
  }, [soundOriginal, soundTransformed]);

  // Récupération de la liste des modèles disponibles sur le serveur
  useEffect(() => {
    if (ip && port) {
      setLoadingModels(true);
      fetch(`http://${ip}:${port}/getmodels`)
        .then(res => res.json())
        .then(data => {
          const modelList = data.models || data;
          setModels(modelList);
          if (modelList.length > 0) setSelectedModel(modelList[0]);
        })
        .catch(() => Alert.alert('Erreur', 'Impossible de récupérer la liste des modèles'))
        .finally(() => setLoadingModels(false));
    }
  }, [ip, port]);

  // Sélection d'un modèle sur le serveur
  const onSelectModel = async (modelName: string) => {
    setSelectedModel(modelName);
    if (!ip || !port) return;
    try {
      const res = await fetch(`http://${ip}:${port}/selectModel/${modelName}`);
      if (!res.ok) {
        Alert.alert('Erreur', `Impossible de sélectionner le modèle ${modelName}`);
      }
    } catch (e: any) {
      Alert.alert('Erreur', `Erreur lors de la sélection du modèle: ${e.message}`);
    }
  };

  // Sélection d'un fichier audio depuis le téléphone
  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
      });
      if (result.assets && result.assets.length > 0) {
        setSelectedUri(result.assets[0].uri);
        setTransformedUri(null);
      }
    } catch (error) {
      console.error('Erreur sélection fichier:', error);
      Alert.alert('Erreur sélection fichier');
    }
  };

  // Envoi du fichier sélectionné au serveur pour transformation
  const sendToServer = async () => {
    if (!selectedUri) {
      Alert.alert('Erreur', 'Aucun fichier sélectionné');
      return;
    }
    if (!ip || !port) {
      Alert.alert('Erreur', 'IP ou port serveur non défini');
      return;
    }
    if (!selectedModel) {
      Alert.alert('Erreur', 'Veuillez sélectionner un modèle');
      return;
    }

    setIsProcessing(true);
    setTransformedUri(null);

    try {
      const formData = new FormData();
      const filename = selectedUri.split('/').pop() || 'audio.wav';
      const fileType = filename.endsWith('.m4a') ? 'audio/m4a' : 'audio/wav';

      if (selectedUri === 'default') {
        Alert.alert('Veuillez sélectionner un fichier audio réel');
        setIsProcessing(false);
        return;
      }

      formData.append('file', {
        uri: selectedUri,
        name: filename,
        type: fileType,
      } as any);

      const response = await fetch(`http://${ip}:${port}/upload`, {
        method: 'POST',
        body: formData,
      });

      const text = await response.text();
      console.log('Réponse brute serveur:', text);

      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status} - ${text}`);
      }

      if (!text.includes('ready to download')) {
        throw new Error(`Message serveur inattendu: ${text}`);
      }

      const downloadUrl = `http://${ip}:${port}/download`;
      setTransformedUri(downloadUrl);
    } catch (error) {
      console.error('Erreur upload + traitement:', error);
      Alert.alert("Erreur lors de l'upload ou traitement");
    } finally {
      setIsProcessing(false);
    }
  };

  // Vues pour les tabs
  const DefaultSoundRoute = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabText}>Son par défaut sélectionné</Text>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => {
          setSelectedUri('default');
          setTransformedUri(null);
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="musical-notes-outline" size={20} color="#fff" />
        <Text style={styles.selectButtonText}>Sélectionner ce son</Text>
      </TouchableOpacity>
    </View>
  );

  const RecordingsRoute = () => {
    if (!recordings.length) {
      return (
        <View style={styles.tabContent}>
          <Text style={styles.tabText}>Aucun enregistrement disponible</Text>
        </View>
      );
    }

    const renderItem = ({ item }: { item: Recording }) => (
      <TouchableOpacity
        style={[
          styles.recordingItem,
          selectedUri === item.uri && styles.selectedRecording,
        ]}
        onPress={() => {
          setSelectedUri(item.uri);
          setTransformedUri(null);
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.recordingName}>{item.name}</Text>
        <Text style={styles.recordingDate}>
          {new Date(item.date).toLocaleString()}
        </Text>
      </TouchableOpacity>
    );

    return (
      <FlatList
        data={recordings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={{ width: '100%' }}
      />
    );
  };

  const FilesRoute = () => (
    <View style={styles.tabContent}>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={pickFile}
        activeOpacity={0.7}
      >
        <Ionicons name="folder-open-outline" size={20} color="#fff" />
        <Text style={styles.selectButtonText}>Choisir un fichier audio</Text>
      </TouchableOpacity>
      {selectedUri && selectedUri !== 'default' && (
        <Text style={styles.selectedFileText}>
          Fichier sélectionné: {selectedUri.split('/').pop()}
        </Text>
      )}
    </View>
  );

  const renderScene = SceneMap({
    default: DefaultSoundRoute,
    recordings: RecordingsRoute,
    files: FilesRoute,
  });

  // Barre d'onglets personnalisée
  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: '#4FC3F7' }}
      style={{ backgroundColor: '#1f1f1f' }}
      renderLabel={({ route, focused }: { route: Route; focused: boolean }) => (
        <Text
          style={{
            color: focused ? '#4FC3F7' : '#777',
            margin: 8,
            fontWeight: '600',
            fontSize: 14,
          }}
        >
          {route.title}
        </Text>
      )}
    />
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vue RAVE - Transformation audio</Text>

      {/* Sélecteur de modèle */}
      <View style={styles.modelSelectorContainer}>
        <Text style={styles.label}>Sélectionnez un modèle :</Text>
        {loadingModels ? (
          <ActivityIndicator size="small" color="#4FC3F7" />
        ) : models.length > 0 ? (
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedModel}
              onValueChange={(itemValue) => onSelectModel(itemValue as string)}
              style={styles.picker}
              dropdownIconColor="#4FC3F7"
            >
              {models.map((model) => (
                <Picker.Item label={model} value={model} key={model} />
              ))}
            </Picker>
            <Ionicons
              name="chevron-down"
              size={20}
              color="#4FC3F7"
              style={styles.pickerIcon}
              pointerEvents="none"
            />
          </View>
        ) : (
          <Text style={styles.noModelText}>Aucun modèle disponible</Text>
        )}
      </View>

      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={setIndex}
        initialLayout={{ width: 360 }}
        style={{ flex: 1, marginBottom: 15 }}
      />

      {/* Bouton pour envoyer le son au serveur */}
      <TouchableOpacity
        style={[
          styles.sendButton,
          (isProcessing || !selectedUri || !selectedModel) && styles.sendButtonDisabled,
        ]}
        onPress={sendToServer}
        disabled={isProcessing || !selectedUri || !selectedModel}
        activeOpacity={0.7}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Text style={styles.sendButtonText}>Envoyer au serveur</Text>
        )}
      </TouchableOpacity>

      {/* Boutons pour écouter les sons */}
      <View style={styles.playButtons}>
        <TouchableOpacity
          style={[styles.playButton, !selectedUri && styles.playButtonDisabled]}
          onPress={playOriginal}
          disabled={!selectedUri}
          activeOpacity={0.7}
        >
          <Ionicons name="play-circle" size={28} color={selectedUri ? '#4FC3F7' : '#555'} />
          <Text style={[styles.playButtonText, !selectedUri && styles.disabledText]}>
            Son original
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.playButton, !transformedUri && styles.playButtonDisabled]}
          onPress={playTransformed}
          disabled={!transformedUri}
          activeOpacity={0.7}
        >
          <Ionicons
            name="play-circle-outline"
            size={28}
            color={transformedUri ? '#4FC3F7' : '#555'}
          />
          <Text style={[styles.playButtonText, !transformedUri && styles.disabledText]}>
            Son transformé
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',  
    padding: 16,
    paddingTop: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4A4A4A', 
    marginBottom: 20,
    textAlign: 'center',
  },
  modelSelectorContainer: {
    marginBottom: 15,
  },
  label: {
    color: '#555',
    fontSize: 14,
    marginBottom: 6,
    marginLeft: 4,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#4FC3F7',
    borderRadius: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  picker: {
    color: '#4FC3F7', 
    backgroundColor: '#FFFFFF',  
  },
  pickerIcon: {
    position: 'absolute',
    right: 10,
    top: 12,
    pointerEvents: 'none',
    color: '#4FC3F7',
  },
  noModelText: {
    color: '#999', 
    fontStyle: 'italic',
    paddingLeft: 4,
  },
  tabContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    color: '#555', 
    fontSize: 16,
    marginBottom: 12,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4FC3F7',  
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  selectButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 10,
    fontSize: 16,
  },
  selectedFileText: {
    marginTop: 12,
    color: '#444', 
    fontStyle: 'italic',
  },
  recordingItem: {
    backgroundColor: '#FFF', 
    padding: 14,
    borderRadius: 8,
    marginVertical: 6,
    marginHorizontal: 8,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedRecording: {
    borderColor: '#4FC3F7', 
    borderWidth: 2,
  },
  recordingName: {
    color: '#222',  
    fontWeight: '600',
    fontSize: 16,
  },
  recordingDate: {
    color: '#777', 
    fontSize: 12,
    marginTop: 4,
  },
  sendButton: {
    backgroundColor: '#4FC3F7',  
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#7AC7F9', 
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  playButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F2FF', 
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  playButtonDisabled: {
    opacity: 0.4,
  },
  playButtonText: {
    color: '#4FC3F7',  
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  disabledText: {
    color: '#AAA',  
  },
});
