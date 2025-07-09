// Represents a train with all its properties and status
export interface Train {
  id: number; // Unique train identifier
  nom: string; // Train name or number
  wagons: number; // Number of wagons
  locomotives: number; // Number of locomotives
  longueur: number; // Total length of the train (meters)
  arrivee: string; // Arrival time (ISO string)
  depart: string; // Departure time (ISO string)
  depot: string; // Depot name where the train is located
  type: 'storage' | 'testing' | 'pit' | 'passenger'; // Type of train or operation
  electrique: boolean; // Whether the train is electric
  locomotive_cote?: 'left' | 'right'; // Side of the locomotive (optional)
  voie?: number | null; // Track number (optional, can be null if not assigned)
  en_attente?: boolean; // Indicates if the train is waiting (optional)
  // Dashboard-specific fields:
  debut_attente?: string | null; // Waiting start time (optional, ISO string)
  fin_attente?: string | null; // Waiting end time (optional, ISO string)
}

// Represents a depot with its tracks and occupation status
export interface Depot {
  name: string; // Depot name
  numeros_voies: number[]; // List of track numbers in the depot
  longueurs_voies: number[]; // Lengths of each track (meters)
  occupation: Occupation[]; // Occupation details for each track
}

// Represents the occupation of a track by a train during a time interval
export interface Occupation {
  voie: number; // Track number
  debut: string; // Occupation start time (ISO string)
  fin: string; // Occupation end time (ISO string)
  train: Train; // Train occupying the track
}

// Aggregated statistics for dashboard or reporting
export interface Statistics {
  total_trains: number; // Total number of trains
  trains_electriques: number; // Number of electric trains
  temps_moyen_attente: number; // Average waiting time (minutes or seconds)
  taux_occupation_global: number; // Global occupation rate (percentage)
  stats_par_depot: { [key: string]: any }; // Statistics per depot (keyed by depot name)
}

// Requirements for operations, such as resources needed
export interface Requirements {
  test_drivers: number; // Number of test drivers required
  locomotives: number; // Number of locomotives required
  details: string[]; // Additional details or notes
  by_depot: Record<string, any>; // Requirements per depot (keyed by depot name)
}

// Supported languages for the application
export type Language = 'fr' | 'en' | 'da';

// Data structure for train form input (used in forms for creating/editing trains)
export interface TrainFormData {
  nom: string; // Train name or number
  wagons: number; // Number of wagons
  locomotives: number; // Number of locomotives
  arrivee: string; // Arrival time (ISO string)
  depart: string; // Departure time (ISO string)
  depot: string; // Depot name
  type: 'storage' | 'testing' | 'pit' | 'passenger'; // Type of train or operation
  electrique: boolean; // Whether the train is electric
  locomotive_cote: 'left' | 'right'; // Side of the locomotive
}