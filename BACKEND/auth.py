from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from sqlmodel import SQLModel, Field, Session, create_engine, select
from sqlalchemy import Column, JSON
from fastapi.responses import Response

DATABASE_URL = "sqlite:///./users.db"
engine = create_engine(DATABASE_URL, echo=False)

class UserDB(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: str
    hashed_password: str
    preferences: dict = Field(default_factory=dict, sa_column=Column(JSON))  # Corrigé
    history: list = Field(default_factory=list, sa_column=Column(JSON))      # Corrigé

class SimulationDB(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="userdb.id")
    name: str
    data: dict = Field(default_factory=dict, sa_column=Column(JSON))  # Correction ici

SQLModel.metadata.create_all(engine)

SECRET_KEY = "change_this_secret"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

router = APIRouter()

class UserIn(BaseModel):
    username: str
    email: str
    password: str

class SimulationData(BaseModel):
    name: str
    data: dict

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_user(username: str):
    with Session(engine) as session:
        statement = select(UserDB).where(UserDB.username == username)
        user = session.exec(statement).first()
        return user

def authenticate_user(username: str, password: str):
    user = get_user(username)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

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




@router.post("/register")
def register(user: UserIn):
    if get_user(user.username):
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed = get_password_hash(user.password)
    user_db = UserDB(
        username=user.username,
        email=user.email,
        hashed_password=hashed,
        preferences={},
        history=[]
    )
    with Session(engine) as session:
        session.add(user_db)
        session.commit()
    return {"msg": "User registered"}

@router.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
def get_me(current_user: UserDB = Depends(get_current_user)):
    return current_user

@router.post("/preferences")
def save_preferences(prefs: dict, current_user: UserDB = Depends(get_current_user)):
    with Session(engine) as session:
        user = session.get(UserDB, current_user.id)
        user.preferences = prefs
        session.add(user)
        session.commit()
    return {"msg": "Preferences saved"}

@router.get("/preferences")
def get_preferences(current_user: UserDB = Depends(get_current_user)):
    return current_user.preferences

@router.delete("/history/{idx}")
def delete_history(idx: int, current_user: UserDB = Depends(get_current_user)):
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
    with Session(engine) as session:
        sim = session.get(SimulationDB, sim_id)
        if sim and sim.user_id == current_user.id:
            sim_name = sim.name
            session.delete(sim)
            session.commit()
            # Ajout dans l'historique
            add_history_entry(
                current_user.id,
                action="Suppression simulation",
                details={"simulation": sim_name}
            )
        else:
            raise HTTPException(status_code=404, detail="Simulation non trouvée")
    return {"msg": "Simulation supprimée"}

def add_history_entry(user_id: int, action: str, details: dict = None):
    with Session(engine) as session:
        user = session.get(UserDB, user_id)
        entry = {
            "action": action,
            "date": datetime.utcnow().isoformat(),
        }
        if details:
            entry.update(details)
        user.history = (user.history or []) + [entry]
        session.add(user)
        session.commit()

@router.post("/history")
def add_history(item: dict, current_user: UserDB = Depends(get_current_user)):
    with Session(engine) as session:
        user = session.get(UserDB, current_user.id)
        # Forcer la modification pour SQLModel/SQLAlchemy
        user.history = (user.history or []) + [item]
        session.add(user)
        session.commit()
    return {"msg": "History updated"}

@router.get("/history")
def get_history(current_user: UserDB = Depends(get_current_user)):
    return current_user.history

@router.post("/save-simulation")
def save_simulation(sim: SimulationData, current_user: UserDB = Depends(get_current_user)):
    with Session(engine) as session:
        sim_db = SimulationDB(user_id=current_user.id, name=sim.name, data=sim.data)
        session.add(sim_db)
        session.commit()
    # Ajout dans l'historique
    add_history_entry(
        current_user.id,
        action="Sauvegarde simulation",
        details={"simulation": sim.name}
    )
    return {"msg": "Simulation saved"}

@router.get("/my-simulations")
def get_my_simulations(current_user: UserDB = Depends(get_current_user)):
    with Session(engine) as session:
        statement = select(SimulationDB).where(SimulationDB.user_id == current_user.id)
        sims = session.exec(statement).all()
        return sims