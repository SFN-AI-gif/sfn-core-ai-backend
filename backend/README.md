# SFN Core AI Backend

Dieses Backend stellt die API für SFN Core AI bereit, wie in der Projektstruktur.md beschrieben.

## Installation

1. In das Backend-Verzeichnis wechseln:
   ```
   cd backend
   ```
2. Abhängigkeiten installieren:
   ```
   npm install
   ```

## Starten

```bash
npm start
```

Der Server läuft standardmäßig auf http://localhost:3000

## API-Endpunkte

- `POST /api/chat` – Chatnachricht verarbeiten (Anbindung an OpenAI GPT-4o geplant)
- `POST /api/upload` – Datei-Upload (PDF, XLS, DOC, TXT, CSV)
- `GET /api/benchmarks` – Benchmarks abrufen
- `POST /api/export` – Export (PDF, CSV, DOCX)

Weitere Details und Implementierung folgen gemäß Projektstruktur.md. 