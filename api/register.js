import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Anmelde-Endpunkt: fügt NUR neue Zeilen ein, es gibt keine Möglichkeit,
// bestehende Anmeldungen über diesen Endpunkt zu ändern oder zu löschen.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Serverseitige Startsperre: verhindert Anmeldungen vor dem offiziellen Start,
  // auch wenn jemand versucht, direkt auf die Schnittstelle zuzugreifen.
  const startEnv = process.env.REGISTRATION_START;
  if (startEnv) {
    const start = new Date(startEnv);
    if (!isNaN(start.getTime()) && new Date() < start) {
      return res.status(403).json({
        error: `Die Anmeldung ist noch nicht geöffnet. Start: ${start.toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })} Uhr`,
      });
    }
  }

  const { name, klasse, kursId } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Bitte einen gültigen Namen angeben.' });
  }
  if (!klasse || typeof klasse !== 'string' || klasse.trim().length < 1) {
    return res.status(400).json({ error: 'Bitte eine gültige Klasse angeben.' });
  }
  if (!kursId || isNaN(parseInt(kursId, 10))) {
    return res.status(400).json({ error: 'Bitte einen Kurs auswählen.' });
  }

  const cleanName = name.trim().slice(0, 100);
  const cleanKlasse = klasse.trim().slice(0, 20);
  const kid = parseInt(kursId, 10);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // FOR UPDATE sperrt die Kurszeile, damit bei gleichzeitigen Anmeldungen
    // niemand über die Kapazität hinaus eingetragen wird (kein Überbuchen möglich).
    const kursRes = await client.query(
      'SELECT id, name, kapazitaet FROM kurse WHERE id = $1 FOR UPDATE',
      [kid]
    );
    if (kursRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Kurs nicht gefunden.' });
    }
    const kurs = kursRes.rows[0];

    const countRes = await client.query(
      'SELECT COUNT(*)::int AS belegt FROM anmeldungen WHERE kurs_id = $1',
      [kid]
    );
    const belegt = countRes.rows[0].belegt;

    if (belegt >= kurs.kapazitaet) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: `"${kurs.name}" ist leider schon voll. Bitte einen anderen Kurs wählen.` });
    }

    const dupRes = await client.query(
      'SELECT id FROM anmeldungen WHERE lower(name) = lower($1) AND lower(klasse) = lower($2)',
      [cleanName, cleanKlasse]
    );
    if (dupRes.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Für diesen Namen und diese Klasse liegt bereits eine Anmeldung vor.' });
    }

    await client.query(
      'INSERT INTO anmeldungen (name, klasse, kurs_id) VALUES ($1, $2, $3)',
      [cleanName, cleanKlasse, kid]
    );

    await client.query('COMMIT');
    return res.status(200).json({ success: true, kurs: kurs.name });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return res.status(500).json({ error: 'Serverfehler bei der Anmeldung.' });
  } finally {
    client.release();
  }
}
