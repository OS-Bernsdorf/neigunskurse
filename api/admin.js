import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Geschützter Endpunkt: nur mit korrektem Passwort (ADMIN_PASSWORD env var) erreichbar.
// Liefert die vollständige Anmeldeliste inkl. Namen.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const password = req.headers['x-admin-password'] || req.query.password;
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Nicht autorisiert. Falsches Passwort.' });
  }

  try {
    const rows = await sql`
      SELECT a.name, a.klasse, k.name AS kurs, a.erstellt_am
      FROM anmeldungen a
      JOIN kurse k ON k.id = a.kurs_id
      ORDER BY k.name, a.klasse, a.name;
    `;

    if (req.query.format === 'csv') {
      const header = 'Name;Klasse;Kurs;Angemeldet am\n';
      const csv = rows
        .map(
          (r) =>
            `${r.name};${r.klasse};${r.kurs};${new Date(r.erstellt_am).toLocaleString('de-DE')}`
        )
        .join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="anmeldungen.csv"');
      return res.status(200).send(header + csv);
    }

    return res.status(200).json({ anmeldungen: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Serverfehler beim Laden der Liste.' });
  }
}
