# -*- coding: utf-8 -*-
# Copyright (c) 2025 André CABASSE 
# All rights reserved.
#
# This software is licensed under the MIT License.
# See the LICENSE file for details.
# Contact: andre.cabasse.massena@gmail.com
"""
Created on Wed Jun 25 13:13:15 2025

@author: andre
"""

from datetime import datetime

def get_gantt_data(simulation, depot):
    """
    Return the data needed for a Gantt chart for a given depot.
    Each entry contains: train_id, train_nom, voie, debut, fin, type, electrique, longueur.
    - simulation: simulation object with .depots attribute
    - depot: depot name (string)
    Returns: list of dicts, one per train occupation interval
    """
    depot_data = simulation.depots.get(depot)
    if not depot_data or "occupation" not in depot_data:
        return []

    result = []
    numeros_voies = depot_data.get("numeros_voies", [])
    for voie_idx, debut, fin, train in depot_data["occupation"]:
        result.append({
            "train_id": getattr(train, "id", None),
            "train_nom": getattr(train, "nom", None),
            "voie": numeros_voies[voie_idx] if voie_idx < len(numeros_voies) else voie_idx,
            "debut": debut.isoformat() if isinstance(debut, datetime) else str(debut),
            "fin": fin.isoformat() if isinstance(fin, datetime) else str(fin),
            "type": getattr(train, "type", None),
            "electrique": getattr(train, "electrique", False),
            "longueur": getattr(train, "longueur", None),  # Train length
        })
    return result

def get_track_occupation_at_instant(simulation, instant, depot=None):
    """
    Return the list of trains present on each track at a given instant.
    If depot is None, returns for all depots.
    - simulation: simulation object with .depots attribute
    - instant: datetime to check occupation
    - depot: depot name (optional)
    Returns: list of dicts, one per train present at the instant
    """
    results = []
    depots_to_show = []
    if depot is not None:
        if depot in simulation.depots:
            depots_to_show = [(depot, simulation.depots[depot]["occupation"], simulation.depots[depot]["numeros_voies"])]
    else:
        depots_to_show = [
            (d, simulation.depots[d]["occupation"], simulation.depots[d]["numeros_voies"])
            for d in simulation.depots
        ]

    for depot_name, occupation, numeros_voies in depots_to_show:
        for voie_idx, debut, fin, train in occupation:
            if debut <= instant <= fin:
                results.append({
                    "depot": depot_name,
                    "voie": numeros_voies[voie_idx] if voie_idx < len(numeros_voies) else voie_idx,
                    "train_id": getattr(train, "id", None),
                    "train_nom": getattr(train, "nom", None),
                    "type": getattr(train, "type", None),
                    "electrique": getattr(train, "electrique", False),
                    "debut": debut.isoformat() if isinstance(debut, datetime) else str(debut),
                    "fin": fin.isoformat() if isinstance(fin, datetime) else str(fin),
                    "wagons": getattr(train, "wagons", 0),
                    "locomotives": getattr(train, "locomotives", 0),
                })
    return results

def get_train_length_detail(simulation, instant, depot=None):
    """
    Return the detailed composition (locomotives, wagons) of each train present at a given instant.
    - simulation: simulation object with .depots attribute
    - instant: datetime to check occupation
    - depot: depot name (optional)
    Returns: list of dicts, each describing a train element (locomotive or wagon)
    """
    details = []
    depots_to_show = []
    if depot is not None:
        if depot in simulation.depots:
            depots_to_show = [(depot, simulation.depots[depot]["occupation"], simulation.depots[depot]["numeros_voies"])]
    else:
        depots_to_show = [
            (d, simulation.depots[d]["occupation"], simulation.depots[d]["numeros_voies"])
            for d in simulation.depots
        ]

    for depot_name, occupation, numeros_voies in depots_to_show:
        for voie_idx, debut, fin, train in occupation:
            if debut <= instant <= fin:
                voie_label = f"{numeros_voies[voie_idx]} ({depot_name})"
                position_actuelle = 0
                # If there is one locomotive, check its side
                if getattr(train, "locomotives", 0) == 1:
                    if getattr(train, "locomotive_cote", None) == "left":
                        # Locomotive at the left
                        details.append({
                            "train_id": train.id,
                            "train_nom": train.nom,
                            "voie": voie_label,
                            "element": "locomotive",
                            "numero": 1,
                            "position": position_actuelle,
                            "longueur": 19
                        })
                        position_actuelle += 19
                        # Add wagons after the locomotive
                        for i in range(train.wagons):
                            details.append({
                                "train_id": train.id,
                                "train_nom": train.nom,
                                "voie": voie_label,
                                "element": "wagon",
                                "numero": i + 1,
                                "position": position_actuelle,
                                "longueur": 14
                            })
                            position_actuelle += 14
                    else:
                        # Locomotive at the right
                        for i in range(train.wagons):
                            details.append({
                                "train_id": train.id,
                                "train_nom": train.nom,
                                "voie": voie_label,
                                "element": "wagon",
                                "numero": i + 1,
                                "position": position_actuelle,
                                "longueur": 14
                            })
                            position_actuelle += 14
                        details.append({
                            "train_id": train.id,
                            "train_nom": train.nom,
                            "voie": voie_label,
                            "element": "locomotive",
                            "numero": 1,
                            "position": position_actuelle,
                            "longueur": 19
                        })
                        position_actuelle += 19
                elif getattr(train, "locomotives", 0) == 2:
                    # Two locomotives: one at each end
                    details.append({
                        "train_id": train.id,
                        "train_nom": train.nom,
                        "voie": voie_label,
                        "element": "locomotive",
                        "numero": 1,
                        "position": position_actuelle,
                        "longueur": 19
                    })
                    position_actuelle += 19
                    for i in range(train.wagons):
                        details.append({
                            "train_id": train.id,
                            "train_nom": train.nom,
                            "voie": voie_label,
                            "element": "wagon",
                            "numero": i + 1,
                            "position": position_actuelle,
                            "longueur": 14
                        })
                        position_actuelle += 14
                    details.append({
                        "train_id": train.id,
                        "train_nom": train.nom,
                        "voie": voie_label,
                        "element": "locomotive",
                        "numero": 2,
                        "position": position_actuelle,
                        "longueur": 19
                    })
                    position_actuelle += 19
                elif getattr(train, "locomotives", 0) == 0:
                    # No locomotive, only wagons
                    for i in range(train.wagons):
                        details.append({
                            "train_id": train.id,
                            "train_nom": train.nom,
                            "voie": voie_label,
                            "element": "wagon",
                            "numero": i + 1,
                            "position": position_actuelle,
                            "longueur": 14
                        })
                        position_actuelle += 14
    return details

def get_requirements_by_day(requirements_par_jour):
    """
    Transform the requirements by day into a list of dicts for frontend display.
    - requirements_par_jour: dict with day as key and requirements as value
    Returns: list of dicts with date, test_drivers, and locomotives
    """
    data = []
    for jour, besoins in sorted(requirements_par_jour.items()):
        data.append({
            "date": str(jour),
            "test_drivers": besoins.get("test_drivers", 0),
            "locomotives": besoins.get("locomotives", 0)
        })
    return data