# -*- coding: utf-8 -*-
"""
Created on Wed Jun 25 13:46:21 2025

@author: andre
"""

# Va dans le dossier API
cd c:\Users\andre\Desktop\ENTPE\STAGE_MSP\API_VF
cd c:\Users\andre\Desktop\ENTPE\STAGE_MSP\SEAT_VF
panel serve panel_wagons.py --address 0.0.0.0 --port 5006
# Installe les dépendances Python (si pas déjà fait)
pip install fastapi uvicorn pandas plotly python-multipart

# Lance le serveur FastAPI
uvicorn MAIN:app --reload --host 0.0.0.0 --port 8000

# Va dans le dossier FRONTEND
cd c:\Users\andre\Desktop\ENTPE\STAGE_MSP\API_VF\FRONTEND

# Installe les dépendances Node.js
npm install

# Lance le serveur de développement React
npm start

                        <Typography
                        #  variant="h6"
                          sx={{ mt: 2, mb: 1, color: red[800] }}
                        >
                          {t('trains', language) || "Trains"} ({depotInfo.trains ? depotInfo.trains.length : 0})
                        </Typography>