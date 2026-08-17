-- Einmalig in der Vercel Postgres Konsole (Reiter "Query") ausführen.
-- Bitte VOR dem Ausführen die 5 Kursnamen und Kapazitäten unten anpassen!

CREATE TABLE IF NOT EXISTS kurse (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  kapazitaet INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS anmeldungen (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  klasse TEXT NOT NULL,
  kurs_id INTEGER NOT NULL REFERENCES kurse(id),
  erstellt_am TIMESTAMPTZ DEFAULT now()
);

-- Nur einmal ausführen! Bei erneutem Ausführen entstehen doppelte Kurse.
INSERT INTO kurse (name, kapazitaet) VALUES
  ('Kurs 1 (bitte anpassen)', 15),
  ('Kurs 2 (bitte anpassen)', 15),
  ('Kurs 3 (bitte anpassen)', 15),
  ('Kurs 4 (bitte anpassen)', 15),
  ('Kurs 5 (bitte anpassen)', 15);
