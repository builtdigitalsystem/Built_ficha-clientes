import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { ChevronDown, ChevronUp } from "lucide-react";

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

// Cambia esta contraseña por la que quieras usar.
const CLAVE_ADMIN = "BUILT2026";

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

function Dashboard() {
  const [fichas, setFichas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [expandido, setExpandido] = useState(null);

  const cargar = () => {
    setCargando(true);
    supabase
      .from("fichas_clientes")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setFichas(data || []);
        setCargando(false);
      });
  };

  useEffect(() => {
    cargar();
  }, []);

  const filtradas = fichas.filter((f) => {
    const q = busqueda.toLowerCase();
    return (
      (f.nombre || "").toLowerCase().includes(q) ||
      (f.profesion || "").toLowerCase().includes(q) ||
      (f.instagram || "").toLowerCase().includes(q)
    );
  });

  const monetizanSi = fichas.filter((f) => f.monetiza === true).length;

  return (
    <Shell>
      <div className="prata" style={{ fontSize: 24, marginBottom: 4 }}>
        Panel BUILT
      </div>
      <div style={{ color: C.ash, fontSize: 13, marginBottom: 24 }}>
        Fichas de ingreso de clientas
      </div>

      <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
        <StatCard label="Fichas totales" value={fichas.length} />
        <StatCard label="Monetizan (Sí)" value={monetizanSi} />
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, profesión o Instagram..."
          style={{
            flex: 1,
            padding: "10px 16px",
            borderRadius: 12,
            border: `1px solid ${C.stone}`,
            fontSize: 14,
          }}
        />
        <button
          onClick={cargar}
          style={{
            background: "#fff",
            border: `1px solid ${C.stone}`,
            borderRadius: 12,
            padding: "10px 18px",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Actualizar
        </button>
      </div>

      {cargando ? (
        <p style={{ color: C.ash, fontSize: 14 }}>Cargando...</p>
      ) : filtradas.length === 0 ? (
        <p style={{ color: C.ash, fontSize: 14 }}>No hay fichas todavía.</p>
      ) : (
        filtradas.map((f) => (
          <div key={f.id} className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
              }}
              onClick={() => setExpandido(expandido === f.id ? null : f.id)}
            >
              <div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{f.nombre || "(sin nombre)"}</div>
                <div style={{ fontSize: 13, color: C.ash }}>
                  {f.profesion} · {f.fecha_ingreso}
                </div>
              </div>
              {expandido === f.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>

            {expandido === f.id && (
              <div style={{ marginTop: 16, borderTop: `1px solid ${C.stone}`, paddingTop: 16 }}>
                <Detalle label="¿A qué se dedica?" value={f.dedicacion} />
                <Detalle label="Tono deseado" value={f.tono} />
                <Detalle label="Instagram" value={f.instagram} />
                <Detalle label="TikTok" value={f.tiktok} />
                <Detalle label="Monetiza" value={f.monetiza ? "Sí" : "No"} />
                <Detalle label="Notas" value={f.notas} />
                <Detalle label="Notas sobre referencias" value={f.notas_referencias} />
                <Detalle label="¿Cómo se visualiza?" value={f.visualizacion} />

                {f.captura_ig && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, color: C.ash, marginBottom: 6 }}>Captura de Instagram</div>
                    <img src={f.captura_ig} alt="IG" style={{ maxWidth: 160, borderRadius: 12 }} />
                  </div>
                )}

                {f.referencias && f.referencias.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, color: C.ash, marginBottom: 6 }}>Referencias</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {f.referencias.map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt={`ref ${i}`}
                          style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8 }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </Shell>
  );
}

function StatCard({ label, value }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: "16px 22px",
        boxShadow: "0 6px 18px rgba(10,10,10,0.05)",
        minWidth: 130,
      }}
    >
      <div style={{ fontSize: 26, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 12, color: C.ash }}>{label}</div>
    </div>
  );
}

function Detalle({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 10 }}>
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
        .card {
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 6px 18px rgba(10,10,10,0.05);
          padding: 18px 22px;
          margin-bottom: 14px;
        }
      `}</style>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 80px" }}>{children}</div>
    </div>
  );
}
