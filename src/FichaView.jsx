import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { User, Briefcase, FileText, Eye, Calendar, Instagram, Music2 } from "lucide-react";

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

export default function FichaView() {
  const [ficha, setFicha] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [indiceRef, setIndiceRef] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) {
      setError("Link inválido: falta el identificador de la ficha.");
      setCargando(false);
      return;
    }
    supabase
      .from("fichas_clientes")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        setCargando(false);
        if (error || !data) {
          setError("No se encontró esta ficha.");
        } else {
          setFicha(data);
        }
      });
  }, []);

  if (cargando) {
    return (
      <Wrapper>
        <p style={{ color: C.ash, fontSize: 14 }}>Cargando ficha...</p>
      </Wrapper>
    );
  }

  if (error) {
    return (
      <Wrapper>
        <p style={{ color: "#B3261E", fontSize: 14 }}>{error}</p>
      </Wrapper>
    );
  }

  const referencias = ficha.referencias || [];

  return (
    <Wrapper>
      <div
        className="prata"
        style={{
          display: "inline-block",
          background: C.black,
          color: C.ivory,
          padding: "10px 24px",
          borderRadius: 999,
          fontSize: 18,
          margin: "0 0 28px",
        }}
      >
        Tu ficha de ingreso
      </div>

      <div className="card">
        <Row icon={<Calendar size={16} />} label="Fecha de ingreso" value={ficha.fecha_ingreso} />
        <Row icon={<User size={16} />} label="Nombre completo" value={ficha.nombre} />
        <Row icon={<Briefcase size={16} />} label="Profesión" value={ficha.profesion} />
        <Row icon={<FileText size={16} />} label="¿A qué se dedica?" value={ficha.dedicacion} />
      </div>

      <div className="card">
        <Row icon={<Eye size={16} />} label="¿Cómo te gustaría que te perciban?" value={ficha.tono} />
        <Row icon={<Instagram size={16} />} label="Instagram" value={ficha.instagram} />
        <Row icon={<Music2 size={16} />} label="TikTok" value={ficha.tiktok} />
      </div>

      {ficha.captura_ig && (
        <div style={{ margin: "24px 0" }}>
          <div style={{ fontSize: 11, color: C.ash, marginBottom: 8 }}>Captura de Instagram</div>
          <img
            src={ficha.captura_ig}
            alt="Instagram"
            style={{ maxWidth: 240, borderRadius: 16, border: `6px solid ${C.black}` }}
          />
        </div>
      )}

      {referencias.length > 0 && (
        <div style={{ margin: "24px 0" }}>
          <div style={{ fontSize: 11, color: C.ash, marginBottom: 8 }}>Referencias visuales</div>
          <img
            src={referencias[indiceRef]}
            alt="referencia"
            style={{ width: "100%", maxWidth: 420, borderRadius: 16, display: "block", marginBottom: 10 }}
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {referencias.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`mini ${i}`}
                onClick={() => setIndiceRef(i)}
                style={{
                  width: 48,
                  height: 48,
                  objectFit: "cover",
                  borderRadius: 8,
                  cursor: "pointer",
                  border: i === indiceRef ? `2px solid ${C.black}` : "2px solid transparent",
                  opacity: i === indiceRef ? 1 : 0.55,
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <Row icon={<FileText size={16} />} label="Notas sobre las referencias" value={ficha.notas_referencias} />
        <Row icon={<Eye size={16} />} label="¿Cómo te visualizas?" value={ficha.visualizacion} />
      </div>
    </Wrapper>
  );
}

function Row({ icon, label, value }) {
  if (!value) return null;
  return (
    <div className="row">
      <div className="row-icon">{icon}</div>
      <div className="row-content">
        <div className="row-label">{label}</div>
        <div style={{ fontSize: 15 }}>{value}</div>
      </div>
    </div>
  );
}

function Wrapper({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: C.ivory, color: C.black, fontFamily: "'Montserrat', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Prata&family=Montserrat:wght@400;500;600;700&display=swap');
        .prata { font-family: 'Prata', serif; }
        .card {
          background: #fff;
          border-radius: 22px;
          box-shadow: 0 10px 30px rgba(10,10,10,0.06);
          padding: 4px 22px;
          margin-bottom: 22px;
          max-width: 520px;
        }
        .row {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 18px 0;
          border-bottom: 1px solid ${C.stone};
        }
        .row:last-child { border-bottom: none; }
        .row-icon {
          width: 36px; height: 36px; min-width: 36px;
          border-radius: 50%;
          background: ${C.ivory};
          border: 1px solid ${C.stone};
          display: flex; align-items: center; justify-content: center;
          color: ${C.charcoal};
        }
        .row-label { font-size: 11px; color: ${C.ash}; margin-bottom: 4px; }
      `}</style>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 28px 80px" }}>{children}</div>
    </div>
  );
}
