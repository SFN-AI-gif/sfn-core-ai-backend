// backend/documentService.js
const axios = require('axios');

/**
 * Holt alle Nutzer-Uploads aus Weaviate, gruppiert nach filename und gibt sie im gewünschten Format zurück.
 * @param {string} WEAVIATE_URL
 * @param {string} WEAVIATE_API_KEY
 * @returns {Promise<Array>} Array von Dokumentenobjekten
 */
async function fetchUploadsFromWeaviate(WEAVIATE_URL, WEAVIATE_API_KEY) {
  const graphqlQuery = {
    query: `{
      Get {
        SFN_Upload {
          filename
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
  const uploads = response.data.data.Get.SFN_Upload;
  // Gruppieren nach filename
  const fileMap = {};
  uploads.forEach(u => {
    if (!fileMap[u.filename]) {
      fileMap[u.filename] = [];
    }
    fileMap[u.filename].push(u);
  });
  // Für jede Datei ein Objekt im gewünschten Format
  return Object.entries(fileMap).map(([filename, chunks]) => {
    const first = chunks[0];
    const ext = filename.split('.').pop().toLowerCase();
    return {
      id: first._additional.id,
      filename,
      uploadedAt: first.uploadedAt ? first.uploadedAt.split('T')[0] : '',
      type: ext,
      status: 'verarbeitet',
      downloadUrl: '' // Optional: Download-URL, falls implementiert
    };
  });
}

module.exports = { fetchUploadsFromWeaviate }; 