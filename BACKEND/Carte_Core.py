# -*- coding: utf-8 -*-
"""
Created on Wed Jun 25 13:26:55 2025

@author: andre
"""

"""
Business logic for handling geographic data of depots and the map.
"""

import pandas as pd

def get_depots_dataframe(simulation):
    """
    Build a pandas DataFrame containing all depots from the simulation.
    Each row contains the depot name and its latitude/longitude.
    - simulation: an object with a .depots attribute (dict of depot configs)
    Returns: pd.DataFrame with columns ["Depot", "lat", "lon"]
    """
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
    Return a list of depots with valid coordinates (for API/JSON output).
    Only depots with both latitude and longitude defined are included.
    - simulation: an object with a .depots attribute (dict of depot configs)
    Returns: list of dicts, each with keys: depot, lat, lon
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
    Compute the geographic center (mean latitude and longitude) of a list of depots.
    - depots: list of dicts, each with "lat" and "lon" keys
    Returns: tuple (lat_center, lon_center) or (None, None) if list is empty
    """
    if not depots:
        return None, None
    lat_centre = sum(d["lat"] for d in depots) / len(depots)
    lon_centre = sum(d["lon"] for d in depots) / len(depots)
    return lat_centre, lon_centre