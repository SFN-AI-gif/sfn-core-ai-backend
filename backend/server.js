require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse'); // npm install pdf-parse
const mammoth = require('mammoth'); // npm install mammoth
const xlsx = require('xlsx'); // npm install xlsx
const { parse } = require('csv-parse/sync'); // npm install csv-parse
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const WEAVIATE_URL = process.env.WEAVIATE_URL;
const WEAVIATE_API_KEY = process.env.WEAVIATE_API_KEY;

// Multer-Konfiguration für Datei-Uploads
const upload = multer({ dest: 'uploads/' });

// --- API ENDPOINTS GEMÄSS PROJEKTSTRUKTUR.MD ---

// 1. Chat: POST /api/chat (mit Kontextintegration und Kontext-Quellenangabe)
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  // Guidelines aus SFN_Guideline abrufen (als System-Kontext)
  let guidelinesText = '';
  try {
    const guidelinesQuery = {
      query: `{
        Get {
          SFN_Guideline {
            content
          }
        }
      }`
    };
    const guidelinesResponse = await axios.post(
      `${WEAVIATE_URL}/v1/graphql`,
      guidelinesQuery,
      {
        headers: {
          'Authorization': `Bearer ${WEAVIATE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    guidelinesText = guidelinesResponse.data.data.Get.SFN_Guideline.map(g => g.content).join('\n');
  } catch (err) {
    console.error('Guideline fetch error:', err.response?.data || err.message);
  }

  // Kontextsuche: Standardmäßig in SFN_Doc, optional in SFN_Upload
  let contextText = '';
  let useUpload = /mein upload|mein dokument|meine datei|meine analyse/i.test(message);
  let contextClass = useUpload ? 'SFN_Upload' : 'SFN_Doc';
  let contextFields = contextClass === 'SFN_Doc' ? 'text source page paragraph content_type' : 'filename content uploadedAt';
  let contextSource = null;
  try {
    const contextQuery = {
      query: `{
        Get {
          ${contextClass}(limit: 3, nearText: { concepts: [\"${message.replace(/"/g, '')}\"] }) {
            ${contextFields}
            _additional { id }
          }
        }
      }`
    };
    const contextResponse = await axios.post(
      `${WEAVIATE_URL}/v1/graphql`,
      contextQuery,
      {
        headers: {
          'Authorization': `Bearer ${WEAVIATE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const contextArr = contextResponse.data.data.Get[contextClass];
    if (contextArr && contextArr.length > 0) {
      contextSource = contextClass;
      if (contextClass === 'SFN_Doc') {
        contextText = contextArr.map(d => d.text).join('\n---\n');
      } else {
        contextText = contextArr.map(d => d.content).join('\n---\n');
      }
    }
  } catch (err) {
    console.error('Context fetch error:', err.response?.data || err.message);
  }
  const usedSFNContext = !!contextText;

  // Prompt für GPT-4o/DeepSeek zusammenbauen
  const systemPrompt = [
    'You are a helpful business advisor for racquet sports facilities.',
    guidelinesText ? `Guidelines: ${guidelinesText}` : '',
    contextText ? `Context: ${contextText}` : ''
  ].filter(Boolean).join('\n\n');

  // 1. Versuch: GPT-4o (OpenAI)
  try {
    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const aiReply = openaiResponse.data.choices[0].message.content;
    return res.json({ reply: aiReply, model: 'gpt-4o', context: contextText, contextSource, usedSFNContext });
  } catch (openaiError) {
    console.error('OpenAI GPT-4o failed:', openaiError.response?.data || openaiError.message);
    // 2. Fallback: DeepSeek
    try {
      const deepseekResponse = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const aiReply = deepseekResponse.data.choices[0].message.content;
      return res.json({ reply: aiReply, model: 'deepseek', context: contextText, contextSource, usedSFNContext });
    } catch (deepseekError) {
      console.error('DeepSeek failed:', deepseekError.response?.data || deepseekError.message);
      return res.status(500).json({ error: 'Both GPT-4o and DeepSeek failed to respond.' });
    }
  }
});

// Hilfsfunktion: Text in Chunks splitten (erst nach Kapiteln, sonst nach Absätzen)
function splitIntoChunks(text, filename) {
  // Suche nach typischen Kapitelüberschriften (Deutsch/Englisch)
  const chapterRegex = /(?:Kapitel|Chapter|CHAPTER|EXECUTIVE SUMMARY|FINANZPLANUNG|SUMMARY|EINFÜHRUNG|INTRODUCTION|[0-9]+\.|[A-Z]\.)[\s\-:]+.+/g;
  let matches = [...text.matchAll(chapterRegex)];
  let chunks = [];
  if (matches.length > 1) {
    // Split nach Kapiteln
    let indices = matches.map(m => m.index);
    for (let i = 0; i < indices.length; i++) {
      let start = indices[i];
      let end = i < indices.length - 1 ? indices[i + 1] : text.length;
      let chunkText = text.slice(start, end).trim();
      let chapterTitle = text.slice(start, text.indexOf('\n', start));
      chunks.push({
        filename,
        chunkIndex: i,
        content: chunkText,
        chapterTitle: chapterTitle.trim(),
        uploadedAt: new Date().toISOString()
      });
    }
  } else {
    // Fallback: Split nach Absätzen (doppelte Zeilenumbrüche)
    let paras = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    paras.forEach((p, i) => {
      chunks.push({
        filename,
        chunkIndex: i,
        content: p.trim(),
        chapterTitle: '',
        uploadedAt: new Date().toISOString()
      });
    });
  }
  return chunks;
}

// 2. Datei-Upload: POST /api/upload (Chunking nach Kapiteln/Absätzen)
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    const ext = path.extname(file.originalname).toLowerCase();
    let fileContent = '';
    if (ext === '.txt') {
      fileContent = fs.readFileSync(file.path, 'utf-8');
    } else if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(file.path);
      const pdfData = await pdfParse(dataBuffer);
      fileContent = pdfData.text;
    } else if (ext === '.docx') {
      const dataBuffer = fs.readFileSync(file.path);
      const result = await mammoth.extractRawText({ buffer: dataBuffer });
      fileContent = result.value;
    } else if (ext === '.xlsx' || ext === '.xls') {
      const workbook = xlsx.readFile(file.path);
      let text = '';
      workbook.SheetNames.forEach(sheetName => {
        const sheet = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
        sheet.forEach(row => {
          text += row.join(' ') + '\n';
        });
      });
      fileContent = text;
    } else if (ext === '.csv') {
      const csvString = fs.readFileSync(file.path, 'utf-8');
      const records = parse(csvString, { skip_empty_lines: true });
      fileContent = records.map(row => row.join(' ')).join('\n');
    } else {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Only .txt, .pdf, .docx, .xlsx, .xls and .csv files are supported.' });
    }
    // Datei nach Upload löschen (optional)
    fs.unlinkSync(file.path);
    // Text in Chunks splitten
    const chunks = splitIntoChunks(fileContent, file.originalname);
    // Jeden Chunk als eigenes Objekt in Weaviate speichern
    let successCount = 0;
    for (let chunk of chunks) {
      try {
        await axios.post(
          `${WEAVIATE_URL}/v1/objects`,
          {
            class: 'SFN_Upload',
            properties: chunk
          },
          {
            headers: {
              'Authorization': `Bearer ${WEAVIATE_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        successCount++;
      } catch (err) {
        console.error('Chunk upload error:', err.response?.data || err.message);
      }
    }
    return res.json({ status: 'uploaded', filename: file.originalname, chunks: successCount });
  } catch (err) {
    console.error('Upload/Weaviate error:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Upload or Weaviate integration failed.' });
  }
});

// 3. Benchmarks abrufen: GET /api/benchmarks
app.get('/api/benchmarks', (req, res) => {
  // TODO: Benchmarks aus DB oder statisch bereitstellen
  res.json({ benchmarks: [] });
});

// 4. Export: POST /api/export
app.post('/api/export', (req, res) => {
  // TODO: Export-Logik (PDF, CSV, DOCX)
  res.json({ url: 'download-link' });
});

// 5. Dokumente aus SFN_Upload abrufen: GET /api/documents (GraphQL)
app.get('/api/documents', async (req, res) => {
  try {
    const graphqlQuery = {
      query: `{
        Get {
          SFN_Upload {
            filename
            content
            uploadedAt
            _additional { id }
          }
        }
      }`
    };
    const response = await axios.post(
      `${WEAVIATE_URL}/v1/graphql`,
      graphqlQuery,
      {
        headers: {
          'Authorization': `Bearer ${WEAVIATE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return res.json({ documents: response.data.data.Get.SFN_Upload });
  } catch (err) {
    console.error('Weaviate GraphQL GET error:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Failed to fetch documents from Weaviate.' });
  }
});

// --- SERVER STARTEN ---
app.listen(port, () => {
  console.log(`SFN Core AI API listening at http://localhost:${port}`);
}); 