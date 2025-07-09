# -*- coding: utf-8 -*-
"""
Created on Wed Jun 25 09:38:07 2025

@author: andre
"""

"""
Railway simulation with chronological management and safety margin.
"""

from datetime import datetime, timedelta
from .Utiles_Core import verifier_conflit

class Train:
    """
    Represents a train in the simulation.
    Stores all relevant attributes for placement and scheduling.
    """
    def __init__(self, id, nom, wagons, locomotives, arrivee, depart, depot, type="storage", electrique=False, locomotive_cote="left"):
        self.id = id
        self.nom = nom
        self.wagons = wagons
        self.locomotives = locomotives
        self.longueur = self.calculer_longueur()  # Total length of the train
        self.arrivee = arrivee  # Arrival datetime
        self.depart = depart    # Departure datetime
        self.en_attente = False # Is the train waiting for a track?
        self.debut_attente = None
        self.fin_attente = None
        self.voie = None       # Track number assigned
        self.electrique = electrique
        self.depot = depot
        self.type = type
        self.locomotive_cote = locomotive_cote  # "left" or "right" for single locomotive
        self.type_wagon = None # Optional: type of wagons

    def calculer_longueur(self):
        """
        Compute the total length of the train based on number of wagons and locomotives.
        Returns: int (length in meters)
        """
        longueur_wagon = 14
        longueur_locomotive = 19
        return self.wagons * longueur_wagon + self.locomotives * longueur_locomotive

class Simulation:
    """
    Main simulation class.
    Handles depots, trains, placement optimization, and recalculation logic.
    """

    def optimiser_placement_global(self):
        """
        Optimize the placement of all trains across all depots and tracks,
        regardless of their initially assigned depot, to minimize space and time usage.
        Returns a list of trains with their optimal placement (depot, track, schedule).
        """
        # Deep copy trains to avoid modifying the current state
        from copy import deepcopy
        trains = deepcopy(self.trains)
        # Sort trains by arrival time
        trains.sort(key=lambda t: t.arrivee)

        # Prepare occupation structure for each depot
        depots_occupation = {}
        for depot, data in self.depots.items():
            depots_occupation[depot] = {
                "occupation": [],
                "numeros_voies": data["numeros_voies"],
                "longueurs_voies": data["longueurs_voies"]
            }

        # For each train, find the best placement (across all depots)
        placements = []
        for train in trains:
            best = None
            best_depot = None
            best_voie = None
            best_debut = None
            for depot, data in depots_occupation.items():
                longueurs_voies = data["longueurs_voies"]
                occupation = data["occupation"]
                # Search for an available track in this depot
                voie_idx, debut_placement = self.chercher_voie_disponible(
                    train, train.arrivee, occupation, longueurs_voies
                )
                if voie_idx is not None and debut_placement < train.depart:
                    # Optimization: earliest possible placement, then shortest track possible
                    if best is None or debut_placement < best or (debut_placement == best and longueurs_voies[voie_idx] < longueurs_voies[best_voie]):
                        best = debut_placement
                        best_depot = depot
                        best_voie = voie_idx
                        best_debut = debut_placement
            if best_depot is not None:
                # Place the train in this depot/track
                depots_occupation[best_depot]["occupation"].append((best_voie, best_debut, train.depart, train))
                placements.append({
                    "id": train.id,
                    "nom": train.nom,
                    "arrivee": train.arrivee,
                    "depart": train.depart,
                    "longueur": train.longueur,
                    "depot": best_depot,
                    "voie": depots_occupation[best_depot]["numeros_voies"][best_voie],
                    "debut_placement": best_debut,
                    "fin_placement": train.depart,
                    "en_attente": best_debut > train.arrivee,
                })
            else:
                # No placement possible
                placements.append({
                    "id": train.id,
                    "nom": train.nom,
                    "arrivee": train.arrivee,
                    "depart": train.depart,
                    "longueur": train.longueur,
                    "depot": None,
                    "voie": None,
                    "debut_placement": None,
                    "fin_placement": None,
                    "en_attente": True,
                })
        return placements

    def __init__(self, depots_config=None):
        """
        Initialize the simulation with a set of depots and their tracks.
        If no config is provided, use a default set of depots.
        """
        if depots_config is None:
            depots_config = {
                "Glostrup": {"numeros_voies": [7,8,9,11], "longueurs_voies": [290,340,400,300], "lat": 55.662194, "lon": 12.393508},
                "Naestved": {"numeros_voies": [1,2,3,4], "longueurs_voies": [250,300,350,280], "lat": 55.194538, "lon": 11.822616},
                "Taulov": {"numeros_voies": [21], "longueurs_voies": [280], "lat": 55.546012, "lon": 9.632929},
                "KAC": {"numeros_voies": [22], "longueurs_voies": [280], "lat": 55.624757, "lon": 12.680361},
                "Helgoland": {"numeros_voies": [23], "longueurs_voies": [280], "lat": 55.714857, "lon": 12.582771},
                "Padborg": {"numeros_voies": [24], "longueurs_voies": [280], "lat": 54.824899, "lon": 9.357716},
                "Langenfelde": {"numeros_voies": [25], "longueurs_voies": [280], "lat": 53.581551, "lon": 9.924246},
                "LMII": {"numeros_voies": [26,27], "longueurs_voies": [280,300], "lat": 40.537568, "lon": -3.887422},
                "Hendaya": {"numeros_voies": [28], "longueurs_voies": [320], "lat": 43.348556, "lon": -1.788629},
                "Rivabellosa": {"numeros_voies": [29], "longueurs_voies": [250], "lat": 42.699047, "lon": -2.917172},
                "KVO (CPH)": {"numeros_voies": [30,31], "longueurs_voies": [300,280], "lat": 55.662953, "lon": 12.546617},
                "Elsinore": {"numeros_voies": [32], "longueurs_voies": [270], "lat": 56.030817, "lon": 12.608929},
            }
        self.depots = {}
        for nom, conf in depots_config.items():
            self.depots[nom] = {
                "numeros_voies": conf["numeros_voies"],
                "longueurs_voies": conf["longueurs_voies"],
                "occupation": [],
                "lat": conf.get("lat"),
                "lon": conf.get("lon"),
            }
        self.trains = []
        self.delai_securite = 10  # Safety margin in minutes between trains
        self.historique = []

    def ajouter_depot(self, nom, numeros_voies, longueurs_voies):
        """
        Add a new depot to the simulation.
        - nom: depot name
        - numeros_voies: list of track numbers
        - longueurs_voies: list of track lengths
        """
        if nom in self.depots:
            return "Ce dépôt existe déjà."
        self.depots[nom] = {
            "numeros_voies": numeros_voies,
            "longueurs_voies": longueurs_voies,
            "occupation": []
        }

    def ajouter_train(self, train, depot, optimiser=False, ajouter_a_liste=True):
        """
        Add a train to the simulation and recalculate placements.
        - train: Train object
        - depot: depot name
        - optimiser: if True, optimize placement globally
        - ajouter_a_liste: if True, add train to the train list
        Returns: None if success, or error message string
        """
        if train.arrivee >= train.depart:
            return "L'heure d'arrivée doit être antérieure à l'heure de départ."
        if train.longueur <= 0:
            return "La longueur du train doit être positive."
        if depot not in self.depots:
            return f"Dépôt {depot} inconnu."

        if ajouter_a_liste:
            self.trains.append(train)
        self.recalculer()
        return None

    def chercher_voie_disponible(self, train, ref, occupation, longueurs_voies):
        """
        Search for an available track for the train, respecting the safety margin.
        Returns (voie_idx, debut_placement) or (None, None) if impossible.
        - train: Train object
        - ref: reference datetime (usually arrival)
        - occupation: list of (track_idx, start, end, train) tuples
        - longueurs_voies: list of track lengths
        """
        occupation_par_voie = {i: [] for i in range(len(longueurs_voies))}
        for v, occ_debut, occ_fin, _ in occupation:
            occupation_par_voie[v].append((occ_debut, occ_fin))
        for voie, occs in occupation_par_voie.items():
            occupation_par_voie[voie] = sorted(occs, key=lambda x: x[0])

        meilleure_voie = None
        meilleur_debut = None
        for i, longueur in enumerate(longueurs_voies):
            if longueur < train.longueur:
                continue
            debut = ref
            for occ_debut, occ_fin in occupation_par_voie[i]:
                # Safety margin of 10 minutes before/after
                if debut - timedelta(minutes=self.delai_securite) < occ_fin and train.depart + timedelta(minutes=self.delai_securite) > occ_debut:
                    debut = occ_fin + timedelta(minutes=self.delai_securite)
            # Only place if the train can finish before its departure
            if debut < train.depart:
                if meilleur_debut is None or debut < meilleur_debut:
                    meilleure_voie = i
                    meilleur_debut = debut
        return meilleure_voie, meilleur_debut

    def reset(self):
        """
        Reset all depots and trains in the simulation.
        """
        for depot in self.depots.values():
            depot["occupation"].clear()
        self.trains.clear()

    def recalculer(self):
        """
        Recalculate all train placements in the simulation.
        Places trains one by one in chronological order.
        Updates train status (waiting, track assignment, etc.).
        """
        # Reset all depot occupations
        for depot in self.depots.values():
            depot["occupation"].clear()
        for train in self.trains:
            train.voie = None
            train.en_attente = False
            train.debut_attente = train.arrivee
            train.fin_attente = None

        # Sort all trains by arrival time (chronological)
        self.trains.sort(key=lambda t: t.arrivee)

        # Place trains one by one, in order of arrival
        for train in self.trains:
            depot = train.depot
            depot_data = self.depots[depot]
            occupation = depot_data["occupation"]
            numeros_voies = depot_data["numeros_voies"]
            longueurs_voies = depot_data["longueurs_voies"]

            voie_idx, debut_placement = self.chercher_voie_disponible(
                train, train.arrivee, occupation, longueurs_voies
            )
            if voie_idx is not None and debut_placement < train.depart:
                train.voie = numeros_voies[voie_idx]
                if debut_placement > train.arrivee:
                    train.en_attente = True
                    train.debut_attente = train.arrivee
                    train.fin_attente = debut_placement
                else:
                    train.en_attente = False
                    train.debut_attente = train.arrivee
                    train.fin_attente = debut_placement
                occupation.append((voie_idx, debut_placement, train.depart, train))
            else:
                train.voie = None
                train.en_attente = True
                train.debut_attente = train.arrivee
                train.fin_attente = None

    def undo(self):
        """
        Undo the last action (add, remove, or modify a train).
        Restores the previous state from the history.
        Returns None if successful, or an error message string.
        """
        if not self.historique:
            return "Aucune action à annuler."
        last = self.historique.pop()
        if last["action"] == "ajout":
            self.trains = [t for t in self.trains if t.id != last["train_id"]]
        elif last["action"] == "suppression":
            from copy import deepcopy
            train = Train(**{k: v for k, v in last["etat_avant"].items() if k in Train.__init__.__code__.co_varnames})
            for k, v in last["etat_avant"].items():
                setattr(train, k, v)
            self.trains.append(train)
        elif last["action"] == "modification":
            train = next((t for t in self.trains if t.id == last["train_id"]), None)
            if train:
                for k, v in last["etat_avant"].items():
                    setattr(train, k, v)
        self.recalculer()
        return None