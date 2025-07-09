from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from sqlmodel import SQLModel, Field, Session, create_engine, select
from sqlalchemy import Column, JSON
from fastapi.responses import Response

# Database configuration
DATABASE_URL = "sqlite:///./users.db"
engine = create_engine(DATABASE_URL, echo=False)

# User database model
class UserDB(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: str
    hashed_password: str
    preferences: dict = Field(default_factory=dict, sa_column=Column(JSON))  # User preferences (JSON)
    history: list = Field(default_factory=list, sa_column=Column(JSON))      # User history (JSON)

# Simulation database model
class SimulationDB(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="userdb.id")
    name: str
    data: dict = Field(default_factory=dict, sa_column=Column(JSON))  # Simulation data (JSON)

# Create tables if they don't exist
SQLModel.metadata.create_all(engine)

# JWT and password hashing configuration
SECRET_KEY = "change_this_secret"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

router = APIRouter()

# Pydantic models for user registration and simulation data
class UserIn(BaseModel):
    username: str
    email: str
    password: str

class SimulationData(BaseModel):
    name: str
    data: dict

# Password verification
def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

# Hash a password for storage
def get_password_hash(password):
    return pwd_context.hash(password)

# Create a JWT access token
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Retrieve a user by username from the database
def get_user(username: str):
    with Session(engine) as session:
        statement = select(UserDB).where(UserDB.username == username)
        user = session.exec(statement).first()
        return user

# Authenticate a user by username and password
def authenticate_user(username: str, password: str):
    user = get_user(username)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

# Dependency to get the current user from the JWT token
async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        user = get_user(username)
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ------------------- ROUTES -------------------

@router.post("/register")
def register(user: UserIn):
    # Register a new user if the username is not already taken
    with Session(engine) as session:
        existing = session.exec(select(UserDB).where(UserDB.username == user.username)).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already registered")
        hashed_password = get_password_hash(user.password)
        user_db = UserDB(
            username=user.username,
            email=user.email,
            hashed_password=hashed_password,
            preferences={},
            history=[]
        )
        session.add(user_db)
        session.commit()
        session.refresh(user_db)
        return {"username": user_db.username, "email": user_db.email}

@router.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Authenticate user and return a JWT access token
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
def get_me(current_user: UserDB = Depends(get_current_user)):
    # Return the current authenticated user's information
    return current_user

@router.post("/preferences")
def save_preferences(prefs: dict, current_user: UserDB = Depends(get_current_user)):
    # Save user preferences (as JSON) to the database
    with Session(engine) as session:
        user = session.get(UserDB, current_user.id)
        user.preferences = prefs
        session.add(user)
        session.commit()
    return {"msg": "Preferences saved"}

@router.get("/preferences")
def get_preferences(current_user: UserDB = Depends(get_current_user)):
    # Retrieve the current user's preferences
    return current_user.preferences

@router.delete("/history/{idx}")
def delete_history(idx: int, current_user: UserDB = Depends(get_current_user)):
    # Delete a specific history entry by index for the current user
    with Session(engine) as session:
        user = session.get(UserDB, current_user.id)
        if user.history and 0 <= idx < len(user.history):
            user.history = user.history[:idx] + user.history[idx+1:]
            session.add(user)
            session.commit()
        else:
            raise HTTPException(status_code=404, detail="Historique non trouvé")
    return {"msg": "Historique supprimé"}

@router.delete("/simulation/{sim_id}")
def delete_simulation(sim_id: int, current_user: UserDB = Depends(get_current_user)):
    # Delete a simulation by its ID if it belongs to the current user
    with Session(engine) as session:
        sim = session.get(SimulationDB, sim_id)
        if sim and sim.user_id == current_user.id:
            sim_name = sim.name
            session.delete(sim)
            session.commit()
            # Add a history entry for the deletion
            add_history_entry(
                current_user.id,
                action="Suppression simulation",
                details={"simulation": sim_name}
            )
        else:
            raise HTTPException(status_code=404, detail="Simulation non trouvée")
    return {"msg": "Simulation supprimée"}

# ------------------- HISTORY & SIMULATION UTILS -------------------

def add_history_entry(user_id: int, action: str, details: dict = None):
    # Add a new entry to the user's history in the database.
    # - user_id: ID of the user whose history is updated
    # - action: Description of the action performed (e.g., "Simulation saved")
    # - details: Optional dictionary with additional details (e.g., simulation name)
    with Session(engine) as session:
        user = session.get(UserDB, user_id)
        entry = {
            "action": action,
            "date": datetime.utcnow().isoformat(),
        }
        if details:
            entry.update(details)
        # Append the new entry to the existing history (or create a new list if empty)
        user.history = (user.history or []) + [entry]
        session.add(user)
        session.commit()

@router.post("/history")
def add_history(item: dict, current_user: UserDB = Depends(get_current_user)):
    # API endpoint to add a new history entry for the current user.
    # - item: Dictionary describing the action (should include at least "action" and "date")
    with Session(engine) as session:
        user = session.get(UserDB, current_user.id)
        # Force SQLModel/SQLAlchemy to recognize the change by reassigning the list
        user.history = (user.history or []) + [item]
        session.add(user)
        session.commit()
    return {"msg": "History updated"}

@router.get("/history")
def get_history(current_user: UserDB = Depends(get_current_user)):
    # API endpoint to retrieve the current user's history.
    return current_user.history

@router.post("/save-simulation")
def save_simulation(sim: SimulationData, current_user: UserDB = Depends(get_current_user)):
    # API endpoint to save a simulation for the current user.
    # - sim: SimulationData object containing the simulation name and data
    with Session(engine) as session:
        sim_db = SimulationDB(user_id=current_user.id, name=sim.name, data=sim.data)
        session.add(sim_db)
        session.commit()
    # Add a history entry for this simulation save
    add_history_entry(
        current_user.id,
        action="Sauvegarde simulation",  # "Simulation saved" (French)
        details={"simulation": sim.name}
    )
    return {"msg": "Simulation saved"}

@router.get("/my-simulations")
def get_my_simulations(current_user: UserDB = Depends(get_current_user)):
    # API endpoint to retrieve all simulations belonging to the current user.
    with Session(engine) as session:
        statement = select(SimulationDB).where(SimulationDB.user_id == current_user.id)
        sims = session.exec(statement).all()
        return sims