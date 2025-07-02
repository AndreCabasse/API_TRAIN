# -*- coding: utf-8 -*-
"""
Created on Wed Jun 25 09:41:09 2025

@author: andre
"""

from datetime import timedelta

def calculer_temps_attente(train):
    """
    Calcule le temps d'attente d'un train en minutes.
    """
    if train.en_attente and train.fin_attente is None:
        return None
    if train.fin_attente and train.debut_attente:
        return int((train.fin_attente - train.debut_attente).total_seconds() // 60)
    return 0

def calculer_temps_moyen_attente(trains):
    """
    Calcule le temps moyen d'attente pour une liste de trains.
    """
    temps = [calculer_temps_attente(t) for t in trains if calculer_temps_attente(t) is not None]
    if not temps:
        return 0
    return sum(temps) / len(temps)

def calculer_taux_occupation(occupation, numeros_voies):
    """
    Calcule le taux d'occupation des voies.
    """
    if not occupation or not numeros_voies:
        return 0
    duree_totale = 0
    for voie in numeros_voies:
        occs = [occ for occ in occupation if occ[0] == voie]
        for occ in occs:
            duree_totale += (occ[2] - occ[1]).total_seconds()
    return duree_totale

def calculer_statistiques_globales(simulation):
    """
    Calcule des statistiques globales sur la simulation.
    """
    stats = {}
    stats["total_trains"] = len(simulation.trains)
    stats["trains_electriques"] = sum(1 for t in simulation.trains if t.electrique)
    stats["temps_moyen_attente"] = calculer_temps_moyen_attente(simulation.trains)
    # Taux d'occupation global (en %)
    total_occupation = 0
    total_possible = 0
    for depot_name, depot in simulation.depots.items():
        occupation = depot["occupation"]
        numeros_voies = depot["numeros_voies"]
        longueurs_voies = depot["longueurs_voies"]
        # On suppose une journée de 24h pour chaque voie
        total_possible += len(numeros_voies) * 24 * 60  # en minutes
        for voie_idx, debut, fin, train in occupation:
            total_occupation += (fin - debut).total_seconds() / 60  # en minutes
    stats["taux_occupation_global"] = round(100 * total_occupation / total_possible, 1) if total_possible else 0

    # Statistiques par dépôt
    stats_par_depot = {}
    for depot_name, depot in simulation.depots.items():
        trains_depot = [t for t in simulation.trains if t.depot == depot_name]
        occupation = depot["occupation"]
        numeros_voies = depot["numeros_voies"]
        longueurs_voies = depot["longueurs_voies"]
        depot_possible = len(numeros_voies) * 24 * 60
        depot_occupation = 0
        for voie_idx, debut, fin, train in occupation:
            depot_occupation += (fin - debut).total_seconds() / 60
        taux_occupation = round(100 * depot_occupation / depot_possible, 1) if depot_possible else 0
        stats_par_depot[depot_name] = {
            "nb_trains": len(trains_depot),
            "taux_occupation": taux_occupation
        }
    stats["stats_par_depot"] = stats_par_depot
    return stats

def calculer_requirements(trains):
    """
    Calcule les besoins en ressources pour les trains.
    """
    requirements = {}
    for train in trains:
        jour = train.arrivee.date()
        requirements.setdefault(jour, 0)
        requirements[jour] += 1
    return requirements

def regrouper_requirements_par_jour(trains):
    """
    Regroupe les requirements par jour.
    """
    reqs = {}
    for train in trains:
        jour = train.arrivee.date()
        reqs.setdefault(jour, []).append(train)
    return reqs