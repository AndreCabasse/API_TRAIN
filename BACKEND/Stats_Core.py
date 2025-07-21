# -*- coding: utf-8 -*-
# Copyright (c) 2025 André CABASSE 
# All rights reserved.
#
# This software is licensed under the MIT License.
# See the LICENSE file for details.
# Contact: andre.cabasse.massena@gmail.com
"""
Created on Wed Jun 25 09:41:09 2025

@author: andre
"""

from datetime import timedelta

def calculer_temps_attente(train):
    """
    Compute the waiting time for a train in minutes.
    Returns None if the train is still waiting and has no end time.
    Returns 0 if there was no waiting.
    """
    if train.en_attente and train.fin_attente is None:
        return None
    if train.fin_attente and train.debut_attente:
        return int((train.fin_attente - train.debut_attente).total_seconds() // 60)
    return 0

def calculer_temps_moyen_attente(trains):
    """
    Compute the average waiting time for a list of trains.
    Ignores trains with undefined waiting time.
    Returns 0 if no valid waiting times are found.
    """
    temps = [calculer_temps_attente(t) for t in trains if calculer_temps_attente(t) is not None]
    if not temps:
        return 0
    return sum(temps) / len(temps)

def calculer_taux_occupation(occupation, numeros_voies):
    """
    Compute the total occupation time (in seconds) for all tracks.
    Returns 0 if there is no occupation or no tracks.
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
    Compute global statistics for the simulation.
    Returns a dictionary with:
      - total_trains: total number of trains
      - trains_electriques: number of electric trains
      - temps_moyen_attente: average waiting time
      - taux_occupation_global: global occupation rate (%)
      - stats_par_depot: statistics per depot (number of trains, occupation rate)
    """
    stats = {}
    stats["total_trains"] = len(simulation.trains)
    stats["trains_electriques"] = sum(1 for t in simulation.trains if t.electrique)
    stats["temps_moyen_attente"] = calculer_temps_moyen_attente(simulation.trains)
    # Compute global occupation rate (as a percentage)
    total_occupation = 0
    total_possible = 0
    for depot_name, depot in simulation.depots.items():
        occupation = depot["occupation"]
        numeros_voies = depot["numeros_voies"]
        longueurs_voies = depot["longueurs_voies"]
        # Assume a 24-hour day for each track (in minutes)
        total_possible += len(numeros_voies) * 24 * 60
        for voie_idx, debut, fin, train in occupation:
            total_occupation += (fin - debut).total_seconds() / 60
    stats["taux_occupation_global"] = round(100 * total_occupation / total_possible, 1) if total_possible else 0

    # Compute statistics per depot
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
    Compute resource requirements for trains, grouped by day.
    Returns a dictionary: {date: count}
    """
    requirements = {}
    for train in trains:
        jour = train.arrivee.date()
        requirements.setdefault(jour, 0)
        requirements[jour] += 1
    return requirements

def regrouper_requirements_par_jour(trains):
    """
    Group requirements by day.
    Returns a dictionary: {date: list of trains}
    """
    reqs = {}
    for train in trains:
        jour = train.arrivee.date()
        reqs.setdefault(jour, []).append(train)
    return reqs