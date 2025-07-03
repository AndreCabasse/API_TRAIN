import axios from 'axios';
import { Train, TrainFormData, Statistics, Requirements } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const trainApi = {
  // ===== TRAINS =====
  getTrains: async (): Promise<Train[]> => {
    const response = await api.get('/trains');
    return response.data;
  },

  addTrain: async (trainData: TrainFormData): Promise<Train> => {
    const response = await api.post('/trains', {
      nom: trainData.nom,
      wagons: trainData.wagons,
      locomotives: trainData.locomotives,
      arrivee: trainData.arrivee,
      depart: trainData.depart,
      depot: trainData.depot,
      type: trainData.type,
      electrique: trainData.electrique,
      locomotive_cote: trainData.locomotive_cote,
    });
    return response.data;
  },

  getRequirements: async (): Promise<any[]> => {
    const response = await api.get('/requirements');
    return response.data;
  },

  updateTrain: async (trainId: number, trainData: Partial<TrainFormData>): Promise<Train> => {
    const response = await api.put(`/trains/${trainId}`, trainData);
    return response.data;
  },

  deleteTrain: async (trainId: number): Promise<void> => {
    await api.delete(`/trains/${trainId}`);
  },

  // ===== DEPOTS =====
  getDepots: async (): Promise<any[]> => {
    const response = await api.get('/depots');
    return response.data;
  },

  getDepotInfo: async (depotName: string): Promise<any> => {
    const response = await api.get(`/depots/${depotName}`);
    return response.data;
  },

  getDepotOccupancy: async (depotName: string): Promise<any> => {
    const response = await api.get(`/depots/${depotName}/occupancy`);
    return response.data;
  },

  // ===== STATISTIQUES =====
  getStatistics: async (): Promise<Statistics> => {
    const response = await api.get('/statistics');
    return response.data;
  },

  // ===== GANTT ET VISUALISATIONS =====
  getGantt: async (depotName: string): Promise<any> => {
    const response = await api.get(`/gantt/${depotName}`);
    return response.data;
  },

  getOccupationInstant: async (depotName: string, instant: string): Promise<any> => {
    const response = await api.get(`/occupation/${depotName}?instant=${instant}`);
    return response.data;
  },

  getTrainDetails: async (depotName: string, instant: string): Promise<any> => {
    const response = await api.get(`/train-details/${depotName}?instant=${instant}`);
    return response.data;
  },

  // ===== MINI-JEU =====
  getGameState: async (): Promise<any> => {
    const response = await api.get('/game/state');
    return response.data;
  },

  addWagonToGame: async (voie: number, type_wagon: string, sens: string = 'left'): Promise<any> => {
    const response = await api.post('/game/add-wagon', { voie, type_wagon, sens });
    return response.data;
  },

  addLocomotiveToGame: async (track: number) => {
    const response = await api.post(`/game/add-locomotive?voie=${track}`);
    return response.data;
  },

  getTrainGantt: async (trainId: number): Promise<any[]> => {
  const response = await api.get(`/gantt-train/${trainId}`);
  return response.data;
  },

  getAllTrainsGantt: async (): Promise<any[]> => {
    const response = await api.get('/gantt-all-trains');
    return response.data;
  },

  swapWagonInGame: async (trackNumber: number, elementIndex: number, direction: 'left' | 'right') => {
  const response = await api.post('/game/swap-wagon', { trackNumber, elementIndex, direction });
  return response.data;
  },

  moveWagonInGame: async (voie_source: number, wagon_idx: number, voie_cible: number): Promise<any> => {
    const response = await api.post('/game/move-wagon', { voie_source, wagon_idx, voie_cible });
    return response.data;
  },

  deleteElementFromGame: async (voie: number, element_idx: number): Promise<any> => {
    const response = await api.post('/game/delete-element', { voie, element_idx });
    return response.data;
  },

  resetGame: async (): Promise<any> => {
    const response = await api.post('/game/reset');
    return response.data;
  },

  // ===== SIMULATION =====
  resetSimulation: async (): Promise<void> => {
    await api.post('/reset');
  },

  recalculate: async (): Promise<void> => {
    await api.post('/recalculate');
  },
};

export default api;