# Neigungskurs-Anmeldung – Deployment-Anleitung

Diese kleine Web-App besteht aus:
- einer öffentlichen Anmeldeseite (`public/index.html`) – zeigt nur freie Plätze, keine Namen
- einer passwortgeschützten Admin-Seite (`public/admin.html`) – zeigt alle Anmeldungen
- drei Server-Funktionen (`api/status.js`, `api/register.js`, `api/admin.js`)
- einer Postgres-Datenbank bei Vercel

Wichtig: Der Code wurde nach der offiziellen Vercel/@vercel-postgres-Syntax geschrieben,
aber in dieser Umgebung nicht live getestet (kein Internetzugriff hier). Bitte nach dem
Deployment einmal in Ruhe selbst durchklicken, bevor ihr die Schüler:innen einladet.

## Schritt 1 – Konto & Projekt

1. Gehe auf https://vercel.com und erstelle ein kostenloses Konto (am einfachsten mit
   einem GitHub-Account).
2. Lade diesen gesamten Ordner (`kurswahl-app`) in ein neues, **privates** GitHub-Repository hoch.
   (Einfachster Weg ohne Kommandozeile: auf github.com „New repository" → „uploading an existing file"
   → alle Dateien aus diesem Ordner per Drag&Drop hochladen.)
3. In Vercel: „Add New… → Project" → das eben erstellte Repository auswählen → „Deploy".
   Der erste Deploy-Versuch schlägt evtl. fehl, weil die Datenbank noch fehlt – das ist normal,
   weiter mit Schritt 2.

## Schritt 2 – Datenbank anlegen (wichtig: Region Frankfurt wählen)

1. Im Vercel-Projekt: Reiter „Storage" → „Create Database" → „Postgres".
2. **Region: Frankfurt (fra1)** auswählen – so bleiben die Daten in der EU.
3. Datenbank mit dem Projekt verknüpfen lassen (Vercel bietet das automatisch an).
   Dadurch werden die nötigen Umgebungsvariablen automatisch gesetzt.
4. Im Reiter „Query" der Datenbank den Inhalt von `schema.sql` einfügen –
   **vorher die 5 Platzhalter-Kursnamen und Kapazitäten durch eure echten Kurse ersetzen** –
   und ausführen.

## Schritt 3 – Admin-Passwort setzen

1. Im Vercel-Projekt: „Settings" → „Environment Variables".
2. Neue Variable anlegen: Name `ADMIN_PASSWORD`, Wert = ein sicheres Passwort deiner Wahl
   (nur für dich, nicht mit Schüler:innen teilen).
3. Speichern.

## Schritt 4 – Neu deployen

1. Im Reiter „Deployments" auf die drei Punkte beim letzten Deployment → „Redeploy",
   damit die neuen Umgebungsvariablen (Datenbank + Passwort) übernommen werden.

## Schritt 5 – Testen

- Anmeldeseite: `https://EUER-PROJEKTNAME.vercel.app`
- Admin-Ansicht: `https://EUER-PROJEKTNAME.vercel.app/admin.html`

Meldet euch selbst testweise mit 1–2 Fake-Einträgen an und prüft:
- Wird die Zählung auf der Startseite korrekt aktualisiert?
- Erscheint der Eintrag in der Admin-Ansicht?
- Funktioniert der CSV-Export?
- Lässt sich ein voller Kurs nicht mehr auswählen?

Danach die Test-Einträge über das „Query"-Fenster der Datenbank wieder löschen
(`DELETE FROM anmeldungen;`), bevor ihr live geht.

## Datenschutz-Hinweise

- Es werden ausschließlich Name, Klasse und Kurswahl gespeichert – keine E-Mail-Adresse,
  keine IP-Adressen-Auswertung o.ä.
- Datenbank läuft in der EU-Region Frankfurt.
- Schüler:innen sehen zu keinem Zeitpunkt die Namen anderer Schüler:innen.
- **Vor dem Livegang unbedingt mit Schulleitung/Datenschutzbeauftragter abstimmen** –
  auch bei technisch guter Umsetzung braucht die Verarbeitung personenbezogener Daten
  von Minderjährigen eine offizielle Freigabe eurer Schule.
- Löscht die Anmeldedaten (`DELETE FROM anmeldungen;` in der Datenbank-Konsole) nach
  Abschluss der Kurswahl gemäß den Löschfristen eurer Schule, oder löscht das ganze
  Vercel-Projekt.

## Kursnamen/Kapazitäten später ändern

Direkt in der Datenbank-„Query"-Konsole, z. B.:

```sql
UPDATE kurse SET name = 'Robotik AG', kapazitaet = 20 WHERE id = 1;
```
