import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

print("1. Cargando el dataset de registros médicos desde CSV...")
# Carga de forma directa el archivo .csv que tienes en la carpeta ia-engine
df = pd.read_csv("dataset_registros_medicos.csv")

print("2. Aplicando One-Hot Encoding (Conversión de texto a variables matemáticas)...")
# Convertimos automáticamente las columnas de texto (géneros M/F, especialidad, cie10, etc.) en numéricas
df_procesado = pd.get_dummies(df, columns=['genero_paciente', 'especialidad_medico', 'codigo_cie10', 'medicamento'])

# Separamos las variables predictoras (X) de la etiqueta objetivo (y)
X = df_procesado.drop(columns=['tiene_error'])
y = df_procesado['tiene_error']

# Dividimos el conjunto: 80% para entrenar y 20% para validar el modelo internamente
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("3. Entrenando el clasificador predictivo (Random Forest)...")
modelo = RandomForestClassifier(n_estimators=100, random_state=42)
modelo.fit(X_train, y_train)

print("4. Exportando archivos binarios del modelo...")
# Código de seguridad: Crea la carpeta 'models' automáticamente si por alguna razón no existe
if not os.path.exists('models'):
    os.makedirs('models')

# GUARDADO ORDENADO: Ahora los archivos se guardan dentro de la carpeta 'models/'
joblib.dump(modelo, 'models/detector_errores_medicos.pkl')
joblib.dump(X.columns.tolist(), 'models/columnas_modelo.pkl')

print("¡Proceso completado con éxito! Archivos '.pkl' creados correctamente dentro de la carpeta 'models'.")