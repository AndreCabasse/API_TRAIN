# -*- coding: utf-8 -*-
"""
Created on Wed Jun 25 13:13:15 2025

@author: andre
"""

from datetime import datetime

def get_gantt_data(simulation, depot):
    """
    Retourne les données nécessaires pour un diagramme de Gantt pour un dépôt donné.
    Chaque entrée contient : train_id, train_nom, voie, debut, fin, type, electrique, longueur.
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
            "longueur": getattr(train, "longueur", None),  # <-- Ajout ici
        })
    return result

def get_track_occupation_at_instant(simulation, instant, depot=None):
    """
    Retourne la liste des trains présents sur chaque voie à un instant donné.
    Si depot est None, retourne pour tous les dépôts.
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
    Retourne la composition détaillée (locomotives, wagons) de chaque train présent à un instant donné.
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
                # Locomotive(s) et wagons
                if getattr(train, "locomotives", 0) == 1:
                    if getattr(train, "locomotive_cote", None) == "left":
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
                    else:
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
    Transforme les requirements par jour en liste de dicts pour affichage frontend.
    """
    data = []
    for jour, besoins in sorted(requirements_par_jour.items()):
        data.append({
            "date": str(jour),
            "test_drivers": besoins.get("test_drivers", 0),
            "locomotives": besoins.get("locomotives", 0)
        })
    return data