# -*- coding: utf-8 -*-
"""
Created on Wed Jun 25 13:24:29 2025

@author: andre
"""

"""
Logique métier du mini-jeu de gestion des voies (sans Streamlit).
"""

def verifier_regles_wagons(elements):
    """
    Vérifie les règles d'enchaînement des wagons sur une voie.
    - Il doit toujours y avoir un wagon type 3 ou 3a adjacent à un wagon type 4,
      sauf si le wagon 4 est seul.
    - Après un wagon type 4, il doit y avoir un enchaînement 2-3 ou 3-2.
    """
    types = [e.get("type_wagon") for e in elements if e["type"] == "wagon"]
    n = len(types)
    for i, t_w in enumerate(types):
        if t_w == "4":
            # Autoriser si le wagon 4 est seul
            if n == 1:
                continue
            voisin_gauche = types[i-1] if i > 0 else None
            voisin_droite = types[i+1] if i < n-1 else None
            if not (
                (voisin_gauche in ("3", "3a")) or
                (voisin_droite in ("3", "3a"))
            ):
                return False
            if i+2 < n:
                suite = types[i+1:i+3]
                if not (suite == ["2", "3"] or suite == ["3", "2"]):
                    return False
    return True

def ajouter_wagon(voies, voie, type_wagon, sens="left", longueur_max=300):
    """
    Ajoute un wagon à une voie spécifique avec vérification des règles.
    L'ajout se fait toujours à gauche (début de la liste).
    """
    elements = voies[voie]
    longueur_totale = sum(14 if e["type"] == "wagon" else 19 for e in elements)
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
    if not verifier_regles_wagons(elements):
        # Annule l'ajout
        elements.pop(0)
        if type_wagon in ["2+3", "3+2", "2a+3a", "3a+2a"]:
            elements.pop(0)
        return False, "wagon_rule_error"
    return True, None

def ajouter_locomotive(voies, voie, direction="left"):
    """
    Ajoute une locomotive à une voie spécifique.
    """
    # Générer un id unique (par exemple, max id existant + 1)
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
    Déplace un wagon d'une voie source à une voie cible.
    Seul le wagon à l'extrémité gauche ou droite peut être déplacé.
    """
    elements_source = voies[voie_source]
    if wagon_idx != 0 and wagon_idx != len(elements_source) - 1:
        return False, "only_move_end"
    wagon = elements_source.pop(wagon_idx)
    voies[voie_cible].append(wagon)
    return True, None

def supprimer_element(voies, voie, element_idx):
    """
    Supprime un wagon à une extrémité d'une voie.
    """
    elements = voies[voie]
    if element_idx != 0 and element_idx != len(elements) - 1:
        return False, "not_leftmost_element"
    elements.pop(element_idx)
    return True, None

def reset_voies(voies_init=None):
    """
    Réinitialise complètement l'état des voies.
    """
    if voies_init is None:
        return {7: [], 8: [], 9: [], 11: []}
    return {k: [] for k in voies_init.keys()}