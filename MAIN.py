# -*- coding: utf-8 -*-
"""
Train Depot Simulation API - Main FastAPI Application

This is the main API server for the train depot simulation system.
It provides endpoints for managing trains, depots, scheduling optimization,
statistics, visualizations, and a mini-game for train composition.

Created on Wed Jun 25 09:51:02 2025
@author: andre
"""
print(">>> MAIN.PY CHARGÉ <<<")
# Core FastAPI imports for buil    # Add waiting period if the train was placed in a waiting queueing the REST API
from fastapi import FastAPI, HTTPException, UploadFile, Body, File, Request
from fastapi.responses import Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Backend module imports for simulation logic
from BACKEND.Simulation_Core import Simulation, Train
from BACKEND.Carte_Core import get_depots_list, get_depot_center
from BACKEND.Stats_Core import calculer_statistiques_globales, calculer_requirements, regrouper_requirements_par_jour
from BACKEND.Plots_Core import get_gantt_data, get_track_occupation_at_instant, get_train_length_detail
from BACKEND.Jeu_Core import verifier_regles_wagons, ajouter_wagon, ajouter_locomotive, deplacer_wagon, supprimer_element, reset_voies
from BACKEND import auth

# Standard library imports
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional
import pandas as pd
from io import BytesIO
from zoneinfo import ZoneInfo

# Initialize the FastAPI application with metadata
app = FastAPI(
    title="Train Depot Simulation API", 
    version="1.0.0",
    description="API for managing train depot operations, scheduling, and optimization"
)

# ===== UTILITY FUNCTIONS =====

def error_response(message: str, status_code: int = 400, details: dict = None):
    """
    Unified error response helper function.
    
    Creates a standardized error response format across all API endpoints.
    
    Args:
        message: Error message to display to the client
        status_code: HTTP status code (default: 400 Bad Request)
        details: Optional dictionary with additional error details
        
    Returns:
        JSONResponse with standardized error format
    """
    content = {"success": False, "error": message}
    if details:
        content["details"] = details
    return JSONResponse(status_code=status_code, content=content)

# ===== GLOBAL EXCEPTION HANDLERS =====

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler for unexpected errors.
    
    Catches any unhandled exceptions and returns a standardized error response
    with debugging information in development mode.
    """
    import traceback
    return error_response(
        "Internal server error.",
        status_code=500,
        details={"exception": str(exc), "trace": traceback.format_exc()}
    )

# ===== CORS CONFIGURATION =====

# Configure Cross-Origin Resource Sharing (CORS) for frontend access
# This allows the React frontend to communicate with the FastAPI backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",     # Development frontend server
        "http://localhost:3000",     # Alternative development port
        "https://web-production-76c6f.up.railway.app",  # Production deployment
        "https://web-production-1e33b.up.railway.app"   # Alternative production deployment
    ],
    allow_credentials=True,  # Allow cookies and authentication headers
    allow_methods=["*"],     # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*", "Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
    expose_headers=["*", "Authorization", "Content-Type"],  # Headers exposed to frontend
)

# ===== PREFLIGHT CORS HANDLER =====

@app.options("/{rest_of_path:path}")
async def preflight_handler(rest_of_path: str, request: Request):
    """
    Global handler for all OPTIONS requests (CORS preflight).
    
    This endpoint handles preflight CORS requests that browsers send
    before making actual API calls to check if the request is allowed.
    """
    # Add appropriate CORS headers for preflight response
    headers = {
        "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": request.headers.get("access-control-request-headers", "*"),
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Expose-Headers": "*, Authorization, Content-Type"
    }
    return Response(status_code=200, headers=headers)

# ===== APPLICATION INITIALIZATION =====

# Include authentication router for user management endpoints
app.include_router(auth.router)

# Initialize the main simulation instance that will handle all train operations
# This is the core object that manages depots, trains, and scheduling logic
simulation = Simulation()

# Global counter for assigning unique IDs to trains
# This ensures each train has a unique identifier across the system
train_id_counter = 0

# ===== PYDANTIC MODELS =====

class TrainIn(BaseModel):
    """
    Pydantic model for train input data validation.
    
    This model defines the structure and validation rules for train data
    received from the frontend when creating or updating trains.
    """
    nom: str                           # Train name/identifier
    wagons: int                        # Number of wagons in the train
    locomotives: int                   # Number of locomotives
    arrivee: datetime                  # Arrival datetime at depot
    depart: datetime                   # Departure datetime from depot  
    depot: str                         # Depot name where train will be stationed
    type: str = "storage"              # Train type: "storage" or "testing"
    electrique: bool = False           # Whether the train is electric
    locomotive_cote: Optional[str] = "left"  # Side without locomotive: "left" or "right"

# ===== TRAIN MANAGEMENT ENDPOINTS =====

@app.get("/trains")
def get_trains():
    """
    Get all trains in the simulation.
    
    Returns a list of all trains currently managed by the simulation,
    including their properties and scheduling information.
    """
    return [vars(train) for train in simulation.trains]

# ===== GLOBAL OPTIMIZATION ENDPOINT =====

@app.get("/trains/optimized")
@app.get("/trains/optimized/")
def get_optimized_trains():
    """
    Get the optimal train placement solution.
    
    Returns the globally optimized solution for train placement across all depots,
    independent of the depot initially chosen when adding trains. This endpoint
    uses advanced optimization algorithms to minimize conflicts and maximize efficiency.
    """
    # Call the global optimization method from simulation core
    result = simulation.optimiser_placement_global()
    return result

@app.post("/trains")
def add_train(train: TrainIn):
    """
    Add a new train to the simulation.
    
    This endpoint creates a new train with the provided specifications and
    attempts to schedule it in the specified depot. Includes comprehensive
    validation for all train parameters and conflict detection.
    """
    # Validate required fields to ensure all necessary data is provided
    required_fields = ["nom", "wagons", "locomotives", "arrivee", "depart", "depot"]
    for field in required_fields:
        if getattr(train, field, None) in [None, ""]:
            return error_response(f"The field '{field}' is required.", 422)

    # Validate data types and value ranges to prevent invalid train configurations
    if not isinstance(train.wagons, int) or train.wagons < 0:
        return error_response("The number of wagons must be a positive integer.", 422)
    if not isinstance(train.locomotives, int) or train.locomotives < 0:
        return error_response("The number of locomotives must be a positive integer.", 422)

    # Date validation and timezone conversion
    # All dates must be timezone-aware and converted to Copenhagen timezone
    arrivee = train.arrivee
    depart = train.depart
    cph = ZoneInfo("Europe/Copenhagen")  # Copenhagen timezone for European railway operations
    
    if arrivee.tzinfo is None:
        return error_response("Arrival date must include timezone information (Z or +00:00).", 422)
    arrivee = arrivee.astimezone(cph)
    
    if depart.tzinfo is None:
        return error_response("Departure date must include timezone information (Z or +00:00).", 422)
    depart = depart.astimezone(cph)
    
    if arrivee >= depart:
        return error_response("Arrival date must be before departure date.", 422)

    # Check for scheduling conflicts with existing trains of the same name
    # Prevents double-booking of the same train during overlapping periods
    for t in simulation.trains:
        if t.nom == train.nom:
            # Check if time periods overlap using interval logic
            if not (depart <= t.arrivee or arrivee >= t.depart):
                return error_response(
                    f"Train '{train.nom}' is already scheduled from {t.arrivee} to {t.depart} at depot {t.depot}.",
                    409
                )

    # Create new train object with unique ID
    global train_id_counter
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
    
    # Attempt to add train to simulation and handle any scheduling errors
    erreur = simulation.ajouter_train(t_obj, t_obj.depot)
    if erreur:
        return error_response(erreur, 400)
    
    return {"success": True, "train": vars(t_obj)}

@app.put("/trains/{train_id}")
def update_train(train_id: int, train: TrainIn):
    """
    Update an existing train's information.
    
    Modifies the properties of an existing train identified by train_id.
    Includes the same validation as train creation plus additional checks
    to ensure the train exists and updates don't create conflicts.
    """
    # Validate required fields (same as creation)
    required_fields = ["nom", "wagons", "locomotives", "arrivee", "depart", "depot"]
    for field in required_fields:
        if getattr(train, field, None) in [None, ""]:
            return error_response(f"The field '{field}' is required.", 422)

    # Validate data types and ranges (same as creation)
    if not isinstance(train.wagons, int) or train.wagons < 0:
        return error_response("The number of wagons must be a positive integer.", 422)
    if not isinstance(train.locomotives, int) or train.locomotives < 0:
        return error_response("The number of locomotives must be a positive integer.", 422)

    # Date validation and timezone conversion (same as creation)
    arrivee = train.arrivee
    depart = train.depart
    cph = ZoneInfo("Europe/Copenhagen")
    
    if arrivee.tzinfo is None:
        return error_response("Arrival date must include timezone information (Z or +00:00).", 422)
    arrivee = arrivee.astimezone(cph)
    
    if depart.tzinfo is None:
        return error_response("Departure date must include timezone information (Z or +00:00).", 422)
    depart = depart.astimezone(cph)
    
    if arrivee >= depart:
        return error_response("Arrival date must be before departure date.", 422)

    # Find the existing train to update
    existing_train = next((t for t in simulation.trains if t.id == train_id), None)
    if not existing_train:
        return error_response("Train not found.", 404)

    # Check for conflicts with other trains (excluding this train)
    for t in simulation.trains:
        if t.nom == train.nom and t.id != train_id:
            if not (depart <= t.arrivee or arrivee >= t.depart):
                return error_response(
                    f"Train '{train.nom}' is already scheduled from {t.arrivee} to {t.depart} at depot {t.depot}.",
                    409
                )

    # Update all train properties with new values
    existing_train.nom = train.nom
    existing_train.wagons = train.wagons
    existing_train.locomotives = train.locomotives
    existing_train.arrivee = arrivee
    existing_train.depart = depart
    existing_train.depot = train.depot
    existing_train.type = train.type
    existing_train.electrique = train.electrique
    existing_train.locomotive_cote = train.locomotive_cote
    existing_train.longueur = existing_train.calculer_longueur()  # Recalculate train length
    
    # Recalculate the entire simulation to handle any scheduling changes
    erreur = simulation.recalculer() or None
    if erreur:
        return error_response(erreur, 400)
    
    return {"success": True, "train": vars(existing_train)}

@app.delete("/trains/{train_id}")
def delete_train(train_id: int):
    """
    Delete a train from the simulation.
    
    Removes the specified train and recalculates the simulation to update
    all scheduling and track occupation data.
    """
    # Remove train from simulation and recalculate scheduling
    simulation.trains = [t for t in simulation.trains if t.id != train_id]
    simulation.recalculer()
    return {"ok": True}

# ===== DEPOT MANAGEMENT ENDPOINTS =====

@app.get("/depots")
def get_depots():
    """
    Get list of all available depots.
    
    Returns information about all depots in the system including
    their track configurations and geographical locations.
    """
    return get_depots_list(simulation)

@app.get("/depots/{depot_name}")
def get_depot_info(depot_name: str):
    """
    Get detailed information about a specific depot.
    
    Returns comprehensive information about a depot including track numbers,
    track lengths, number of tracks, assigned trains, and geographical coordinates.
    """
    if depot_name not in simulation.depots:
        raise HTTPException(status_code=404, detail="Depot not found")
    
    depot_data = simulation.depots[depot_name]
    trains_depot = [vars(t) for t in simulation.trains if t.depot == depot_name]
    
    return {
        "name": depot_name,
        "numeros_voies": depot_data["numeros_voies"],    # Track numbers
        "longueurs_voies": depot_data["longueurs_voies"], # Track lengths
        "nb_voies": len(depot_data["numeros_voies"]),     # Total number of tracks
        "trains": trains_depot,                           # Trains assigned to this depot
        "lat": depot_data.get("lat"),                     # Latitude coordinate
        "lon": depot_data.get("lon")                      # Longitude coordinate
    }

# ===== GANTT CHART AND SCHEDULING ENDPOINTS =====

@app.get("/gantt-train/{train_id}")
def gantt_train(train_id: int):
    """
    Get Gantt chart data for a specific train.
    
    Returns the complete scheduling information for a single train,
    including track occupations across all depots and any waiting periods.
    This is used to generate train-specific timeline visualizations.
    """
    # Find the requested train
    train = next((t for t in simulation.trains if t.id == train_id), None)
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")
    # Search for all track occupations of this train across all depots
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
            "voie": None,  # No track assigned during waiting
            "debut": train.debut_attente.isoformat(),
            "fin": train.fin_attente.isoformat(),
            "waiting": True
        })
    return result

@app.get("/gantt-all-trains")
def gantt_all_trains():
    """
    Get Gantt chart data for all trains.
    
    Returns scheduling information for all trains in the system,
    including track occupations and waiting periods. This provides
    a comprehensive view of depot utilization across all facilities.
    """
    result = []
    for train in simulation.trains:
        # Check if train occupies any track
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
        
        # Add waiting period if train was in waiting queue
        if train.en_attente and train.debut_attente and train.fin_attente:
            result.append({
                "train_id": train.id,
                "train_nom": train.nom,
                "depot": train.depot,
                "voie": None,  # No track assigned during waiting
                "debut": train.debut_attente.isoformat(),
                "fin": train.fin_attente.isoformat(),
                "type": train.type,
                "electrique": train.electrique,
                "waiting": True
            })
    return result

# ===== RESOURCE REQUIREMENTS ENDPOINT =====

@app.get("/requirements")
def get_requirements():
    """
    Get daily resource requirements for frontend display.
    
    Returns resource needs per day including test drivers and locomotives,
    with the list of depots involved for test drivers and locomotives.
    This helps with resource planning and allocation across the network.
    """
    requirements_par_jour = regrouper_requirements_par_jour(simulation.trains)
    result = []
    for jour, trains in sorted(requirements_par_jour.items()):
        test_drivers = sum(1 for t in trains if t.type == "testing")
        locomotives = sum(t.locomotives for t in trains)
        
        # List of depots where there is at least one test train or locomotive
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
    """
    Get track occupancy data for a specific depot.
    
    Returns detailed occupancy information including which trains
    are on which tracks and for what time periods.
    """
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

# ===== STATISTICS ENDPOINTS =====

@app.get("/statistics")
def get_statistics():
    """
    Get global simulation statistics.
    
    Returns comprehensive statistics about the current simulation
    including utilization rates, conflicts, and performance metrics.
    """
    return calculer_statistiques_globales(simulation)

# ===== GANTT CHART AND VISUALIZATION ENDPOINTS =====

@app.get("/gantt/{depot_name}")
def get_gantt(depot_name: str):
    """
    Get Gantt chart data for a specific depot.
    
    Returns formatted data for generating Gantt chart visualizations
    showing train schedules and track utilization over time.
    """
    if depot_name not in simulation.depots:
        raise HTTPException(status_code=404, detail="Depot not found")
    
    return get_gantt_data(simulation, depot_name)

@app.get("/timelapse-data")
def get_timelapse_data():
    print(">>> /timelapse-data CALLED <<<")
    """
    Retourne pour chaque train la liste de ses positions (dépôts) au fil du temps.
    Format : [{train_id, train_nom, positions: [{depot, lat, lon, debut, fin}, ...]}, ...]
    """
    result = []
    for train in simulation.trains:
        traj = []
        for depot_name, depot in simulation.depots.items():
            for voie_idx, debut, fin, t in depot["occupation"]:
                if getattr(t, "id", None) == train.id:
                    traj.append({
                        "depot": depot_name,
                        "lat": depot.get("lat"),
                        "lon": depot.get("lon"),
                        "debut": debut.isoformat(),
                        "fin": fin.isoformat(),
                    })
        if traj:
            traj = sorted(traj, key=lambda x: x["debut"])
            result.append({
                "train_id": train.id,
                "train_nom": train.nom,
                "positions": traj
            })
    return result

@app.get("/occupation/{depot_name}")
def get_occupation_instant(depot_name: str, instant: str):
    """
    Get track occupation at a specific moment in time.
    
    Returns which trains are occupying which tracks at the given timestamp.
    Useful for real-time monitoring and conflict detection.
    """
    try:
        instant_dt = datetime.fromisoformat(instant.replace('Z', '+00:00'))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid datetime format")
    
    return get_track_occupation_at_instant(simulation, instant_dt, depot_name)

@app.get("/train-details/{depot_name}")
def get_train_details_instant(depot_name: str, instant: str):
    """
    Get detailed train information at a specific moment.
    
    Returns comprehensive train details including length, composition,
    and positioning information at the specified timestamp.
    """
    try:
        instant_dt = datetime.fromisoformat(instant.replace('Z', '+00:00'))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid datetime format")
    
    return get_train_length_detail(simulation, instant_dt, depot_name)

# ===== MINI-GAME ENDPOINTS =====
# Note: This is a duplicate endpoint - should be removed or consolidated
@app.get("/trains/optimized")
@app.get("/trains/optimized/")
def get_optimized_trains_duplicate():
    """
    Get optimal train placement (global optimization).
    
    NOTE: This appears to be a duplicate of the optimization endpoint above.
    Consider consolidating these endpoints to avoid confusion.
    """
    return simulation.optimiser_placement_global()

# ===== GAME DATA MODELS =====

class WagonAction(BaseModel):
    """Model for wagon addition actions in the mini-game."""
    voie: int           # Track number where to add the wagon
    type_wagon: str     # Type of wagon to add
    sens: str = "left"  # Direction/orientation of the wagon

class MoveAction(BaseModel):
    """Model for wagon movement actions in the mini-game."""
    voie_source: int    # Source track number
    wagon_idx: int      # Index of wagon to move
    voie_cible: int     # Target track number

class DeleteAction(BaseModel):
    """Model for element deletion actions in the mini-game."""
    voie: int           # Track number
    element_idx: int    # Index of element to delete

# Game state stored in memory (adapt according to your needs)
# This represents the current state of tracks and their train compositions
game_state = {7: [], 8: [], 9: [], 11: []}  # Track numbers and their contents

# ===== GAME STATE MANAGEMENT =====

@app.get("/game/state")
def get_game_state():
    """
    Get the current game state.
    
    Returns the current composition of all tracks in the mini-game,
    including wagons and locomotives on each track.
    """
    return game_state

# ===== GAME ACTION ENDPOINTS =====

@app.post("/game/add-wagon")
def add_wagon_to_game(action: WagonAction):
    """
    Add a wagon to a track in the mini-game.
    
    Adds a wagon of the specified type to the specified track,
    following the game rules for wagon placement and train composition.
    """
    success, error = ajouter_wagon(game_state, action.voie, action.type_wagon, action.sens)
    if not success:
        raise HTTPException(status_code=400, detail=error)
    return {"success": True, "state": game_state}

@app.post("/game/add-locomotive")
def add_locomotive_to_game(voie: int, direction: str = "left"):
    """
    Add a locomotive to a track in the mini-game.
    
    Adds a locomotive to the specified track with the given direction,
    following locomotive placement rules and capacity constraints.
    """
    success, error = ajouter_locomotive(game_state, voie, direction)
    if not success:
        raise HTTPException(status_code=400, detail=error)
    return {"success": True, "state": game_state}

class MoveAction(BaseModel):
    voie_source: int
    wagon_idx: int
    voie_cible: int

@app.post("/game/move-wagon")
def move_wagon_in_game(action: MoveAction):
    """
    Move a wagon between tracks in the mini-game.
    
    Moves a wagon from one track to another, respecting game rules
    about which wagons can be moved (typically only end wagons).
    """
    global game_state
    success, error_code = deplacer_wagon(game_state, action.voie_source, action.wagon_idx, action.voie_cible)
    if not success:
        return error_response(f"Déplacement impossible: {error_code}", 400)
    return {"success": True, "state": game_state}


@app.post("/game/swap-wagon")
def swap_wagon(trackNumber: int = Body(...), elementIndex: int = Body(...), direction: str = Body(...)):
    """
    Swap the position of adjacent wagons on the same track.
    
    Allows reordering of wagons within a track by swapping adjacent elements,
    useful for optimizing train composition and following operational rules.
    """
    # Assume game_state is a dict {track: [elements]}
    elements = game_state[trackNumber]
    
    if direction == "left" and elementIndex > 0:
        # Swap with element to the left
        elements[elementIndex - 1], elements[elementIndex] = elements[elementIndex], elements[elementIndex - 1]
    elif direction == "right" and elementIndex < len(elements) - 1:
        # Swap with element to the right
        elements[elementIndex + 1], elements[elementIndex] = elements[elementIndex], elements[elementIndex + 1]
    else:
        return {"success": False, "detail": "Movement impossible - no adjacent element or out of bounds"}
    
    return {"success": True, "state": game_state}
    return {"success": True, "state": game_state}

@app.post("/game/delete-element")
def delete_element_from_game(action: DeleteAction):
    """
    Delete an element (wagon or locomotive) from a track.
    
    Removes the specified element from the track, updating the game state
    and maintaining proper train composition rules.
    """
    success, error = supprimer_element(game_state, action.voie, action.element_idx)
    if not success:
        raise HTTPException(status_code=400, detail=error)
    return {"success": True, "state": game_state}

@app.post("/game/reset")
def reset_game():
    """
    Reset the mini-game to its initial state.
    
    Clears all tracks and resets the game state to allow starting
    a new game session with clean track configurations.
    """
    global game_state
    game_state = reset_voies()
    return {"success": True, "state": game_state}

# ===== FILE IMPORT ENDPOINTS =====

@app.post("/import-trains-excel")
async def import_trains_excel(file: UploadFile = File(...)):
    """
    Import trains from an Excel or CSV file.
    
    Accepts Excel (.xlsx, .xls) or CSV files containing train data
    and imports them into the simulation. Handles data validation,
    format conversion, and error reporting for each imported train.
    """
    print("File received:", file.filename)  # Debug log
    global train_id_counter
    
    # Validate file format
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(status_code=400, detail="Unsupported file format")
    
    # Read file content based on format
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(BytesIO(await file.read()), sep=None, engine='python')
        else:
            df = pd.read_excel(BytesIO(await file.read()))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"File reading error: {e}")

    # Column mapping from French to English internal names
    col_map = {
        "Nom": "nom",                           # Train name
        "Nombre de wagons": "wagons",           # Number of wagons
        "Nombre de locomotives": "locomotives", # Number of locomotives
        "Heure d'arrivée": "arrivee",          # Arrival time
        "Heure de départ": "depart",           # Departure time
        "Dépôt": "depot",                      # Depot name
        "Type de train": "type",               # Train type
        "Électrique": "electrique",            # Electric train flag
        "Côté sans locomotive": "locomotive_cote"  # Side without locomotive
    }
    df = df.rename(columns=col_map)

    # Data cleaning and conversion
    imported = []  # Successfully imported trains
    errors = []    # Import errors
    
    for idx, row in df.iterrows():
        try:
            # Date conversion with proper timezone handling
            arrivee = pd.to_datetime(row['arrivee'], dayfirst=True)
            depart = pd.to_datetime(row['depart'], dayfirst=True)
            
            # Add Europe/Copenhagen timezone
            cph = ZoneInfo("Europe/Copenhagen")
            if arrivee.tzinfo is None:
                arrivee = arrivee.tz_localize(cph)
            if depart.tzinfo is None:
                depart = depart.tz_localize(cph)
            
            # Convert to Python datetime objects
            arrivee = arrivee.to_pydatetime()
            depart = depart.to_pydatetime()
            
            # Boolean conversion for electric flag
            electrique = str(row.get('electrique', '')).strip().upper() == "TRUE"
            
            # Locomotive side configuration
            loco_cote = row.get('locomotive_cote') or "left"
            
            # Train type normalization
            train_type = str(row.get('type', 'storage')).lower()
            
            # Create train object with validated data
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
            
            # Add train to simulation and handle potential conflicts
            train_id_counter += 1
            erreur = simulation.ajouter_train(t_obj, t_obj.depot)
            if erreur:
                errors.append(f"Line {idx+2} ({row['nom']}): {erreur}")
            else:
                imported.append(row['nom'])
                
        except Exception as e:
            errors.append(f"Line {idx+2}: {e}")

    return {
        "imported": imported,  # List of successfully imported train names
        "errors": errors       # List of import errors with details
    }

# ===== SIMULATION CONTROL ENDPOINTS =====

@app.post("/reset")
def reset_simulation():
    """
    Reset the entire simulation to its initial state.
    
    Clears all trains, resets depot states, and initializes
    a fresh simulation environment. Use with caution as this
    will permanently delete all current simulation data.
    """
    simulation.reset()
    return {"ok": True}

"""@app.post("/game/move-wagon")
//def move_wagon_in_game_duplicate(action: MoveAction):
    
    Move a wagon between tracks in the mini-game (duplicate endpoint).
    
    This appears to be a duplicate of the move-wagon endpoint above.
    Consider removing this duplicate to avoid confusion and potential conflicts.
    success, error = deplacer_wagon(game_state, action.voie_source, action.wagon_idx, action.voie_cible)
    if not success:
        if error == "only_move_end":
            raise HTTPException(status_code=400, detail="Only wagons at the ends can be moved.")
        else:
            raise HTTPException(status_code=400, detail=error or "Error during wagon movement.")
    return {"success": True, "state": game_state}
"""
@app.post("/recalculate")
def recalculate_simulation():
    """
    Recalculate the entire simulation.
    
    Triggers a complete recalculation of train schedules, track assignments,
    and conflict resolution. Use this after making manual changes to train
    data or when the simulation state needs to be refreshed.
    """
    simulation.recalculer()
    return {"ok": True}

# ===== ROOT ENDPOINT =====

@app.get("/")
def root():
    """
    API root endpoint providing basic information.
    
    Returns basic API information including name and version.
    This serves as a health check and information endpoint.
    """
    return {
        "message": "Train Depot Simulation API", 
        "version": "1.0.0",
        "description": "API for managing train depot operations, scheduling, and optimization"
    }

@app.post("/restore-simulation")
def restore_simulation(data: dict = Body(...)):
    from datetime import datetime
    simulation.reset()
    trains_data = data.get("trains", [])
    restored = 0
    for train_dict in trains_data:
        try:
            arrivee = train_dict.get("arrivee")
            depart = train_dict.get("depart")
            if isinstance(arrivee, str):
                arrivee = datetime.fromisoformat(arrivee)
            if isinstance(depart, str):
                depart = datetime.fromisoformat(depart)
            train = Train(
                id=train_dict.get("id"),
                nom=train_dict.get("nom"),
                wagons=train_dict.get("wagons"),
                locomotives=train_dict.get("locomotives"),
                arrivee=arrivee,
                depart=depart,
                depot=train_dict.get("depot"),
                type=train_dict.get("type", "storage"),
                electrique=train_dict.get("electrique", False),
                locomotive_cote=train_dict.get("locomotive_cote", "left"),
            )
            simulation.ajouter_train(train, train.depot)
            restored += 1
        except Exception as e:
            print("Erreur lors de l'import d'un train :", train_dict)
            print("Exception :", e)
            continue
    return {"msg": f"Simulation restaurée ({restored} trains)"}