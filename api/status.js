import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Öffentlicher Endpunkt: liefert NUR Kursnamen und freie Plätze.
// Es werden hier bewusst keine Schülernamen zurückgegeben.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rows = await sql`
      SELECT k.id, k.name, k.kapazitaet,
             COUNT(a.id)::int AS belegt
      FROM kurse k
      LEFT JOIN anmeldungen a ON a.kurs_id = k.id
      GROUP BY k.id, k.name, k.kapazitaet
      ORDER BY k.id;
    `;

    const kurse = rows.map((k) => ({
      id: k.id,
      name: k.name,
      kapazitaet: k.kapazitaet,
      belegt: k.belegt,
      frei: k.kapazitaet - k.belegt,
      voll: k.belegt >= k.kapazitaet,
    }));

    res.status(200).json({ kurse });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler beim Laden der Kurse.' });
  }
}
