import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// On définit la structure de l'état pour stocker l'IP et le port du serveur
interface ServerState {
  ip: string;
  port: string;
}

// Valeurs par défaut au lancement de l'app
const initialState: ServerState = {
  ip: '',
  port: '',
};

// Slice Redux pour gérer l'adresse du serveur
const serverSlice = createSlice({
  name: 'server',
  initialState,
  reducers: {
    // Permet de mettre à jour l'IP et le port du serveur
    setServer: (state, action: PayloadAction<{ ip: string; port: string }>) => {
      state.ip = action.payload.ip;
      state.port = action.payload.port;
    },
  },
});

export const { setServer } = serverSlice.actions;
export default serverSlice.reducer;