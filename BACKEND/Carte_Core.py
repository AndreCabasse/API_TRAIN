# -*- coding: utf-8 -*-
"""
Created on Wed Jun 25 13:26:55 2025

@author: andre
"""

"""
Logique métier pour la gestion des données géographiques des dépôts et de la carte.
"""

import pandas as pd

def get_depots_dataframe(simulation):
    depots = []
    for nom, conf in simulation.depots.items():
        depots.append({
            "Depot": nom,
            "lat": conf.get("lat"),
            "lon": conf.get("lon"),
        })
    return pd.DataFrame(depots)

def get_depots_list(simulation):
    """
    Retourne une liste de dépôts avec coordonnées valides (pour API/JSON).
    """
    depots = []
    for nom, conf in simulation.depots.items():
        lat = conf.get("lat")
        lon = conf.get("lon")
        if lat is not None and lon is not None:
            depots.append({
                "depot": nom,
                "lat": lat,
                "lon": lon,
            })
    return depots

def get_depot_center(depots):
    """
    Calcule le centre géographique (moyenne lat/lon) d'une liste de dépôts.
    """
    if not depots:
        return None, None
    lat_centre = sum(d["lat"] for d in depots) / len(depots)
    lon_centre = sum(d["lon"] for d in depots) / len(depots)
    return lat_centre, lon_centre