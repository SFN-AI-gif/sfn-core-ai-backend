// public/frontendCoreAi.js

// Hilfsfunktion: passendes Wix-Icon je nach Dateityp
export function getWixIcon(type) {
  switch (type) {
    case 'pdf': return 'wix:DocumentPdf';
    case 'xlsx': return 'wix:DocumentXlsx';
    case 'docx': return 'wix:DocumentDocx';
    case 'txt': return 'wix:DocumentTxt';
    default: return 'wix:DocumentFile';
  }
}

// Dokumente vom Backend laden
export async function fetchDocuments(apiUrl) {
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  return await response.json();
}

// Dokument löschen
export async function deleteDocument(apiUrl, id) {
  const response = await fetch(`${apiUrl}/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  });
  return await response.json();
}

// Notification Toast anzeigen
export function showNotification($w, message, type = 'info') {
  const toast = $w('#notificationToast');
  if (!toast) return;
  toast.text = message;
  if (type === 'success') toast.style.backgroundColor = '#4BB543';
  else if (type === 'error') toast.style.backgroundColor = '#FF3333';
  else if (type === 'warning') toast.style.backgroundColor = '#FFA500';
  else toast.style.backgroundColor = '#333';
  toast.show();
  setTimeout(() => toast.hide(), 3000);
} 