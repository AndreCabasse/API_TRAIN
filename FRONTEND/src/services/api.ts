import axios from 'axios';
import { Train, TrainFormData, Statistics } from '../types';

// Base URL for all API requests, configurable via environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Axios instance for consistent configuration across requests
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const trainApi = {
  // ===== TRAINS =====

  /**
   * Fetch all trains from the backend.
   * @returns Array of Train objects.
   */
  getTrains: async (): Promise<Train[]> => {
    const response = await api.get('/trains');
    return response.data;
  },

  /**
   * Add a new train to the system.
   * @param trainData - Data for the new train.
   * @returns The created Train object.
   */
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

  /**
   * Fetch requirements for operations (e.g., resources needed).
   * @returns Array of requirements.
   */
  getRequirements: async (): Promise<any[]> => {
    const response = await api.get('/requirements');
    return response.data;
  },

  /**
   * Update an existing train's data.
   * @param trainId - ID of the train to update.
   * @param trainData - Partial data to update.
   * @returns The updated Train object.
   */
  updateTrain: async (trainId: number, trainData: Partial<TrainFormData>): Promise<Train> => {
    const response = await api.put(`/trains/${trainId}`, trainData);
    return response.data;
  },

  /**
   * Delete a train by its ID.
   * @param trainId - ID of the train to delete.
   */
  deleteTrain: async (trainId: number): Promise<void> => {
    await api.delete(`/trains/${trainId}`);
  },

  // ===== DEPOTS =====

  /**
   * Fetch all depots.
   * @returns Array of depot objects.
   */
  getDepots: async (): Promise<any[]> => {
    const response = await api.get('/depots');
    return response.data;
  },

  /**
   * Fetch detailed information for a specific depot.
   * @param depotName - Name of the depot.
   * @returns Depot information.
   */
  getDepotInfo: async (depotName: string): Promise<any> => {
    const response = await api.get(`/depots/${depotName}`);
    return response.data;
  },

  /**
   * Fetch occupancy information for a specific depot.
   * @param depotName - Name of the depot.
   * @returns Occupancy data.
   */
  getDepotOccupancy: async (depotName: string): Promise<any> => {
    const response = await api.get(`/depots/${depotName}/occupancy`);
    return response.data;
  },

  // ===== STATISTICS =====

  /**
   * Fetch global statistics for dashboard or reporting.
   * @returns Statistics object.
   */
  getStatistics: async (): Promise<Statistics> => {
    const response = await api.get('/statistics');
    return response.data;
  },

  // ===== GANTT AND VISUALIZATIONS =====

  /**
   * Fetch Gantt chart data for a specific depot.
   * @param depotName - Name of the depot.
   * @returns Gantt chart data.
   */
  getGantt: async (depotName: string): Promise<any> => {
    const response = await api.get(`/gantt/${depotName}`);
    return response.data;
  },

  /**
   * Fetch instant occupancy for a depot at a specific time.
   * @param depotName - Name of the depot.
   * @param instant - ISO string of the instant.
   * @returns Occupancy data at the given instant.
   */
  getOccupationInstant: async (depotName: string, instant: string): Promise<any> => {
    const response = await api.get(`/occupation/${depotName}?instant=${instant}`);
    return response.data;
  },

  /**
   * Fetch train details for a depot at a specific instant.
   * @param depotName - Name of the depot.
   * @param instant - ISO string of the instant.
   * @returns Train details at the given instant.
   */
  getTrainDetails: async (depotName: string, instant: string): Promise<any> => {
    const response = await api.get(`/train-details/${depotName}?instant=${instant}`);
    return response.data;
  },

  // ===== MINI-GAME =====

  /**
   * Fetch the current state of the mini-game.
   * @returns Game state object.
   */
  getGameState: async (): Promise<any> => {
    const response = await api.get('/game/state');
    return response.data;
  },

  /**
   * Add a wagon to the mini-game on a specific track.
   * @param voie - Track number.
   * @param type_wagon - Type of wagon.
   * @param sens - Direction ('left' or 'right'), default is 'left'.
   * @returns Updated game state.
   */
  addWagonToGame: async (voie: number, type_wagon: string, sens: string = 'left'): Promise<any> => {
    const response = await api.post('/game/add-wagon', { voie, type_wagon, sens });
    return response.data;
  },

  /**
   * Add a locomotive to the mini-game on a specific track.
   * @param track - Track number.
   * @returns Updated game state.
   */
  addLocomotiveToGame: async (track: number) => {
    const response = await api.post(`/game/add-locomotive?voie=${track}`);
    return response.data;
  },

  /**
   * Fetch Gantt chart data for a specific train.
   * @param trainId - ID of the train.
   * @returns Gantt data for the train.
   */
  getTrainGantt: async (trainId: number): Promise<any[]> => {
    const response = await api.get(`/gantt-train/${trainId}`);
    return response.data;
  },

  /**
   * Fetch Gantt chart data for all trains.
   * @returns Array of Gantt data for all trains.
   */
  getAllTrainsGantt: async (): Promise<any[]> => {
    const response = await api.get('/gantt-all-trains');
    return response.data;
  },

  /**
   * Swap two wagons in the mini-game on a track.
   * @param trackNumber - Track number.
   * @param elementIndex - Index of the wagon to swap.
   * @param direction - Direction to swap ('left' or 'right').
   * @returns Updated game state.
   */
  swapWagonInGame: async (trackNumber: number, elementIndex: number, direction: 'left' | 'right') => {
    const response = await api.post('/game/swap-wagon', { trackNumber, elementIndex, direction });
    return response.data;
  },

  /**
   * Move a wagon from one track to another in the mini-game.
   * @param voie_source - Source track number.
   * @param wagon_idx - Index of the wagon to move.
   * @param voie_cible - Target track number.
   * @returns Updated game state.
   */
  moveWagonInGame: async (voie_source: number, wagon_idx: number, voie_cible: number): Promise<any> => {
    const response = await api.post('/game/move-wagon', { voie_source, wagon_idx, voie_cible });
    return response.data;
  },

  /**
   * Delete an element (wagon or locomotive) from a track in the mini-game.
   * @param voie - Track number.
   * @param element_idx - Index of the element to delete.
   * @returns Updated game state.
   */
  deleteElementFromGame: async (voie: number, element_idx: number): Promise<any> => {
    const response = await api.post('/game/delete-element', { voie, element_idx });
    return response.data;
  },
  
  getAllTrainsGanttOptimized: async (): Promise<any[]> => {
  const response = await api.get('/gantt-all-trains-optimized');
  return response.data;
},

  getTimelapseData: async (): Promise<any[]> => {
    const response = await api.get('/timelapse-data2');
    return response.data;
  },

  /**
   * Reset the mini-game to its initial state.
   * @returns New game state.
   */
  resetGame: async (): Promise<any> => {
    const response = await api.post('/game/reset');
    return response.data;
  },

  // ===== SIMULATION =====

  /**
   * Reset the simulation state on the backend.
   */
  resetSimulation: async (): Promise<void> => {
    await api.post('/reset');
  },

  /**
   * Trigger recalculation of simulation data.
   */
  recalculate: async (): Promise<void> => {
    await api.post('/recalculate');
  },
};

// Export the configured Axios instance for custom requests if needed elsewhere
export default api;