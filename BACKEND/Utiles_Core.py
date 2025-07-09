# -*- coding: utf-8 -*-
"""
Created on Wed Jun 25 09:41:09 2025

@author: andre
"""

from datetime import timedelta

def formater_horaire(horaire):
    """
    Format a datetime object into a readable string.
    Example: 2025-07-09 14:30
    Args:
        horaire (datetime): The datetime to format.
    Returns:
        str: Formatted date and time string.
    """
    return horaire.strftime("%Y-%m-%d %H:%M")

def verifier_conflit(voie, debut, fin, occupation, delai_securite):
    """
    Check if there is a conflict for a given track (voie) between debut and fin.
    Takes into account a safety margin (delai_securite) in minutes.
    Args:
        voie (int): Track number.
        debut (datetime): Proposed start time.
        fin (datetime): Proposed end time.
        occupation (list): List of (voie, occ_debut, occ_fin, train) tuples.
        delai_securite (int): Safety margin in minutes.
    Returns:
        bool: True if there is a conflict, False otherwise.
    """
    for v, occ_debut, occ_fin, _ in occupation:
        # Check for overlap, considering safety margin before and after
        if v == voie and not (fin + timedelta(minutes=delai_securite) <= occ_debut or debut - timedelta(minutes=delai_securite) >= occ_fin):
            return True
    return False

def trouver_prochaine_disponibilite(voie, ref, occupation, delai_securite):
    """
    Find the next available time on a track after a reference time.
    Args:
        voie (int): Track number.
        ref (datetime): Reference time.
        occupation (list): List of (voie, occ_debut, occ_fin, train) tuples.
        delai_securite (int): Safety margin in minutes.
    Returns:
        datetime or None: The next available time, or None if not found.
    """
    occs = sorted([occ for occ in occupation if occ[0] == voie], key=lambda x: x[1])
    for occ in occs:
        if ref < occ[1]:
            return occ[1]
    return None

def convertir_minutes_en_hhmm(minutes):
    """
    Convert a number of minutes into HH:MM string format.
    Args:
        minutes (int): Number of minutes.
    Returns:
        str: Time in HH:MM format.
    """
    heures = minutes // 60
    mins = minutes % 60
    return f"{heures:02d}:{mins:02d}"