# -*- coding: utf-8 -*-
"""
Created on Wed Jun 25 09:41:09 2025

@author: andre
"""

from datetime import timedelta

def formater_horaire(horaire):
    """
    Formate un horaire datetime en chaîne lisible.
    """
    return horaire.strftime("%Y-%m-%d %H:%M")

def verifier_conflit(voie, debut, fin, occupation, delai_securite):
    """
    Vérifie s'il y a un conflit d'occupation sur une voie.
    """
    for v, occ_debut, occ_fin, _ in occupation:
        if v == voie and not (fin + timedelta(minutes=delai_securite) <= occ_debut or debut - timedelta(minutes=delai_securite) >= occ_fin):
            return True
    return False

def trouver_prochaine_disponibilite(voie, ref, occupation, delai_securite):
    """
    Trouve la prochaine disponibilité sur une voie.
    """
    occs = sorted([occ for occ in occupation if occ[0] == voie], key=lambda x: x[1])
    for occ in occs:
        if ref < occ[1]:
            return occ[1]
    return None

def convertir_minutes_en_hhmm(minutes):
    """
    Convertit des minutes en format HH:MM.
    """
    heures = minutes // 60
    mins = minutes % 60
    return f"{heures:02d}:{mins:02d}"