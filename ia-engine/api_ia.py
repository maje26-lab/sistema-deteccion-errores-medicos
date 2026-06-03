import sys
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import mean_squared_error
import joblib

app = FastAPI(title="API de Auditoría Médica con IA EsSalud")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DataInput(BaseModel):
    edad_paciente: int
    genero_paciente: str
    especialidad_medico: str
    codigo_cie10: str
    medicamento: str
    dosis_diaria_mg: int
    dias_tratamiento: int
    tiempo_llenado_min: float

os.makedirs("models", exist_ok=True)
CSV_PATH = "atenciones_historicas.csv"
MODEL_PATH = os.path.join("models", "detector_errores_medicos.joblib")

def generar_dataset_si_no_existe():
    if not os.path.exists(CSV_PATH):
        data_base = [
            [45, "F", "Medicina General", "E11", "MED_Metformina", 850, 30, 3.5, 0],
            [60, "M", "Medicina General", "E11", "MED_Metformina", 500, 60, 4.2, 0],
            [58, "M", "Ginecologia", "O20", "MED_Metformina", 500, 3, 4.5, 1],
            [52, "F", "Medicina General", "I10", "MED_Metformina", 850, 30, 3.8, 1]
        ]
        registros_expandidos = []
        for _ in range(30):
            for fila in data_base:
                registros_expandidos.append(fila.copy())
        columnas = ['edad_paciente', 'genero_paciente', 'especialidad_medico', 'codigo_cie10', 'medicamento', 'dosis_diaria_mg', 'dias_tratamiento', 'tiempo_llenado_min', 'tiene_error']
        pd.DataFrame(registros_expandidos, columns=columnas).to_csv(CSV_PATH, index=False)

def entrenar_modelo_ia():
    generar_dataset_si_no_existe()
    df = pd.read_csv(CSV_PATH)
    X = df.drop(columns=["tiene_error"])
    y = df["tiene_error"]
    X['genero_paciente'] = X['genero_paciente'].map({'M': 1, 'F': 0}).fillna(0)
    X['especialidad_medico'] = X['especialidad_medico'].map({'Medicina General': 0, 'Ginecologia': 1, 'Cardiologia': 2}).fillna(0)
    X['codigo_cie10'] = X['codigo_cie10'].map({'E11': 0, 'O20': 1, 'I10': 2, 'Z32': 3}).fillna(0)
    X['medicamento'] = X['medicamento'].map({'MED_Metformina': 0, 'MED_Paracetamol': 1}).fillna(0)
    
    modelo_rf = RandomForestClassifier(n_estimators=50, random_state=42)
    modelo_rf.fit(X, y)
    joblib.dump(modelo_rf, MODEL_PATH)

entrenar_modelo_ia()

@app.post("/predict")
def predict(input_data: DataInput):
    # (Tu lógica de predicción actual es correcta)
    return {"status": "ok", "mensaje": "Predicción procesada"}

# === CAMBIO CRÍTICO PARA LA NUBE ===
if __name__ == "__main__":
    # Render asigna el puerto en una variable de entorno llamada PORT
    port = int(os.environ.get("PORT", 8080))
    # host="0.0.0.0" es obligatorio para conexiones externas
    uvicorn.run(app, host="0.0.0.0", port=port)