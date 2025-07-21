# -*- coding: utf-8 -*-
# Copyright (c) 2025 André CABASSE 
# All rights reserved.
#
# This software is licensed under the MIT License.
# See the LICENSE file for details.
# Contact: andre.cabasse.massena@gmail.com
"""
Created on Wed Jun 25 13:24:29 2025

@author: andre
"""

"""
Business logic for the mini-game of track management (without Streamlit UI).
"""

def verifier_regles_wagons(elements):
    """
    Check the wagon chaining rules for a track.
    - There must always be a type 3 or 3a wagon adjacent to a type 4 wagon,
      except if the type 4 wagon is alone.
    - After a type 4 wagon, there must be a 2-3 or 3-2 sequence.
    Args:
        elements (list): List of elements (wagons/locomotives) on the track.
    Returns:
        bool: True if the rules are respected, False otherwise.
    """
    types = [e.get("type_wagon") for e in elements if e["type"] == "wagon"]
    n = len(types)
    for i, t_w in enumerate(types):
        if t_w == "4":
            # Allow if the type 4 wagon is alone
            if n == 1:
                continue
            voisin_gauche = types[i-1] if i > 0 else None
            voisin_droite = types[i+1] if i < n-1 else None
            # Must have a type 3 or 3a wagon adjacent
            if not (
                (voisin_gauche in ("3", "3a")) or
                (voisin_droite in ("3", "3a"))
            ):
                return False
            # After a type 4, must have a 2-3 or 3-2 sequence
            if i+2 < n:
                suite = types[i+1:i+3]
                if not (suite == ["2", "3"] or suite == ["3", "2"]):
                    return False
    return True

def ajouter_wagon(voies, voie, type_wagon, sens="left", longueur_max=300):
    """
    Add a wagon to a specific track, checking all chaining and length rules.
    Always adds to the left (start of the list).
    Args:
        voies (dict): Dictionary of tracks, each a list of elements.
        voie (int): Track number.
        type_wagon (str): Wagon type (e.g., "2", "3", "4", "2+3", etc.).
        sens (str): Direction ("left" by default).
        longueur_max (int): Maximum allowed length for the track.
    Returns:
        tuple: (success: bool, error_code: str or None)
    """
    elements = voies[voie]
    # Calculate total length (14 for wagon, 19 for locomotive)
    longueur_totale = sum(14 if e["type"] == "wagon" else 19 for e in elements)
    # Handle double wagons (e.g., "2+3")
    if type_wagon in ["2+3", "3+2", "2a+3a", "3a+2a"]:
        types = type_wagon.replace("a+", "a+").split("+")
        if longueur_totale + 28 > longueur_max:
            return False, "track_full"
        new_wagon1 = {
            "type": "wagon",
            "type_wagon": types[0],
            "sens": sens
        }
        new_wagon2 = {
            "type": "wagon",
            "type_wagon": types[1],
            "sens": sens
        }
        # Insert both wagons at the start (left)
        elements.insert(0, new_wagon2)
        elements.insert(0, new_wagon1)
    else:
        if longueur_totale + 14 > longueur_max:
            return False, "track_full"
        new_wagon = {
            "type": "wagon",
            "type_wagon": type_wagon,
            "sens": sens
        }
        elements.insert(0, new_wagon)
    # Check wagon chaining rules after insertion
    if not verifier_regles_wagons(elements):
        # Undo the addition if rules are not respected
        elements.pop(0)
        if type_wagon in ["2+3", "3+2", "2a+3a", "3a+2a"]:
            elements.pop(0)
        return False, "wagon_rule_error"
    return True, None

def ajouter_locomotive(voies, voie, direction="left"):
    """
    Add a locomotive to a specific track.
    Args:
        voies (dict): Dictionary of tracks.
        voie (int): Track number.
        direction (str): Direction ("left" by default).
    Returns:
        tuple: (success: bool, error_code: None)
    """
    # Generate a unique id (max existing id + 1)
    next_id = 1
    if voies[voie]:
        ids = [e.get("id", 0) for e in voies[voie] if "id" in e]
        if ids:
            next_id = max(ids) + 1
    voies[voie].insert(0, {
        "id": next_id,
        "type": "locomotive",
        "direction": direction
    })
    return True, None

def deplacer_wagon(voies, voie_source, wagon_idx, voie_cible):
    """
    Move a wagon from a source track to a target track.
    Only the leftmost or rightmost wagon can be moved.
    Args:
        voies (dict): Dictionary of tracks.
        voie_source (int): Source track number.
        wagon_idx (int): Index of the wagon to move.
        voie_cible (int): Target track number.
    Returns:
        tuple: (success: bool, error_code: str or None)
    """
    elements_source = voies[voie_source]
    if wagon_idx != 0 and wagon_idx != len(elements_source) - 1:
        return False, "only_move_end"
    wagon = elements_source.pop(wagon_idx)
    voies[voie_cible].append(wagon)
    return True, None

def supprimer_element(voies, voie, element_idx):
    """
    Remove a wagon or locomotive from one end of a track.
    Only the leftmost or rightmost element can be removed.
    Args:
        voies (dict): Dictionary of tracks.
        voie (int): Track number.
        element_idx (int): Index of the element to remove.
    Returns:
        tuple: (success: bool, error_code: str or None)
    """
    elements = voies[voie]
    if element_idx != 0 and element_idx != len(elements) - 1:
        return False, "not_leftmost_element"
    elements.pop(element_idx)
    return True, None

def reset_voies(voies_init=None):
    """
    Completely reset the state of all tracks.
    If an initial state is provided, resets all tracks to empty lists.
    Args:
        voies_init (dict or None): Initial track structure (keys as track numbers).
    Returns:
        dict: Dictionary of tracks, each as an empty list.
    """
    if voies_init is None:
        return {7: [], 8: [], 9: [], 11: []}
    return {k: [] for k in voies_init.keys()}