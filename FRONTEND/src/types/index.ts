export interface Train {
  id: number;
  nom: string;
  wagons: number;
  locomotives: number;
  longueur: number;
  arrivee: string;
  depart: string;
  depot: string;
  type: 'storage' | 'testing' | 'pit' | 'passenger';
  electrique: boolean;
  locomotive_cote?: 'left' | 'right';
  voie?: number | null;
  en_attente?: boolean;
  // Ajout pour dashboard :
  debut_attente?: string | null;
  fin_attente?: string | null;
}

export interface Depot {
  name: string;
  numeros_voies: number[];
  longueurs_voies: number[];
  occupation: Occupation[];
}

export interface Occupation {
  voie: number;
  debut: string;
  fin: string;
  train: Train;
}

export interface Statistics {
  total_trains: number;
  trains_electriques: number;
  temps_moyen_attente: number;
  taux_occupation_global: number;
  stats_par_depot: { [key: string]: any };
}

export interface Requirements {
  test_drivers: number;
  locomotives: number;
  details: string[];
  by_depot: Record<string, any>;
}

export type Language = 'fr' | 'en' | 'da';

export interface TrainFormData {
  nom: string;
  wagons: number;
  locomotives: number;
  arrivee: string;
  depart: string;
  depot: string;
  type: 'storage' | 'testing' | 'pit' | 'passenger';
  electrique: boolean;
  locomotive_cote: 'left' | 'right';
}
