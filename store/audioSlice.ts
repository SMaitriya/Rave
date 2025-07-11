import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Définition du type pour un fichier audio
interface AudioFile {
  id: string;       
  uri: string;       
  name?: string;     
  date: number;       
}

// Structure du state audio
interface AudioState {
  recordings: AudioFile[];
}

// État initial avec une liste vide d'enregistrements
const initialState: AudioState = {
  recordings: [],
};

// Création du slice Redux pour la gestion des enregistrements audio
const audioSlice = createSlice({
  name: 'audio',
  initialState,
  reducers: {
    // Ajoute un nouvel enregistrement
    addRecording: (state, action: PayloadAction<AudioFile>) => {
      state.recordings.push(action.payload);
    },
    // Supprime un enregistrement par son id
    removeRecording: (state, action: PayloadAction<string>) => {
      state.recordings = state.recordings.filter(r => r.id !== action.payload);
    },
    // Vide la liste des enregistrements
    clearRecordings: (state) => {
      state.recordings = [];
    },
  },
});

export const { addRecording, removeRecording, clearRecordings } = audioSlice.actions;
export default audioSlice.reducer;
