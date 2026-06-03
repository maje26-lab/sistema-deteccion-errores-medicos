import React, { useState } from 'react';

export default function App() {
  const [datos, setDatos] = useState({
    edad_paciente: '',
    genero_paciente: 'M',
    especialidad_medico: 'Medicina General',
    codigo_cie10: 'E11',
    medicamento: 'MED_Metformina',
    dosis_diaria_mg: '',
    dias_tratamiento: '',
    tiempo_llenado_min: '4.5'
  });

  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [metricas, setMetricas] = useState({ total: 0, errores: 0, optimos: 0 });

  const manejarCambios = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  const consumirBackendIA = async (valores) => {
    try {
      const respuesta = await fetch("https://sistema-deteccion-errores-medicos.onrender.com/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          edad_paciente: parseInt(valores.edad_paciente) || 0,
          genero_paciente: valores.genero_paciente,
          especialidad_medico: valores.especialidad_medico,
          codigo_cie10: valores.codigo_cie10,
          medicamento: valores.medicamento,
          dosis_diaria_mg: parseInt(valores.dosis_diaria_mg) || 0,
          dias_tratamiento: parseInt(valores.dias_tratamiento) || 0,
          tiempo_llenado_min: parseFloat(valores.tiempo_llenado_min) || 0.0
        }),
      });

      if (!respuesta.ok) {
        throw new Error("Respuesta inválida del servidor");
      }

      const data = await respuesta.json();
      return data;
    } catch (error) {
      console.error("Error conectando con la IA:", error);
      return {
        tiene_error: 1,
        probabilidad_error: 100,
        mensaje: "ERROR DE CONEXIÓN: No se pudo establecer comunicación con el core de Machine Learning. Verifica la URL del backend."
      };
    }
  };

  const cargarCasoEjemplo = async (tipo) => {
    let nuevosDatos = {};
    if (tipo === 'error_genero') {
      nuevosDatos = {
        edad_paciente: '58',
        genero_paciente: 'M', 
        especialidad_medico: 'Ginecologia',
        codigo_cie10: 'O20', 
        medicamento: 'MED_Metformina',
        dosis_diaria_mg: '500',
        dias_tratamiento: '3',
        tiempo_llenado_min: '4.5'
      };
    } else if (tipo === 'error_medicamento') {
      nuevosDatos = {
        edad_paciente: '52',
        genero_paciente: 'F',
        especialidad_medico: 'Medicina General',
        codigo_cie10: 'I10', 
        medicamento: 'MED_Metformina', 
        dosis_diaria_mg: '850',
        dias_tratamiento: '30',
        tiempo_llenado_min: '3.8'
      };
    } else {
      nuevosDatos = {
        edad_paciente: '34',
        genero_paciente: 'F',
        especialidad_medico: 'Ginecologia',
        codigo_cie10: 'Z32', 
        medicamento: 'MED_Paracetamol',
        dosis_diaria_mg: '500',
        dias_tratamiento: '7',
        tiempo_llenado_min: '2.5'
      };
    }
    
    setDatos(nuevosDatos);
    setCargando(true);
    const respuestaIA = await consumirBackendIA(nuevosDatos);
    inyectarResultadoEnPantalla(respuestaIA, nuevosDatos);
    setCargando(false);
  };

  const inyectarResultadoEnPantalla = (data, infoActual) => {
    setResultado(data);
    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setHistorial(prev => [
      {
        id: Date.now(),
        hora: horaActual,
        cie10: infoActual.codigo_cie10,
        medicamento: infoActual.medicamento.replace('MED_', ''),
        probabilidad: data.probabilidad_error
      },
      ...prev
    ]);

    setMetricas(prev => ({
      total: prev.total + 1,
      errores: prev.errores + (data.tiene_error === 1 ? 1 : 0),
      optimos: prev.optimos + (data.tiene_error === 0 ? 1 : 0)
    }));
  };

  const procesarAuditoria = async (e) => {
    e.preventDefault();
    setCargando(true);
    const dataServidor = await consumirBackendIA(datos);
    inyectarResultadoEnPantalla(dataServidor, datos);
    setCargando(false);
  };

  const getColoresPorRiesgo = (prob) => {
    if (prob > 75) return { principal: '#dc2626', fondo: '#fef2f2', texto: '#991b1b', borde: '#fee2e2' };
    if (prob > 30) return { principal: '#d97706', fondo: '#fffbeb', texto: '#92400e', borde: '#fef3c7' };
    return { principal: '#0079c1', fondo: '#f0f9ff', texto: '#005588', borde: '#e0f2fe' };
  };

  const configRiesgo = resultado ? getColoresPorRiesgo(resultado.probabilidad_error) : null;

  return (
    <div style={{ background: '#f4f8fa', minHeight: '100vh', padding: '24px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#2d3748', boxSizing: 'border-box', width: '100%' }}>
      
      {/* HEADER - OCUPA TODO EL ANCHO */}
      <div style={{ background: '#ffffff', borderRadius: '12px', borderTop: '6px solid #0079c1', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', boxShadow: '0 4px 15px rgba(0, 121, 193, 0.05)', width: '100%', boxSizing: 'border-box' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ background: '#0079c1', color: '#ffffff', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>SISTEMA ASISTIDO POR IA</span>
            <span style={{ color: '#00aae4', fontSize: '12px', fontWeight: '600' }}>• CORE DISPONIBLE</span>
          </div>
          <h1 style={{ margin: '0', fontSize: '26px', fontWeight: '800', color: '#005588', letterSpacing: '-0.5px' }}>MÓDULO COGNITIVO EXPERTO</h1>
          <p style={{ margin: '2px 0 0 0', color: '#718096', fontSize: '13px' }}>Validación Analítica de Prescripciones Médicas en Tiempo Real • Red EsSalud</p>
        </div>
        <div style={{ background: '#ffffff', padding: '6px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '120px' }}>
          <img src="https://images.seeklogo.com/logo-png/20/1/essalud-logo-png_seeklogo-205729.png" alt="EsSalud" style={{ width: '100%', height: 'auto' }} />
        </div>
      </div>

      {/* INDICADORES - REPARTO FLUIDO DE 3 COLUMNAS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '24px', width: '100%' }}>
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '5px solid #00aae4', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#718096' }}>TRANSMISIONES AUDITADAS</div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#005588', marginTop: '4px' }}>{metricas.total}</div>
        </div>
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '5px solid #dc2626', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#dc2626' }}>ALERTAS DE RIESGO</div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#dc2626', marginTop: '4px' }}>{metricas.errores}</div>
        </div>
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '5px solid #0079c1', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#0079c1' }}>DICTÁMENES CONFORMES</div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#0079c1', marginTop: '4px' }}>{metricas.optimos}</div>
        </div>
      </div>

      {/* CUERPO PRINCIPAL */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', alignItems: 'start', width: '100%', boxSizing: 'border-box' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#005588', marginBottom: '14px', textAlign: 'center' }}>🧪 INYECTOR DE CASOS CLÍNICOS PARA CONTROL DE CALIDAD</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <button type="button" onClick={() => cargarCasoEjemplo('error_genero')} style={{ padding: '12px 6px', fontSize: '12px', fontWeight: '700', background: '#fff5f5', color: '#c53030', border: '1px solid #feb2b2', borderRadius: '8px', cursor: 'pointer' }}>Incoherencia Género</button>
              <button type="button" onClick={() => cargarCasoEjemplo('error_medicamento')} style={{ padding: '12px 6px', fontSize: '12px', fontWeight: '700', background: '#fffaf0', color: '#dd6b20', border: '1px solid #fbd38d', borderRadius: '8px', cursor: 'pointer' }}>Riesgo Fármaco</button>
              <button type="button" onClick={() => cargarCasoEjemplo('correcto')} style={{ padding: '12px 6px', fontSize: '12px', fontWeight: '700', background: '#f0f9ff', color: '#0079c1', border: '1px solid #bee3f8', borderRadius: '8px', cursor: 'pointer' }}>Flujo Conforme</button>
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '28px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: '700', color: '#005588', textAlign: 'center' }}>Ficha de Datos de la Atención</h3>
            <form onSubmit={procesarAuditoria}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#4a5568', marginBottom: '6px' }}>EDAD CRONOLÓGICA</label>
                  <input type="number" name="edad_paciente" value={datos.edad_paciente} onChange={manejarCambios} required style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="Ej. 28" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#4a5568', marginBottom: '6px' }}>GÉNERO EN HISTORIA</label>
                  <select name="genero_paciente" value={datos.genero_paciente} onChange={manejarCambios} style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <option value="M">Masculino (M)</option>
                    <option value="F">Femenino (F)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#4a5568', marginBottom: '6px' }}>ESPECIALIDAD MÉDICA EMISORA</label>
                <select name="especialidad_medico" value={datos.especialidad_medico} onChange={manejarCambios} style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option value="Medicina General">Medicina General</option>
                  <option value="Ginecologia">Ginecología y Obstetricia</option>
                  <option value="Cardiologia">Cardiología</option>
                  <option value="Pediatria">Pediatría</option>
                  <option value="Psiquiatria">Psiquiatría de Adultos</option>
                  <option value="Oncologia">Oncología Médica</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#4a5568', marginBottom: '6px' }}>DIAGNÓSTICO CIE-10 ESTABLECIDO</label>
                <select name="codigo_cie10" value={datos.codigo_cie10} onChange={manejarCambios} style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option value="E11">Diabetes Mellitus Tipo 2 (E11)</option>
                  <option value="O20">Amenaza de Aborto (O20)</option>
                  <option value="I10">Hipertensión Arterial Primaria (I10)</option>
                  <option value="Z32">Examen de Control de Embarazo (Z32)</option>
                  <option value="J00">Rinofaringitis Aguda / Resfrío Común (J00)</option>
                  <option value="F32">Episodio Depresivo Mayor (F32)</option>
                  <option value="C50">Tumor Maligno de la Mama (C50)</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#4a5568', marginBottom: '6px' }}>FÁRMACO COBERTURADO POR FARMACIA</label>
                <select name="medicamento" value={datos.medicamento} onChange={manejarCambios} style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option value="MED_Metformina">Metformina Clorhidrato (500mg/850mg)</option>
                  <option value="MED_Paracetamol">Paracetamol / Acetaminofén (500mg)</option>
                  <option value="MED_Amoxicilina">Amoxicilina Suspensión (250mg/5mL)</option>
                  <option value="MED_Sertralina">Sertralina Clorhidrato (500mg)</option>
                  <option value="MED_Tamoxifeno">Tamoxifeno Citrato (20mg)</option>
                </select>
              </div>
              <div style={{ gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px', display: 'grid' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#4a5568', marginBottom: '6px' }}>DOSIFICACIÓN DIARIA (MG)</label>
                  <input type="number" name="dosis_diaria_mg" value={datos.dosis_diaria_mg} onChange={manejarCambios} required style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#4a5568', marginBottom: '6px' }}>TÉRMINO (DÍAS)</label>
                  <input type="number" name="dias_tratamiento" value={datos.dias_tratamiento} onChange={manejarCambios} required style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>
              <button type="submit" disabled={cargando} style={{ background: '#0079c1', color: '#ffffff', border: 'none', padding: '16px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', width: '100%', cursor: 'pointer' }}>
                {cargando ? '⚙️ CONSULTANDO CORE DE IA...' : '🔍 INTERROGAR COMPORTAMIENTO CLÍNICO'}
              </button>
            </form>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: '#ffffff', padding: '30px 24px', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '380px' }}>
            {cargando && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '10px 0 0 0', color: '#0079c1', fontWeight: '700' }}>Procesando en Red Neuronal / Random Forest...</p>
              </div>
            )}
            {!resultado && !cargando && (
              <div style={{ textAlign: 'center' }}>
                <h4 style={{ margin: '0', fontSize: '16px', fontWeight: '700', color: '#005588' }}>🛡️ Monitoreo en Espera</h4>
                <p style={{ margin: '6px 0 0 0', color: '#718096', fontSize: '13px' }}>Use los inyectores superiores o llene el formulario para iniciar la auditoría real.</p>
              </div>
            )}
            {resultado && !cargando && (
              <div style={{ width: '100%', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#a0aec0' }}>VERDICTO DEL MODELO DE IA</span>
                <div style={{ fontSize: '32px', fontWeight: '900', color: configRiesgo.principal, margin: '15px 0' }}>{resultado.probabilidad_error}%</div>
                <div style={{ background: configRiesgo.fondo, border: `1px solid ${configRiesgo.borde}`, padding: '16px', borderRadius: '8px', textAlign: 'left' }}>
                  <div style={{ fontWeight: '800', color: configRiesgo.texto }}>{resultado.tiene_error === 1 ? '⚠️ ALERTADO POR MODELO' : '🛡️ CONFORME'}</div>
                  <p style={{ margin: '0', fontSize: '13px', color: configRiesgo.texto }}>{resultado.mensaje}</p>
                </div>
              </div>
            )}
          </div>
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#005588' }}>📋 Registro Auditado en Tiempo Real</h4>
            <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '12px' }}>
              {historial.length === 0 ? (
                <p style={{ color: '#a0aec0', margin: '0' }}>Ningún registro en esta sesión.</p>
              ) : (
                historial.map(h => (
                  <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #edf2f7' }}>
                    <span>🕒 {h.hora} - <b>{h.cie10}</b> ({h.medicamento})</span>
                    <span style={{ color: h.probabilidad > 50 ? '#dc2626' : '#0079c1', fontWeight: '700' }}>{h.probabilidad}% riesgo</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}