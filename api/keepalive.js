// Visita automática semanal para que Supabase no pause la base de datos
const SUPABASE_URL = "https://zngodembjlncpuvkoazc.supabase.co";
const SUPABASE_KEY = "sb_publishable_JADnZ6dBDAE3Hb4AhSO_mA_av-6NPJi";

export default async function handler(req, res) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/fichas_clientes?select=id&limit=1`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    res.status(200).json({ ok: r.ok, estado: r.status, fecha: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
}
