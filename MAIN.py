# -*- coding: utf-8 -*-
"""
Created on Wed Jun 25 09:51:02 2025

@author: andre
"""

from fastapi import FastAPI, HTTPException, UploadFile, Body, File, Request
from fastapi.responses import Response 
from fastapi.middleware.cors import CORSMiddleware
from BACKEND.Simulation_Core import Simulation, Train
from BACKEND.Carte_Core import get_depots_list, get_depot_center
from BACKEND.Stats_Core import calculer_statistiques_globales, calculer_requirements, regrouper_requirements_par_jour
from BACKEND.Plots_Core import get_gantt_data, get_track_occupation_at_instant, get_train_length_detail
from BACKEND.Jeu_Core import verifier_regles_wagons, ajouter_wagon, ajouter_locomotive, deplacer_wagon, supprimer_element, reset_voies
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional
import pandas as pd
from io import BytesIO
from zoneinfo import ZoneInfo
from BACKEND import auth


app = FastAPI(title="Train Depot Simulation API", version="1.0.0")

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",
        "http://localhost:3000",
        "https://web-production-76c6f.up.railway.app",
        "https://web-production-1e33b.up.railway.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
    expose_headers=["*", "Authorization", "Content-Type"],
)

# Handler global pour toutes les requêtes OPTIONS (préflight CORS)
from fastapi import Request
from fastapi.responses import Response

# Ce handler répond à toutes les requêtes OPTIONS pour le CORS (préflight)
@app.options("/{rest_of_path:path}")
async def preflight_handler(rest_of_path: str, request: Request):
    # Ajoute les bons headers CORS pour la réponse préflight
    headers = {
        "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": request.headers.get("access-control-request-headers", "*"),
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Expose-Headers": "*, Authorization, Content-Type"
    }
    return Response(status_code=200, headers=headers)

app.include_router(auth.router)

simulation = Simulation()

class TrainIn(BaseModel):
    nom: str
    wagons: int
    locomotives: int
    arrivee: datetime
    depart: datetime
    depot: str
    type: str = "storage"
    electrique: bool = False
    locomotive_cote: Optional[str] = "left"

# ===== ENDPOINTS TRAINS =====
@app.get("/trains")
def get_trains():
    return [vars(train) for train in simulation.trains]

train_id_counter = 0

@app.post("/trains")
def add_train(train: TrainIn):
    global train_id_counter
    arrivee = train.arrivee
    depart = train.depart

    # Conversion explicite en Europe/Copenhagen
    cph = ZoneInfo("Europe/Copenhagen")
    if arrivee.tzinfo is None:
        raise HTTPException(status_code=400, detail="Datetime must include timezone (Z or +00:00)")
    arrivee = arrivee.astimezone(cph)
    if depart.tzinfo is None:
        raise HTTPException(status_code=400, detail="Datetime must include timezone (Z or +00:00)")
    depart = depart.astimezone(cph)
    
    # Vérification de chevauchement pour le même nom de train
    for t in simulation.trains:
        if t.nom == train.nom:
            # Si les périodes se chevauchent
            if not (depart <= t.arrivee or arrivee >= t.depart):
                raise HTTPException(
                    status_code=400,
                    detail=f"Train '{train.nom}' is already scheduled from {t.arrivee} to {t.depart} at {t.depot}."
                )

    t_obj = Train(
        id=train_id_counter,
        nom=train.nom,
        wagons=train.wagons,
        locomotives=train.locomotives,
        arrivee=arrivee,
        depart=depart,
        depot=train.depot,
        type=train.type,
        electrique=train.electrique,
        locomotive_cote=train.locomotive_cote
    )
    train_id_counter += 1
    erreur = simulation.ajouter_train(t_obj, t_obj.depot)
    if erreur:
        raise HTTPException(status_code=400, detail=erreur)
    return vars(t_obj)

@app.put("/trains/{train_id}")
def update_train(train_id: int, train: TrainIn):
    # Trouve le train existant
    existing_train = next((t for t in simulation.trains if t.id == train_id), None)
    if not existing_train:
        raise HTTPException(status_code=404, detail="Train not found")
    
    # Met à jour les propriétés
    existing_train.nom = train.nom
    existing_train.wagons = train.wagons
    existing_train.locomotives = train.locomotives
    existing_train.arrivee = train.arrivee
    existing_train.depart = train.depart
    existing_train.depot = train.depot
    existing_train.type = train.type
    existing_train.electrique = train.electrique
    existing_train.locomotive_cote = train.locomotive_cote
    existing_train.longueur = existing_train.calculer_longueur()
    
    # Recalcule la simulation
    simulation.recalculer()
    return vars(existing_train)

@app.delete("/trains/{train_id}")
def delete_train(train_id: int):
    simulation.trains = [t for t in simulation.trains if t.id != train_id]
    simulation.recalculer()
    return {"ok": True}

# ===== ENDPOINTS DEPOTS =====
@app.get("/depots")
def get_depots():
    return get_depots_list(simulation)

@app.get("/depots/{depot_name}")
def get_depot_info(depot_name: str):
    if depot_name not in simulation.depots:
        raise HTTPException(status_code=404, detail="Depot not found")
    
    depot_data = simulation.depots[depot_name]
    trains_depot = [vars(t) for t in simulation.trains if t.depot == depot_name]
    
    return {
        "name": depot_name,
        "numeros_voies": depot_data["numeros_voies"],
        "longueurs_voies": depot_data["longueurs_voies"],
        "nb_voies": len(depot_data["numeros_voies"]),  # <-- Ajouté ici
        "trains": trains_depot,
        "lat": depot_data.get("lat"),
        "lon": depot_data.get("lon")
    }

@app.get("/gantt-train/{train_id}")
def gantt_train(train_id: int):
    # Cherche le train
    train = next((t for t in simulation.trains if t.id == train_id), None)
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")
    # Cherche toutes les occupations de ce train dans tous les dépôts
    result = []
    for depot_name, depot in simulation.depots.items():
        for voie_idx, debut, fin, t in depot["occupation"]:
            if getattr(t, "id", None) == train_id:
                result.append({
                    "depot": depot_name,
                    "voie": depot["numeros_voies"][voie_idx] if voie_idx < len(depot["numeros_voies"]) else voie_idx,
                    "debut": debut.isoformat(),
                    "fin": fin.isoformat(),
                })
    # Ajoute éventuellement la période d’attente si le train a été en attente
    if train.en_attente and train.debut_attente and train.fin_attente:
        result.append({
            "depot": train.depot,
            "voie": None,
            "debut": train.debut_attente.isoformat(),
            "fin": train.fin_attente.isoformat(),
            "waiting": True
        })
    return result

@app.get("/gantt-all-trains")
def gantt_all_trains():
    result = []
    for train in simulation.trains:
        # Occupe-t-il une voie ?
        found = False
        for depot_name, depot in simulation.depots.items():
            for voie_idx, debut, fin, t in depot["occupation"]:
                if getattr(t, "id", None) == train.id:
                    result.append({
                        "train_id": train.id,
                        "train_nom": train.nom,
                        "depot": depot_name,
                        "voie": depot["numeros_voies"][voie_idx] if voie_idx < len(depot["numeros_voies"]) else voie_idx,
                        "debut": debut.isoformat(),
                        "fin": fin.isoformat(),
                        "type": train.type,
                        "electrique": train.electrique,
                    })
                    found = True
        # Si jamais il a été en attente
        if train.en_attente and train.debut_attente and train.fin_attente:
            result.append({
                "train_id": train.id,
                "train_nom": train.nom,
                "depot": train.depot,
                "voie": None,
                "debut": train.debut_attente.isoformat(),
                "fin": train.fin_attente.isoformat(),
                "type": train.type,
                "electrique": train.electrique,
                "waiting": True
            })
    return result

@app.get("/requirements")
def get_requirements():
    """
    Retourne les besoins en ressources par jour pour affichage frontend,
    avec la liste des dépôts concernés pour conducteurs d'essai et locomotives.
    """
    requirements_par_jour = regrouper_requirements_par_jour(simulation.trains)
    result = []
    for jour, trains in sorted(requirements_par_jour.items()):
        test_drivers = sum(1 for t in trains if t.type == "testing")
        locomotives = sum(t.locomotives for t in trains)
        # Liste des dépôts où il y a au moins un train de test ou une loco
        depots_test_drivers = sorted(set(t.depot for t in trains if t.type == "testing"))
        depots_locomotives = sorted(set(t.depot for t in trains if t.locomotives > 0))
        result.append({
            "date": str(jour),
            "test_drivers": test_drivers,
            "locomotives": locomotives,
            "depots_test_drivers": depots_test_drivers,
            "depots_locomotives": depots_locomotives,
        })
    return result

@app.get("/depots/{depot_name}/occupancy")
def get_depot_occupancy(depot_name: str):
    if depot_name not in simulation.depots:
        raise HTTPException(status_code=404, detail="Depot not found")
    
    occupation = simulation.depots[depot_name]["occupation"]
    numeros_voies = simulation.depots[depot_name]["numeros_voies"]
    
    occupancy_data = []
    for voie_idx, debut, fin, train in occupation:
        occupancy_data.append({
            "voie": numeros_voies[voie_idx] if voie_idx < len(numeros_voies) else voie_idx,
            "debut": debut.isoformat(),
            "fin": fin.isoformat(),
            "train": vars(train)
        })
    
    return occupancy_data

# ===== ENDPOINTS STATISTIQUES =====
@app.get("/statistics")
def get_statistics():
    return calculer_statistiques_globales(simulation)

# ===== ENDPOINTS GANTT ET VISUALISATIONS =====
@app.get("/gantt/{depot_name}")
def get_gantt(depot_name: str):
    if depot_name not in simulation.depots:
        raise HTTPException(status_code=404, detail="Depot not found")
    
    return get_gantt_data(simulation, depot_name)

@app.get("/occupation/{depot_name}")
def get_occupation_instant(depot_name: str, instant: str):
    try:
        instant_dt = datetime.fromisoformat(instant.replace('Z', '+00:00'))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid datetime format")
    
    return get_track_occupation_at_instant(simulation, instant_dt, depot_name)

@app.get("/train-details/{depot_name}")
def get_train_details_instant(depot_name: str, instant: str):
    try:
        instant_dt = datetime.fromisoformat(instant.replace('Z', '+00:00'))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid datetime format")
    
    return get_train_length_detail(simulation, instant_dt, depot_name)

# ===== ENDPOINTS MINI-JEU =====
class WagonAction(BaseModel):
    voie: int
    type_wagon: str
    sens: str = "left"

class MoveAction(BaseModel):
    voie_source: int
    wagon_idx: int
    voie_cible: int

class DeleteAction(BaseModel):
    voie: int
    element_idx: int

# État du jeu en mémoire (à adapter selon tes besoins)
game_state = {7: [], 8: [], 9: [], 11: []}

@app.get("/game/state")
def get_game_state():
    return game_state

@app.post("/game/add-wagon")
def add_wagon_to_game(action: WagonAction):
    success, error = ajouter_wagon(game_state, action.voie, action.type_wagon, action.sens)
    if not success:
        raise HTTPException(status_code=400, detail=error)
    return {"success": True, "state": game_state}

@app.post("/game/add-locomotive")
def add_locomotive_to_game(voie: int, direction: str = "left"):
    success, error = ajouter_locomotive(game_state, voie, direction)
    if not success:
        raise HTTPException(status_code=400, detail=error)
    return {"success": True, "state": game_state}

@app.post("/game/move-wagon")
def move_wagon_in_game(action: MoveAction):
    success, error = deplacer_wagon(game_state, action.voie_source, action.wagon_idx, action.voie_cible)
    if not success:
        raise HTTPException(status_code=400, detail=error)
    return {"success": True, "state": game_state}

@app.post("/game/swap-wagon")
def swap_wagon(trackNumber: int = Body(...), elementIndex: int = Body(...), direction: str = Body(...)):
    # Supposons que game_state est un dict {voie: [elements]}
    elements = game_state[trackNumber]
    if direction == "left" and elementIndex > 0:
        elements[elementIndex - 1], elements[elementIndex] = elements[elementIndex], elements[elementIndex - 1]
    elif direction == "right" and elementIndex < len(elements) - 1:
        elements[elementIndex + 1], elements[elementIndex] = elements[elementIndex], elements[elementIndex + 1]
    else:
        return {"success": False, "detail": "Déplacement impossible"}
    return {"success": True, "state": game_state}

@app.post("/game/delete-element")
def delete_element_from_game(action: DeleteAction):
    success, error = supprimer_element(game_state, action.voie, action.element_idx)
    if not success:
        raise HTTPException(status_code=400, detail=error)
    return {"success": True, "state": game_state}

@app.post("/game/reset")
def reset_game():
    global game_state
    game_state = reset_voies()
    return {"success": True, "state": game_state}

train_id_counter = 0
@app.post("/import-trains-excel")
async def import_trains_excel(file: UploadFile = File(...)):
    print("Fichier reçu :", file.filename)  # Ajoute ceci pour debug
    global train_id_counter
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(status_code=400, detail="Format de fichier non supporté")
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(BytesIO(await file.read()), sep=None, engine='python')
        else:
            df = pd.read_excel(BytesIO(await file.read()))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur de lecture du fichier : {e}")
        


    # Mapping des colonnes
    col_map = {
        "Nom": "nom",
        "Nombre de wagons": "wagons",
        "Nombre de locomotives": "locomotives",
        "Heure d'arrivée": "arrivee",
        "Heure de départ": "depart",
        "Dépôt": "depot",
        "Type de train": "type",
        "Électrique": "electrique",
        "Côté sans locomotive": "locomotive_cote"
    }
    df = df.rename(columns=col_map)

    # Nettoyage et conversion
    imported = []
    errors = []
    for idx, row in df.iterrows():
        try:
            # Conversion des dates
            arrivee = pd.to_datetime(row['arrivee'], dayfirst=True)
            depart = pd.to_datetime(row['depart'], dayfirst=True)
            # Ajoute le fuseau Europe/Copenhagen
            cph = ZoneInfo("Europe/Copenhagen")
            if arrivee.tzinfo is None:
                arrivee = arrivee.tz_localize(cph)
            if depart.tzinfo is None:
                depart = depart.tz_localize(cph)
            
            # Si tu veux des objets datetime Python
            arrivee = arrivee.to_pydatetime()
            depart = depart.to_pydatetime()
            # Conversion booléen
            electrique = str(row.get('electrique', '')).strip().upper() == "TRUE"
            # Côté loco
            loco_cote = row.get('locomotive_cote') or "left"
            # Type
            train_type = str(row.get('type', 'storage')).lower()
            # Création du train
            t_obj = Train(
                id=train_id_counter,
                nom=row['nom'],
                wagons=int(row['wagons']),
                locomotives=int(row['locomotives']),
                arrivee=arrivee,
                depart=depart,
                depot=row['depot'],
                type=train_type,
                electrique=electrique,
                locomotive_cote=loco_cote if loco_cote in ("left", "right") else "left"
            )
            # Ajout dans la simulation
            train_id_counter += 1
            erreur = simulation.ajouter_train(t_obj, t_obj.depot)
            if erreur:
                errors.append(f"Ligne {idx+2} ({row['nom']}): {erreur}")
            else:
                imported.append(row['nom'])
        except Exception as e:
            errors.append(f"Ligne {idx+2}: {e}")

    return {
        "imported": imported,
        "errors": errors
    }

# ===== ENDPOINTS SIMULATION =====
@app.post("/reset")
def reset_simulation():
    simulation.reset()
    return {"ok": True}

@app.post("/game/move-wagon")
def move_wagon_in_game(action: MoveAction):
    success, error = deplacer_wagon(game_state, action.voie_source, action.wagon_idx, action.voie_cible)
    if not success:
        if error == "only_move_end":
            raise HTTPException(status_code=400, detail="Seuls les wagons à une extrémité peuvent être déplacés.")
        else:
            raise HTTPException(status_code=400, detail=error or "Erreur lors du déplacement du wagon.")
    return {"success": True, "state": game_state}

@app.post("/recalculate")
def recalculate_simulation():
    simulation.recalculer()
    return {"ok": True}

@app.get("/")
def root():
    return {"message": "Train Depot Simulation API", "version": "1.0.0"}

