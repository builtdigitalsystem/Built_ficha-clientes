import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Printer, EyeOff, Pencil, Trash2, Plus,
} from "lucide-react";

const C = {
  black: "#0A0A0A",
  charcoal: "#2B2B28",
  ash: "#9C9890",
  ivory: "#FAF7F2",
  stone: "#E6E2DC",
};

const supabaseUrl = "https://zngodembjlncpuvkoazc.supabase.co";
const supabaseKey = "sb_publishable_JADnZ6dBDAE3Hb4AhSO_mA_av-6NPJi";
const supabase = createClient(supabaseUrl, supabaseKey);

const CLAVE_ADMIN = "BUILT2026";

const PLANES = [
  "Diagnóstico y Estrategia de Marca",
  "Sistema de Monetización",
  "Página Web / Landing",
  "Sistema Digital + Dashboard",
  "Templates / Activos Digitales",
  "BUILT 360°",
];

const MESES_NOMBRE = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function hoyISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function compressImage(file, maxWidth = 900, quality = 0.7) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function AdminDashboard() {
  const [autenticado, setAutenticado] = useState(
    sessionStorage.getItem("built_admin_ok") === "1"
  );
  const [clave, setClave] = useState("");
  const [errorClave, setErrorClave] = useState("");

  const intentarEntrar = () => {
    if (clave === CLAVE_ADMIN) {
      sessionStorage.setItem("built_admin_ok", "1");
      setAutenticado(true);
    } else {
      setErrorClave("Contraseña incorrecta.");
    }
  };

  if (!autenticado) {
    return (
      <Shell>
        <div style={{ maxWidth: 340, margin: "120px auto", textAlign: "center" }}>
          <div className="prata" style={{ fontSize: 22, marginBottom: 20 }}>
            Panel BUILT
          </div>
          <input
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && intentarEntrar()}
            placeholder="Contraseña"
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 12,
              border: `1px solid ${C.stone}`,
              fontSize: 15,
              marginBottom: 12,
              boxSizing: "border-box",
            }}
          />
          <button
            onClick={intentarEntrar}
            style={{
              background: C.black,
              color: C.ivory,
              border: "none",
              borderRadius: 999,
              padding: "12px 30px",
              fontSize: 14,
              cursor: "pointer",
              width: "100%",
            }}
          >
            Entrar
          </button>
          {errorClave && (
            <div style={{ color: "#B3261E", fontSize: 13, marginTop: 10 }}>{errorClave}</div>
          )}
        </div>
      </Shell>
    );
  }

  return <Dashboard />;
}

function calcularEstado(fechaFin, finalizada) {
  if (finalizada) return { estado: "completada", texto: "Finalizada", color: "success" };
  if (!fechaFin) return { estado: "sin-fecha", texto: "Sin fecha definida", color: "gray" };
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fin = new Date(fechaFin + "T00:00:00");
  const diasRestantes = Math.round((fin - hoy) / (1000 * 60 * 60 * 24));
  if (diasRestantes < 0) return { estado: "vencida", texto: "Vencida (marcar finalizada)", color: "warning" };
  if (diasRestantes <= 5) return { estado: "por-terminar", texto: "Por terminar", color: "warning" };
  return { estado: "en-seguimiento", texto: "En seguimiento", color: "accent" };
}

function Dashboard() {
  const [fichas, setFichas] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [planFiltro, setPlanFiltro] = useState("todos");
  const [vista, setVista] = useState("activas");
  const [tabTareas, setTabTareas] = useState("hoy");
  const [expandido, setExpandido] = useState(null);
  const [editando, setEditando] = useState({});
  const [historialAbierto, setHistorialAbierto] = useState({});
  const [nuevaEntrada, setNuevaEntrada] = useState({});
  const [nuevaFecha, setNuevaFecha] = useState({});
  const [indicesRef, setIndicesRef] = useState({});
  const [guardandoId, setGuardandoId] = useState(null);
  const [mesOffset, setMesOffset] = useState(0);

  const cargar = () => {
    setCargando(true);
    Promise.all([
      supabase.from("fichas_clientes").select("*").order("created_at", { ascending: false }),
      supabase.from("historial_clientes").select("*").order("fecha", { ascending: true }),
    ]).then(([fichasRes, historialRes]) => {
      setFichas(fichasRes.data || []);
      setHistorial(historialRes.data || []);
      setCargando(false);
    });
  };

  useEffect(() => {
    cargar();
  }, []);

  const actualizarCampo = (id, campo, valor) => {
    setFichas((prev) => prev.map((f) => (f.id === id ? { ...f, [campo]: valor } : f)));
  };

  const guardarFicha = async (ficha) => {
    setGuardandoId(ficha.id);
    await supabase
      .from("fichas_clientes")
      .update({
        fecha_fin: ficha.fecha_fin || null,
        plan: ficha.plan || null,
        monto: ficha.monto === "" ? null : ficha.monto,
        finalizada: ficha.finalizada || false,
        profesion: ficha.profesion || null,
        dedicacion: ficha.dedicacion || null,
        tono: ficha.tono || null,
        instagram: ficha.instagram || null,
        tiktok: ficha.tiktok || null,
        notas: ficha.notas || null,
        visualizacion: ficha.visualizacion || null,
        captura_ig: ficha.captura_ig || null,
        referencias: ficha.referencias || null,
      })
      .eq("id", ficha.id);
    setGuardandoId(null);
  };

  const eliminarFicha = async (id, nombre) => {
    const ok = window.confirm(`¿Eliminar la ficha de ${nombre || "esta clienta"}? Esta acción no se puede deshacer.`);
    if (!ok) return;
    await supabase.from("fichas_clientes").delete().eq("id", id);
    setFichas((prev) => prev.filter((f) => f.id !== id));
  };

  const agregarHistorial = async (fichaId) => {
    const texto = (nuevaEntrada[fichaId] || "").trim();
    if (!texto) return;
    const fecha = nuevaFecha[fichaId] || null;
    const { data, error } = await supabase
      .from("historial_clientes")
      .insert([{ ficha_id: fichaId, texto, fecha }])
      .select()
      .single();
    if (!error && data) {
      setHistorial((prev) => [...prev, data]);
      setNuevaEntrada((prev) => ({ ...prev, [fichaId]: "" }));
      setNuevaFecha((prev) => ({ ...prev, [fichaId]: "" }));
    }
  };

  const reemplazarCaptura = async (fichaId, file) => {
    const comprimida = await compressImage(file);
    actualizarCampo(fichaId, "captura_ig", comprimida);
  };

  const agregarReferencia = async (fichaId, file, referenciasActuales) => {
    const comprimida = await compressImage(file, 700, 0.6);
    actualizarCampo(fichaId, "referencias", [...(referenciasActuales || []), comprimida]);
  };

  const quitarReferencia = (fichaId, referenciasActuales, idx) => {
    const nuevas = referenciasActuales.filter((_, i) => i !== idx);
    actualizarCampo(fichaId, "referencias", nuevas);
  };

  const filtradas = fichas.filter((f) => {
    const q = busqueda.toLowerCase();
    const coincideBusqueda =
      (f.nombre || "").toLowerCase().includes(q) || (f.correo || "").toLowerCase().includes(q);
    const coincidePlan = planFiltro === "todos" || f.plan === planFiltro;
    if (!coincideBusqueda || !coincidePlan) return false;
    if (busqueda.trim() !== "") return true;
    if (vista === "todas") return true;
    if (vista === "activas") return !f.finalizada;
    if (vista === "finalizadas") return !!f.finalizada;
    return true;
  });

  const porTerminar = fichas.filter((f) => {
    const est = calcularEstado(f.fecha_fin, f.finalizada).estado;
    return est === "por-terminar" || est === "vencida";
  }).length;

  const ahora = new Date();
  const mesRef = new Date(ahora.getFullYear(), ahora.getMonth() + mesOffset, 1);
  const ingresosMes = fichas
    .filter((f) => {
      if (!f.created_at || !f.monto) return false;
      const d = new Date(f.created_at);
      return d.getFullYear() === mesRef.getFullYear() && d.getMonth() === mesRef.getMonth();
    })
    .reduce((sum, f) => sum + Number(f.monto || 0), 0);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const manana = new Date(hoy);
  manana.setDate(hoy.getDate() + 1);
  const finSemana = new Date(hoy);
  finSemana.setDate(hoy.getDate() + 7);

  const tareasFiltradas = historial
    .filter((h) => h.fecha)
    .filter((h) => {
      const f = new Date(h.fecha + "T00:00:00");
      if (tabTareas === "hoy") return f.getTime() === hoy.getTime();
      if (tabTareas === "manana") return f.getTime() === manana.getTime();
      return f >= hoy && f <= finSemana;
    })
    .map((h) => ({ ...h, ficha: fichas.find((f) => f.id === h.ficha_id) }))
    .filter((h) => h.ficha);

  const imprimirFicha = (f) => {
    const est = calcularEstado(f.fecha_fin, f.finalizada);
    const referenciasHtml =
      f.referencias && f.referencias.length > 0
        ? `<div class="label">Referencias</div><div class="galeria">${f.referencias
            .map((src) => `<img src="${src}" />`)
            .join("")}</div>`
        : "";
    const capturaHtml = f.captura_ig
      ? `<div class="label">Captura de Instagram</div><img class="ig" src="${f.captura_ig}" />`
      : "";
    const ventana = window.open("", "_blank");
    ventana.document.write(`
      <html>
        <head>
          <title>${f.nombre || "Ficha"}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #0A0A0A; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            .sub { color: #9C9890; font-size: 13px; margin-bottom: 20px; }
            .label { font-size: 11px; color: #9C9890; margin-top: 16px; text-transform: uppercase; letter-spacing: 0.03em; }
            .valor { font-size: 15px; margin-top: 2px; }
            .galeria { display: flex; gap: 10px; margin-top: 8px; flex-wrap: wrap; }
            .galeria img { width: 120px; height: 150px; object-fit: cover; border-radius: 8px; }
            .ig { width: 160px; border-radius: 12px; margin-top: 8px; border: 6px solid #0A0A0A; }
          </style>
        </head>
        <body>
          <h1>${f.nombre || ""}</h1>
          <div class="sub">${f.correo || ""} · ${f.profesion || ""}</div>

          <div class="label">Plan</div>
          <div class="valor">${f.plan || "—"}</div>
          <div class="label">Fecha de inicio</div>
          <div class="valor">${f.fecha_ingreso || "—"}</div>
          <div class="label">Fecha de fin</div>
          <div class="valor">${f.fecha_fin || "—"}</div>
          <div class="label">Estado</div>
          <div class="valor">${est.texto}</div>

          <div class="label">¿A qué se dedica?</div>
          <div class="valor">${f.dedicacion || "—"}</div>
          <div class="label">Tono deseado</div>
          <div class="valor">${f.tono || "—"}</div>
          <div class="label">Instagram</div>
          <div class="valor">${f.instagram || "—"}</div>
          <div class="label">TikTok</div>
          <div class="valor">${f.tiktok || "—"}</div>
          <div class="label">Notas</div>
          <div class="valor">${f.notas || "—"}</div>
          <div class="label">¿Cómo se visualiza?</div>
          <div class="valor">${f.visualizacion || "—"}</div>
          <div class="label">Notas sobre referencias</div>
          <div class="valor">${f.notas_referencias || "—"}</div>

          ${capturaHtml}
          ${referenciasHtml}
        </body>
      </html>
    `);
    ventana.document.close();
    ventana.print();
  };

  return (
    <Shell>
      <div className="prata" style={{ fontSize: 24, marginBottom: 4 }}>
        Panel BUILT
      </div>
      <div style={{ color: C.ash, fontSize: 13, marginBottom: 20 }}>
        Fichas de ingreso de clientas
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
        {[["hoy", "Hoy"], ["manana", "Mañana"], ["semana", "Esta semana"]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTabTareas(key)}
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: 10,
              border: `1px solid ${C.stone}`,
              background: tabTareas === key ? C.black : "#fff",
              color: tabTareas === key ? C.ivory : C.charcoal,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div style={{ background: C.ivory, border: `1px solid ${C.stone}`, borderRadius: 12, padding: "10px 14px", marginBottom: 24 }}>
        {tareasFiltradas.length === 0 ? (
          <div style={{ fontSize: 13, color: C.ash }}>Sin tareas en este rango.</div>
        ) : (
          tareasFiltradas.map((t) => (
            <div key={t.id} style={{ padding: "6px 0", borderBottom: `1px solid ${C.stone}` }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{t.texto}</div>
              <div style={{ fontSize: 12, color: C.ash }}>{t.ficha?.nombre} · {t.fecha}</div>
            </div>
          ))
        )}
      </div>

      <select
        value={planFiltro}
        onChange={(e) => setPlanFiltro(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: 12,
          border: `1px solid ${C.stone}`,
          fontSize: 14,
          marginBottom: 16,
          background: "#fff",
        }}
      >
        <option value="todos">Todos los planes</option>
        {PLANES.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <StatCard label="Fichas totales" value={fichas.length} />
        <StatCard label="Por terminar" value={porTerminar} tone="warning" />
      </div>

      <div style={{ background: "#EAF3DE", borderRadius: 16, padding: "14px 18px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => setMesOffset((m) => m - 1)} style={arrowBtnStyle}>
            <ChevronLeft size={16} color="#3B6D11" />
          </button>
          <div style={{ fontSize: 13, color: "#3B6D11" }}>
            {MESES_NOMBRE[mesRef.getMonth()]} {mesRef.getFullYear()}
          </div>
          <button onClick={() => setMesOffset((m) => Math.min(0, m + 1))} style={arrowBtnStyle} disabled={mesOffset === 0}>
            <ChevronRight size={16} color={mesOffset === 0 ? "#B4B2A9" : "#3B6D11"} />
          </button>
        </div>
        <div style={{ fontSize: 24, fontWeight: 600, color: "#27500A", textAlign: "center", marginTop: 4 }}>
          ${ingresosMes.toLocaleString()}
        </div>
        <div style={{ fontSize: 12, color: "#3B6D11", textAlign: "center" }}>Ingresos del mes</div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o correo"
          style={{ flex: 1, padding: "10px 16px", borderRadius: 12, border: `1px solid ${C.stone}`, fontSize: 14 }}
        />
        <button
          onClick={cargar}
          style={{ background: "#fff", border: `1px solid ${C.stone}`, borderRadius: 12, padding: "10px 18px", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}
        >
          Actualizar
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[["activas", "Activas"], ["finalizadas", "Finalizadas"], ["todas", "Todas"]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setVista(key)}
            style={{
              flex: 1,
              padding: "6px",
              borderRadius: 999,
              border: `1px solid ${C.stone}`,
              background: vista === key ? C.charcoal : "#fff",
              color: vista === key ? C.ivory : C.charcoal,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {cargando ? (
        <p style={{ color: C.ash, fontSize: 14 }}>Cargando...</p>
      ) : filtradas.length === 0 ? (
        <p style={{ color: C.ash, fontSize: 14 }}>No hay fichas en esta vista.</p>
      ) : (
        filtradas.map((f) => {
          const est = calcularEstado(f.fecha_fin, f.finalizada);
          const abierta = expandido === f.id;
          const editandoEsta = !!editando[f.id];
          const historialFicha = historial.filter((h) => h.ficha_id === f.id);
          return (
            <div key={f.id} className="card">
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                onClick={() => setExpandido(abierta ? null : f.id)}
              >
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{f.nombre || "(sin nombre)"}</div>
                  <div style={{ fontSize: 13, color: C.ash }}>{f.plan || "Sin plan asignado"}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 8, background: badgeBg(est.color), color: badgeText(est.color) }}>
                    {est.texto}
                  </span>
                  {abierta ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {abierta && (
                <div style={{ marginTop: 16, borderTop: `1px solid ${C.stone}`, paddingTop: 16 }}>
                  {f.correo && <div style={{ fontSize: 13, color: C.ash, marginBottom: 12 }}>{f.correo}</div>}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                    <div>
                      <label style={labelStyle}>Fecha inicio</label>
                      <div style={{ ...inputStyle, color: C.charcoal, background: C.stone, display: "flex", alignItems: "center" }}>
                        {f.fecha_ingreso || "—"}
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Fecha fin</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="AAAA-MM-DD"
                        value={f.fecha_fin || ""}
                        onChange={(e) => actualizarCampo(f.id, "fecha_fin", e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 4 }}>
                    <div>
                      <label style={labelStyle}>Plan</label>
                      <select
                        value={f.plan || ""}
                        onChange={(e) => actualizarCampo(f.id, "plan", e.target.value)}
                        style={inputStyle}
                      >
                        <option value="">Sin asignar</option>
                        {PLANES.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>
                        Monto pagado <EyeOff size={12} style={{ verticalAlign: -1 }} />
                      </label>
                      <input
                        type="number"
                        value={f.monto ?? ""}
                        onChange={(e) => actualizarCampo(f.id, "monto", e.target.value)}
                        placeholder="$"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: C.ash, marginBottom: 12 }}>
                    El monto no aparece al imprimir.
                  </div>

                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 14, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={!!f.finalizada}
                      onChange={(e) => actualizarCampo(f.id, "finalizada", e.target.checked)}
                    />
                    Marcar como finalizada
                  </label>

                  <div style={{ borderTop: `1px solid ${C.stone}`, paddingTop: 14, marginBottom: 14 }}>
                    <div
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                      onClick={() => setHistorialAbierto((prev) => ({ ...prev, [f.id]: !prev[f.id] }))}
                    >
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        Historial <span style={{ color: C.ash, fontWeight: 400 }}>({historialFicha.length})</span>
                      </div>
                      {historialAbierto[f.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>

                    {historialAbierto[f.id] && (
                      <div style={{ marginTop: 12 }}>
                        {historialFicha.length > 0 && (
                          <div style={{ borderLeft: `2px solid ${C.stone}`, paddingLeft: 14, marginLeft: 4, marginBottom: 12 }}>
                            {historialFicha.map((h) => (
                              <div key={h.id} style={{ marginBottom: 12, position: "relative" }}>
                                <div style={{ position: "absolute", left: -19, top: 3, width: 8, height: 8, borderRadius: "50%", background: C.black }} />
                                <div style={{ fontSize: 12, color: C.ash }}>{h.fecha || "sin fecha"}</div>
                                <div style={{ fontSize: 14 }}>{h.texto}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 8 }}>
                          <input
                            type="text"
                            placeholder="Nueva entrada..."
                            value={nuevaEntrada[f.id] || ""}
                            onChange={(e) => setNuevaEntrada((prev) => ({ ...prev, [f.id]: e.target.value }))}
                            style={{ ...inputStyle, flex: 1 }}
                          />
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="AAAA-MM-DD"
                            value={nuevaFecha[f.id] || ""}
                            onChange={(e) => setNuevaFecha((prev) => ({ ...prev, [f.id]: e.target.value }))}
                            style={{ ...inputStyle, width: 120 }}
                          />
                          <button onClick={() => agregarHistorial(f.id)} style={{ ...secondaryBtnStyle, flex: "none", width: 40 }} aria-label="Agregar">
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => guardarFicha(f)}
                    disabled={guardandoId === f.id}
                    style={{
                      background: C.black, color: C.ivory, border: "none", borderRadius: 999,
                      padding: "8px 20px", fontSize: 13, cursor: "pointer", width: "100%", marginBottom: 16,
                    }}
                  >
                    {guardandoId === f.id ? "Guardando..." : "Guardar cambios"}
                  </button>

                  <div
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: 10 }}
                    onClick={() => setEditando((prev) => ({ ...prev, [f.id]: !prev[f.id] }))}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Datos de la ficha</div>
                    <span style={{ fontSize: 13, color: C.charcoal, display: "flex", alignItems: "center", gap: 4 }}>
                      <Pencil size={13} /> {editandoEsta ? "Listo" : "Editar"}
                    </span>
                  </div>

                  {editandoEsta ? (
                    <>
                      <CampoEditable label="Profesión" value={f.profesion} onChange={(v) => actualizarCampo(f.id, "profesion", v)} />
                      <CampoEditable label="¿A qué se dedica?" value={f.dedicacion} onChange={(v) => actualizarCampo(f.id, "dedicacion", v)} area />
                      <CampoEditable label="Tono deseado" value={f.tono} onChange={(v) => actualizarCampo(f.id, "tono", v)} />
                      <CampoEditable label="Instagram" value={f.instagram} onChange={(v) => actualizarCampo(f.id, "instagram", v)} />
                      <CampoEditable label="TikTok" value={f.tiktok} onChange={(v) => actualizarCampo(f.id, "tiktok", v)} />
                      <CampoEditable label="Notas" value={f.notas} onChange={(v) => actualizarCampo(f.id, "notas", v)} area />
                      <CampoEditable label="¿Cómo se visualiza?" value={f.visualizacion} onChange={(v) => actualizarCampo(f.id, "visualizacion", v)} area />

                      <div style={{ marginTop: 10 }}>
                        <label style={labelStyle}>Captura de Instagram</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files[0] && reemplazarCaptura(f.id, e.target.files[0])}
                        />
                      </div>

                      <div style={{ marginTop: 10 }}>
                        <label style={labelStyle}>Referencias</label>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                          {(f.referencias || []).map((src, i) => (
                            <div key={i} style={{ position: "relative" }}>
                              <img src={src} alt={`ref ${i}`} style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 8 }} />
                              <button
                                onClick={() => quitarReferencia(f.id, f.referencias, i)}
                                style={{
                                  position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%",
                                  background: "#B3261E", color: "#fff", border: "none", fontSize: 11, cursor: "pointer", lineHeight: 1,
                                }}
                                aria-label="Quitar"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files[0] && agregarReferencia(f.id, e.target.files[0], f.referencias)}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <Detalle label="Profesión" value={f.profesion} />
                      <Detalle label="¿A qué se dedica?" value={f.dedicacion} />
                      <Detalle label="Tono deseado" value={f.tono} />
                      <Detalle label="Instagram" value={f.instagram} />
                      <Detalle label="TikTok" value={f.tiktok} />
                      <Detalle label="Notas" value={f.notas} />
                      <Detalle label="¿Cómo se visualiza?" value={f.visualizacion} />

                      {f.captura_ig && (
                        <div style={{ marginTop: 16 }}>
                          <div style={{ fontSize: 11, color: C.ash, marginBottom: 8 }}>Captura de Instagram</div>
                          <div style={{ width: 160, background: C.stone, borderRadius: 24, padding: 14, display: "flex", justifyContent: "center" }}>
                            <div style={{ width: "100%", aspectRatio: "9/19.5", background: "#fff", borderRadius: 16, border: `4px solid ${C.black}`, overflow: "hidden" }}>
                              <img src={f.captura_ig} alt="IG" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                          </div>
                        </div>
                      )}

                      {f.referencias && f.referencias.length > 0 && (() => {
                        const idx = indicesRef[f.id] || 0;
                        const total = f.referencias.length;
                        const mover = (delta) => setIndicesRef((prev) => ({ ...prev, [f.id]: (idx + delta + total) % total }));
                        return (
                          <div style={{ marginTop: 16 }}>
                            <div style={{ fontSize: 11, color: C.ash, marginBottom: 6 }}>Referencias</div>
                            <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", background: C.stone, maxWidth: 260 }}>
                              <img src={f.referencias[idx]} alt={`referencia ${idx + 1}`} style={{ width: "100%", display: "block", aspectRatio: "4/5", objectFit: "cover" }} />
                              <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(10,10,10,0.55)", color: C.ivory, fontSize: 11, padding: "3px 9px", borderRadius: 999 }}>
                                {idx + 1} / {total}
                              </div>
                              {total > 1 && (
                                <>
                                  <button onClick={() => mover(-1)} style={carruselBtnStyle("left")}><ChevronLeft size={15} /></button>
                                  <button onClick={() => mover(1)} style={carruselBtnStyle("right")}><ChevronRight size={15} /></button>
                                </>
                              )}
                            </div>
                            <div style={{ display: "flex", gap: 6, marginTop: 8, overflowX: "auto" }}>
                              {f.referencias.map((src, i) => (
                                <img
                                  key={i}
                                  src={src}
                                  alt={`mini ${i}`}
                                  onClick={() => setIndicesRef((prev) => ({ ...prev, [f.id]: i }))}
                                  style={{
                                    width: 44, height: 44, objectFit: "cover", borderRadius: 8, cursor: "pointer", flexShrink: 0,
                                    border: i === idx ? `2px solid ${C.black}` : "2px solid transparent",
                                    opacity: i === idx ? 1 : 0.5,
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  )}

                  <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                    <button onClick={() => imprimirFicha(f)} style={secondaryBtnStyle}>
                      <Printer size={14} style={{ verticalAlign: -2, marginRight: 6 }} />
                      Imprimir
                    </button>
                    <button onClick={() => eliminarFicha(f.id, f.nombre)} style={{ ...secondaryBtnStyle, color: "#B3261E", borderColor: "#F0999B" }}>
                      <Trash2 size={14} style={{ verticalAlign: -2, marginRight: 6 }} />
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </Shell>
  );
}

function CampoEditable({ label, value, onChange, area }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={labelStyle}>{label}</label>
      {area ? (
        <textarea rows={2} value={value || ""} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle, height: "auto", resize: "none" }} />
      ) : (
        <input type="text" value={value || ""} onChange={(e) => onChange(e.target.value)} style={inputStyle} />
      )}
    </div>
  );
}

const labelStyle = { fontSize: 12, color: "#9C9890", display: "block", marginBottom: 4 };
const inputStyle = {
  width: "100%",
  height: 36,
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #E6E2DC",
  fontSize: 13,
  boxSizing: "border-box",
  background: "#fff",
};
const arrowBtnStyle = { border: "none", background: "transparent", cursor: "pointer", padding: 4 };
function carruselBtnStyle(side) {
  return {
    position: "absolute", top: "50%", [side]: 8, transform: "translateY(-50%)",
    background: "#fff", border: "none", borderRadius: "50%", width: 28, height: 28,
    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
  };
}
const secondaryBtnStyle = {
  flex: 1, background: "#fff", border: "1px solid #E6E2DC", borderRadius: 999,
  padding: "8px 14px", fontSize: 13, cursor: "pointer",
};

function badgeBg(color) {
  const map = { warning: "#FAEEDA", accent: "#E6F1FB", success: "#EAF3DE", gray: "#F1EFE8" };
  return map[color] || map.gray;
}
function badgeText(color) {
  const map = { warning: "#854F0B", accent: "#185FA5", success: "#3B6D11", gray: "#5F5E5A" };
  return map[color] || map.gray;
}

function StatCard({ label, value, tone }) {
  return (
    <div style={{ flex: 1, background: tone === "warning" ? "#FAEEDA" : "#fff", borderRadius: 16, padding: "16px 18px", boxShadow: tone === "warning" ? "none" : "0 6px 18px rgba(10,10,10,0.05)" }}>
      <div style={{ fontSize: 26, fontWeight: 700, color: tone === "warning" ? "#854F0B" : C.black }}>{value}</div>
      <div style={{ fontSize: 12, color: tone === "warning" ? "#854F0B" : C.ash }}>{label}</div>
    </div>
  );
}

function Detalle({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 11, color: C.ash }}>{label}</div>
      <div style={{ fontSize: 14 }}>{value}</div>
    </div>
  );
}

function Shell({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: C.ivory, color: C.black, fontFamily: "'Montserrat', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Prata&family=Montserrat:wght@400;500;600;700&display=swap');
        .prata { font-family: 'Prata', serif; }
        .card { background: #fff; border-radius: 18px; box-shadow: 0 6px 18px rgba(10,10,10,0.05); padding: 18px 22px; margin-bottom: 14px; }
      `}</style>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 80px" }}>{children}</div>
    </div>
  );
}

