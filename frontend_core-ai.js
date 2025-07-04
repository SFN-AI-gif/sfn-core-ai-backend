// Importiere Wix-API
import wixWindow from 'wix-window';
import { fetch } from 'wix-fetch';

$w.onReady(function () {
  // IDs der Boxen
  const boxes = ['#homeBox', '#documentsBox', '#chatBox', '#settingsBox'];

  // Hilfsfunktion: Nur die gewünschte Box expandieren, alle anderen kollabieren
  function showOnly(boxId) {
    boxes.forEach(id => {
      if (id === boxId) {
        $w(id).expand();
      } else {
        $w(id).collapse();
      }
    });
  }

  // Click-Handler für die Buttons
  $w('#btnHome').onClick(() => showOnly('#homeBox'));
  $w('#btnDocuments').onClick(() => showOnly('#documentsBox'));
  $w('#btnChat').onClick(() => showOnly('#chatBox'));
  $w('#btnSettingsSidebar').onClick(() => showOnly('#settingsBox'));

  // Optional: Standardmäßig homeBox anzeigen
  showOnly('#homeBox');

  // --- Chat-Logik für #homeBox ---
  // IDs gemäß Projektstruktur.md
  const chatInput = $w('#chatInput');
  const chatSendBtn = $w('#chatSendBtn');
  const chatHistoryRepeater = $w('#chatHistoryRepeater');
  const errorMessage = $w('#errorMessage');
  const loadingIndicator = $w('#loadingIndicator');
  const aiStatus = $w('#aiStatus');

  let chatHistory = [];

  // Nachricht senden (User)
  function sendMessage() {
    const userMsg = chatInput.value.trim();
    if (!userMsg) return;
    // User-Nachricht anzeigen
    addMessage({ type: 'user', text: userMsg, timestamp: new Date() });
    chatInput.value = '';
    // AI-Status & Loading anzeigen
    aiStatus.text = 'AI denkt...';
    loadingIndicator.show();
    // API-Call an Backend
    fetch('http://217.154.114.229:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg })
    })
      .then(res => res.json())
      .then(data => {
        addMessage({ type: 'ai', text: data.reply, timestamp: new Date() });
        aiStatus.text = '';
        loadingIndicator.hide();
      })
      .catch(err => {
        errorMessage.text = 'Fehler beim Senden: ' + err.message;
        errorMessage.visible = true;
        aiStatus.text = '';
        loadingIndicator.hide();
      });
  }

  // Nachricht zur History hinzufügen und anzeigen
  function addMessage(msg) {
    chatHistory.push(msg);
    // Repeater-Daten aktualisieren
    chatHistoryRepeater.data = chatHistory.map(m => ({
      _id: String(Math.random()),
      userMessage: m.type === 'user' ? m.text : '',
      aiMessage: m.type === 'ai' ? m.text : '',
      messageTimestamp: m.timestamp.toLocaleTimeString()
    }));
  }

  // Senden-Button & Enter-Key
  chatSendBtn.onClick(sendMessage);
  chatInput.onKeyPress(event => {
    if (event.key === 'Enter') sendMessage();
  });

  // Fehlerbanner ausblenden bei neuer Eingabe
  chatInput.onInput(() => $w('#errorMessage').visible = false);

  // --- Dokumenten-Logik für #documentsBox ---
  const repDocuments = $w('#repDocuments');

  // Hilfsfunktion: passendes Wix-Icon je nach Dateityp
  function getWixIcon(type) {
    switch (type) {
      case 'pdf':
        return 'wix:DocumentPdf';
      case 'xlsx':
        return 'wix:DocumentXlsx';
      case 'docx':
        return 'wix:DocumentDocx';
      case 'txt':
        return 'wix:DocumentTxt';
      default:
        return 'wix:DocumentFile';
    }
  }

  // Dokumente vom Backend laden
  async function loadDocuments() {
    try {
      const response = await fetch('http://217.154.114.229:3000/api/upload', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const docs = await response.json();
      repDocuments.data = docs;
      updateRepeaterItems();
    } catch (err) {
      if ($w('#errorMessage')) {
        $w('#errorMessage').text = 'Fehler beim Laden der Dokumente: ' + err.message;
        $w('#errorMessage').visible = true;
      }
    }
  }

  // Repeater-Items aktualisieren
  function updateRepeaterItems() {
    repDocuments.forEachItem(($item, itemData, index) => {
      $item('#txtDocumentName').text = itemData.filename;
      $item('#txtDocumentDate').text = itemData.uploadedAt;
      $item('#txtDocumentStatus').text = itemData.status;
      $item('#iconDocumentType').src = getWixIcon(itemData.type);

      $item('#iconDocumentDownload').onClick(() => {
        window.open(itemData.downloadUrl, '_blank');
      });

      $item('#iconDocumentDelete').onClick(async () => {
        try {
          await fetch(`http://217.154.114.229:3000/api/upload/${itemData.id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
          });
          loadDocuments();
        } catch (err) {
          if ($w('#errorMessage')) {
            $w('#errorMessage').text = 'Fehler beim Löschen: ' + err.message;
            $w('#errorMessage').visible = true;
          }
        }
      });
    });
  }

  // Initiales Laden der Dokumente, wenn documentsBox angezeigt wird
  $w('#btnDocuments').onClick(() => {
    showOnly('#documentsBox');
    loadDocuments();
  });
});