import { Ionicons } from '@expo/vector-icons';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import React, { useEffect, useState } from 'react';
import { Alert, Animated, Dimensions, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { addRecording, removeRecording } from '../store/audioSlice';

const { width } = Dimensions.get('window');

export default function RecordScreen() {
  // Initialisation des hooks et états pour l'enregistrement et la lecture audio
  const dispatch = useDispatch();
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [recordingName, setRecordingName] = useState<string>('');
  const [currentPlayingUri, setCurrentPlayingUri] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const player = useAudioPlayer(currentPlayingUri);
  const listPlayer = useAudioPlayer(currentPlayingUri);
  const generateId = () => Date.now().toString() + Math.floor(Math.random() * 1000);

  const recordingAnimation = new Animated.Value(0);

  // On récupère les enregistrements et infos serveur depuis Redux
  const recordings = useSelector((state: any) => state.audio.recordings);
  const server = useSelector((state: any) => state.server);
  const ip = server?.ip;
  const port = server?.port;

  // Lecture automatique quand on sélectionne un enregistrement
  useEffect(() => {
    if (currentPlayingUri) {
      try {
        player.play();
      } catch (err) {
        console.log('Erreur lecture audio:', err);
      }
    }
  }, [currentPlayingUri, player]);

  // Affiche en console les enregistrements à chaque changement
  useEffect(() => {
    console.log('🎧 Recordings Redux:', recordings);
  }, [recordings]);

  // Demande la permission micro au montage du composant
  useEffect(() => {
    (async () => {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission microphone refusée');
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    })();
  }, []);

  // Animation du bouton d'enregistrement
  useEffect(() => {
    if (recorderState.isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(recordingAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      recordingAnimation.stopAnimation();
      recordingAnimation.setValue(0);
    }
  }, [recorderState.isRecording]);

  // Lance l'enregistrement audio
  const startRecording = async () => {
    await audioRecorder.prepareToRecordAsync();
    audioRecorder.record();
    setRecordedUri(null);
    setStatus('Enregistrement en cours...');
  };

  // Arrête l'enregistrement et prépare la sauvegarde
  const stopRecording = async () => {
    if (!recorderState.isRecording) {
      setStatus('Aucun enregistrement en cours');
      return;
    }
    try {
      setStatus('Arrêt de l\'enregistrement...');
      await audioRecorder.stop();

      const uri = audioRecorder.uri;
      if (uri) {
        setRecordedUri(uri);
        setStatus('Enregistrement terminé - Donnez un nom et sauvegardez');
        setRecordingName(`Enregistrement ${new Date().toLocaleTimeString()}`);
        await uploadAudio(uri);
      } else {
        setStatus('URI non disponible');
      }
    } catch (err) {
      console.error('Erreur arrêt enregistrement :', err);
      setStatus('Erreur lors de l\'arrêt');
    }
  };

  // Sauvegarde l'enregistrement dans Redux
  const saveRecording = () => {
    if (!recordedUri || !recordingName.trim()) {
      Alert.alert('Erreur', 'Veuillez donner un nom à l\'enregistrement');
      return;
    }

    const newRecording = {
      id: generateId(),
      uri: recordedUri,
      name: recordingName.trim(),
      date: Date.now(),
    };

    dispatch(addRecording(newRecording));
    setRecordedUri(null);
    setRecordingName('');
    setStatus('Enregistrement sauvegardé avec succès !');
  };

  // Supprime un enregistrement après confirmation
  const deleteRecording = (id: string) => {
    Alert.alert(
      'Supprimer l\'enregistrement',
      'Êtes-vous sûr de vouloir supprimer cet enregistrement ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => dispatch(removeRecording(id)) }
      ]
    );
  };

  // Lecture/Pause d'un enregistrement de la liste
  const playRecording = (uri: string, id: string) => {
    if (playingId === id) {
      player.pause();
      setPlayingId(null);
      setCurrentPlayingUri(null);
    } else {
      setPlayingId(id);
      setCurrentPlayingUri(uri);
    }
  };

  // Upload l'audio vers le serveur si IP/port définis
  const uploadAudio = async (uri: string) => {
    if (!ip || !port) {
      setStatus('IP ou port serveur non défini');
      return;
    }
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: 'recording.wav',
      type: 'audio/wav',
    } as any);

    try {
      const response = await fetch(`http://${ip}:${port}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      const text = await response.text();
      console.log(`Serveur: ${text}`);
    } catch (error) {
      console.log(`Erreur upload: ${(error as Error).message}`);
    }
  };

  // Formate la durée en mm:ss (non utilisé ici mais utile)
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Affichage d'un item de la liste des enregistrements
  const renderRecordingItem = ({ item }: { item: any }) => (
    <View style={styles.recordingItem}>
      <View style={styles.recordingInfo}>
        <View style={styles.recordingHeader}>
          <Ionicons name="musical-notes" size={20} color="#6C5CE7" />
          <Text style={styles.recordingName}>{item.name}</Text>
        </View>
        <View style={styles.recordingMeta}>
          <Ionicons name="time-outline" size={14} color="#74B9FF" />
          <Text style={styles.recordingDate}>{new Date(item.date).toLocaleString()}</Text>
        </View>
      </View>
      <View style={styles.recordingActions}>
        {/* Bouton lecture/pause */}
        <TouchableOpacity 
          style={[styles.actionButton, styles.playButton]}
          onPress={() => playRecording(item.uri, item.id)}
        >
          <Ionicons 
            name={playingId === item.id ? 'pause' : 'play'} 
            size={20} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
        {/* Bouton suppression */}
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteRecording(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* En-tête de l'écran */}
      <View style={styles.header}>
        <Ionicons name="mic" size={28} color="#6C5CE7" />
        <Text style={styles.headerTitle}>Enregistreur Audio</Text>
      </View>

      {/* Affichage du statut (prêt, en cours, etc.) */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{status || 'Prêt à enregistrer'}</Text>
      </View>
      
      {/* Contrôles d'enregistrement */}
      <View style={styles.recordingControls}>
        <TouchableOpacity 
          style={[
            styles.recordButton,
            recorderState.isRecording && styles.recordButtonActive
          ]}
          onPress={recorderState.isRecording ? stopRecording : startRecording}
        >
          <Animated.View 
            style={[
              styles.recordButtonInner,
              {
                opacity: recorderState.isRecording ? recordingAnimation : 1
              }
            ]}
          >
            <Ionicons 
              name={recorderState.isRecording ? 'stop' : 'mic'} 
              size={32} 
              color="#FFFFFF" 
            />
          </Animated.View>
        </TouchableOpacity>
        
        <Text style={styles.recordingInstruction}>
          {recorderState.isRecording ? 'Appuyez pour arrêter' : 'Appuyez pour enregistrer'}
        </Text>
      </View>

      {/* Section pour sauvegarder un nouvel enregistrement */}
      {recordedUri && (
        <View style={styles.saveSection}>
          <View style={styles.saveSectionHeader}>
            <Ionicons name="checkmark-circle" size={24} color="#00B894" />
            <Text style={styles.saveSectionTitle}>Nouvel enregistrement</Text>
          </View>
          
          <View style={styles.previewContainer}>
            <TouchableOpacity 
              style={styles.previewButton}
              onPress={() => {
                setCurrentPlayingUri(recordedUri);
                setPlayingId(null);
              }}
            >
              <Ionicons name="play-circle" size={24} color="#74B9FF" />
              <Text style={styles.previewText}>Écouter l'aperçu</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputContainer}>
            <Ionicons name="create-outline" size={20} color="#6C5CE7" />
            <TextInput
              style={styles.nameInput}
              placeholder="Nom de l'enregistrement"
              value={recordingName}
              onChangeText={setRecordingName}
              placeholderTextColor="#A0A0A0"
            />
          </View>
          
          <TouchableOpacity style={styles.saveButton} onPress={saveRecording}>
            <Ionicons name="save-outline" size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Sauvegarder</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Liste des enregistrements */}
      <View style={styles.recordingsList}>
        <View style={styles.listHeader}>
          <Ionicons name="list" size={24} color="#2D3436" />
          <Text style={styles.listTitle}>Mes enregistrements</Text>
          <View style={styles.recordingCount}>
            <Text style={styles.recordingCountText}>{recordings.length}</Text>
          </View>
        </View>
        
        {recordings.length === 0 ? (
          // Affichage si aucun enregistrement
          <View style={styles.emptyState}>
            <Ionicons name="musical-notes-outline" size={48} color="#DDD" />
            <Text style={styles.emptyStateText}>Aucun enregistrement</Text>
            <Text style={styles.emptyStateSubtext}>Commencez par créer votre premier enregistrement</Text>
          </View>
        ) : (
          // Liste des enregistrements
          <FlatList
            data={recordings}
            renderItem={renderRecordingItem}
            keyExtractor={(item) => item.id}
            style={styles.flatList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.flatListContent}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3436',
    marginLeft: 12,
  },
  statusContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  statusText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#636E72',
    fontWeight: '500',
  },
  recordingControls: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#6C5CE7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: '#E17055',
    shadowColor: '#E17055',
  },
  recordButtonInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingInstruction: {
    marginTop: 16,
    fontSize: 16,
    color: '#636E72',
    fontWeight: '500',
  },
  saveSection: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  saveSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  saveSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
    marginLeft: 8,
  },
  previewContainer: {
    marginBottom: 16,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  previewText: {
    fontSize: 16,
    color: '#74B9FF',
    fontWeight: '500',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  nameInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#2D3436',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00B894',
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  recordingsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
    marginLeft: 8,
    flex: 1,
  },
  recordingCount: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  recordingCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#636E72',
    fontWeight: '600',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'center',
    marginTop: 8,
  },
  flatList: {
    flex: 1,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  recordingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  recordingInfo: {
    flex: 1,
  },
  recordingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  recordingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginLeft: 8,
  },
  recordingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingDate: {
    fontSize: 12,
    color: '#636E72',
    marginLeft: 4,
  },
  recordingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  playButton: {
    backgroundColor: '#74B9FF',
  },
  deleteButton: {
    backgroundColor: '#E17055',
  },
});