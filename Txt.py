# -*- coding: utf-8 -*-
"""
Created on Wed Jun 25 13:46:21 2025

@author: andre
"""

# Va dans le dossier API
cd c:\Users\andre\Desktop\ENTPE\STAGE_MSP\API

# Installe les dépendances Python (si pas déjà fait)
pip install fastapi uvicorn pandas plotly python-multipart

# Lance le serveur FastAPI
uvicorn MAIN:app --reload --host 0.0.0.0 --port 8000

# Va dans le dossier FRONTEND
cd c:\Users\andre\Desktop\ENTPE\STAGE_MSP\API\FRONTEND

# Installe les dépendances Node.js
npm install

# Lance le serveur de développement React
npm start