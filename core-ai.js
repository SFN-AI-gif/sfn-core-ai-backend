// Importiere Wix-API
import wixWindow from 'wix-window';
import { fetch } from 'wix-fetch';
import { getWixIcon, fetchDocuments, deleteDocument, showNotification } from 'public/frontendCoreAi.js';

$w.onReady(function () {
  // Utility-Komponenten initialisieren
  const aiStatus = $w('#aiStatus');
  const loadingIndicator = $w('#loadingIndicator');
  const errorMessage = $w('#errorMessage');

  // IDs der Boxen
  const boxes = ['#homeBox', '#documentsBox', '#chatBox', '#settingsBox', '#faqBox'];

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
  $w('#faqLink').onClick(() => showOnly('#faqBox'));

  // Optional: Standardmäßig homeBox anzeigen
  showOnly('#homeBox');

  // --- Chat-Logik für #homeBox und #chatBox ---

  // HomeBox Input-IDs
  const homeChatInput = $w('#HomeChatInput');
  const homeChatSendBtn = $w('#HomeChatSendBtn');
  const homeChatHistoryRepeater = $w('#chatHistoryRepeater'); // bleibt gleich, da nur ein Verlauf

  // ChatBox Input-IDs
  const chatInput = $w('#chatInput');
  const chatSendBtn = $w('#chatSendBtn');
  const chatBoxHistoryRepeater = $w('#chatHistoryRepeater'); // bleibt gleich, da nur ein Verlauf

  // Gemeinsame Variablen für Chatverlauf
  let homeChatHistory = [];
  let chatBoxHistory = [];

  // Nachricht senden (HomeBox)
  function sendHomeMessage() {
    const userMsg = homeChatInput.value.trim();
    if (!userMsg) return;
    addHomeMessage({ type: 'user', text: userMsg, timestamp: new Date() });
    homeChatInput.value = '';
    aiStatus.text = 'AI denkt...';
    loadingIndicator.show();
    fetch('http://217.154.114.229:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg })
    })
      .then(res => res.json())
      .then(data => {
        addHomeMessage({ type: 'ai', text: data.reply, timestamp: new Date() });
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

  function addHomeMessage(msg) {
    homeChatHistory.push(msg);
    homeChatHistoryRepeater.data = homeChatHistory.map(m => ({
      _id: String(Math.random()),
      userMessage: m.type === 'user' ? m.text : '',
      aiMessage: m.type === 'ai' ? m.text : '',
      messageTimestamp: m.timestamp.toLocaleTimeString()
    }));
  }

  // --- Chat-Session-Übersicht für #chatBox ---
  const chatListRepeater = $w('#chatListRepeater');
  let chatSessions = [
    {
      _id: 'chat1',
      title: 'Chat vom 04.07.2025',
      lastMessage: 'Danke für Ihre Anfrage!',
      lastMessageTimestamp: '10:15',
      messages: [
        { type: 'user', text: 'Wie optimiere ich meine Preise?', timestamp: new Date() },
        { type: 'ai', text: 'Hier sind einige Preisstrategien...', timestamp: new Date() }
      ]
    },
    {
      _id: 'chat2',
      title: 'Chat vom 03.07.2025',
      lastMessage: 'Hier sind Ihre Benchmarks.',
      lastMessageTimestamp: '17:22',
      messages: [
        { type: 'user', text: 'Bitte Benchmarks für 2024.', timestamp: new Date() },
        { type: 'ai', text: 'Hier sind Ihre Benchmarks.', timestamp: new Date() }
      ]
    }
  ];
  let selectedChatId = null;

  // Chat-Session-Liste initialisieren
  function loadChatSessions() {
    chatListRepeater.data = chatSessions;
  }

  // Verlauf für gewählte Session laden
  function loadChatHistory(chatId) {
    const session = chatSessions.find(s => s._id === chatId);
    if (!session) return;
    $w('#chatHistoryRepeater').data = session.messages.map(m => ({
      _id: String(Math.random()),
      userMessage: m.type === 'user' ? m.text : '',
      aiMessage: m.type === 'ai' ? m.text : '',
      messageTimestamp: m.timestamp.toLocaleTimeString()
    }));
  }

  // Neue Nachricht der gewählten Session zuordnen (nur für ChatBox)
  function sendChatBoxMessage() {
    const userMsg = chatInput.value.trim();
    if (!userMsg || !selectedChatId) return;
    const session = chatSessions.find(s => s._id === selectedChatId);
    if (!session) return;
    const msg = { type: 'user', text: userMsg, timestamp: new Date() };
    session.messages.push(msg);
    chatInput.value = '';
    aiStatus.text = 'AI denkt...';
    loadingIndicator.show();
    fetch('http://217.154.114.229:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg })
    })
      .then(res => res.json())
      .then(data => {
        const aiMsg = { type: 'ai', text: data.reply, timestamp: new Date() };
        session.messages.push(aiMsg);
        loadChatHistory(selectedChatId);
        aiStatus.text = '';
        loadingIndicator.hide();
      })
      .catch(err => {
        errorMessage.text = 'Fehler beim Senden: ' + err.message;
        errorMessage.visible = true;
        aiStatus.text = '';
        loadingIndicator.hide();
      });
    loadChatHistory(selectedChatId);
  }

  // Event-Handler für HomeBox
  homeChatSendBtn.onClick(sendHomeMessage);
  homeChatInput.onKeyPress(event => {
    if (event.key === 'Enter') sendHomeMessage();
  });
  homeChatInput.onInput(() => $w('#errorMessage').visible = false);

  // Event-Handler für ChatBox
  chatSendBtn.onClick(sendChatBoxMessage);
  chatInput.onKeyPress(event => {
    if (event.key === 'Enter') sendChatBoxMessage();
  });
  chatInput.onInput(() => $w('#errorMessage').visible = false);

  // --- Dokumenten-Logik für #documentsBox ---
  async function loadDocuments() {
    try {
      const docs = await fetchDocuments('http://217.154.114.229:3000/api/upload');
      $w('#repDocuments').data = docs;
      updateRepeaterItems();
    } catch (err) {
      $w('#errorMessage').text = 'Fehler beim Laden der Dokumente: ' + err.message;
      $w('#errorMessage').visible = true;
    }
  }

  function updateRepeaterItems() {
    $w('#repDocuments').forEachItem(($item, itemData, index) => {
      $item('#txtDocumentName').text = itemData.filename;
      $item('#txtDocumentDate').text = itemData.uploadedAt;
      $item('#txtDocumentStatus').text = itemData.status;
      $item('#iconDocumentType').src = getWixIcon(itemData.type);

      $item('#iconDocumentDownload').onClick(() => {
        window.open(itemData.downloadUrl, '_blank');
      });

      $item('#iconDocumentDelete').onClick(async () => {
        try {
          await deleteDocument('http://217.154.114.229:3000/api/upload', itemData.id);
          loadDocuments();
          showNotification($w, 'Document deleted successfully', 'success');
        } catch (err) {
          $w('#errorMessage').text = 'Fehler beim Löschen: ' + err.message;
          $w('#errorMessage').visible = true;
          showNotification($w, 'Error deleting document', 'error');
        }
      });
    });
  }

  // Event-Handler für Dokumenten-Ansicht
  $w('#btnDocuments').onClick(() => {
    showOnly('#documentsBox');
    loadDocuments();
  });

  // --- FAQ-Logik für #faqBox ---
  const faqRepeater = $w('#faqRepeater');
  // Beispiel-FAQ-Daten (später per API ersetzbar)
  const faqs = [
    {
      _id: '1',
      question: 'How do I upload a document?',
      answer: 'Go to the Documents section and click the upload button.'
    },
    {
      _id: '2',
      question: 'How can I change the language?',
      answer: 'Open the Settings and select your preferred language from the dropdown.'
    },
    {
      _id: '3',
      question: 'Is my data secure?',
      answer: 'Yes, all uploads are encrypted and GDPR compliant.'
    }
  ];

  // FAQ-Repeater initialisieren
  function loadFaqs() {
    faqRepeater.data = faqs;
  }

  // FAQ-Repeater-Logik: Auf-/Zuklappen
  faqRepeater.onItemReady(($item, itemData, index) => {
    $item('#txtFaqQuestion').text = itemData.question;
    $item('#txtFaqAnswer').text = itemData.answer;
    $item('#txtFaqAnswer').collapse(); // Standard: Antwort ausgeblendet
    $item('#btnFaqToggle').onClick(() => {
      if ($item('#txtFaqAnswer').collapsed) {
        $item('#txtFaqAnswer').expand();
      } else {
        $item('#txtFaqAnswer').collapse();
      }
    });
  });

  // FAQ-Box laden, wenn angezeigt wird
  $w('#faqLink').onClick(() => {
    showOnly('#faqBox');
    loadFaqs();
  });

  // --- Settings-Logik für #settingsBox ---
  // Platzhalterdaten (später per API ersetzen)
  $w('#txtUserName').text = 'Max Mustermann';
  $w('#txtUserRole').text = 'Pro User';
  $w('#txtAppVersion').text = 'v1.01';

  // Profil bearbeiten
  $w('#btnEditProfile').onClick(() => {
    wixWindow.openLightbox('EditProfile'); // Beispiel: Lightbox öffnen
  });

  // Passwort ändern
  $w('#btnChangePassword').onClick(() => {
    wixWindow.openLightbox('ChangePassword');
  });

  // Logout
  $w('#btnLogout').onClick(() => {
    wixWindow.openLightbox('LogoutConfirm');
  });

  // E-Mail-Benachrichtigungen umschalten
  $w('#switchEmailNotifications').onChange(event => {
    // Hier API-Call oder Speicherung einbauen
    console.log('E-Mail Notifications:', event.target.checked);
  });

  // Push-Benachrichtigungen umschalten
  $w('#switchPushNotifications').onChange(event => {
    // Hier API-Call oder Speicherung einbauen
    console.log('Push Notifications:', event.target.checked);
  });

  // Sprache ändern
  $w('#dropdownLanguage').onChange(event => {
    // Hier Sprachumschaltung/API-Call einbauen
    console.log('Selected language:', event.target.value);
  });

  // Dark Mode umschalten
  $w('#switchDarkMode').onChange(event => {
    // Hier Theme-Umschaltung einbauen
    console.log('Dark Mode:', event.target.checked);
  });

  // Support kontaktieren
  $w('#btnContactSupport').onClick(() => {
    wixWindow.openLightbox('ContactSupport');
  });

  // FAQ öffnen
  $w('#btnViewFAQ').onClick(() => {
    showOnly('#faqBox');
    loadFaqs && loadFaqs();
  });

  // ChatBox anzeigen: Sessions und Verlauf laden
  $w('#btnChat').onClick(() => {
    showOnly('#chatBox');
    loadChatSessions();
    if (chatSessions.length > 0) {
      selectedChatId = chatSessions[0]._id;
      loadChatHistory(selectedChatId);
    }
  });

  // --- Utility-Komponenten: Notification Toast ---
  // showNotification(message, type = 'info') {
  //   const toast = $w('#notificationToast');
  //   if (!toast) return;
  //   toast.text = message;
  //   // Optional: Farbe je nach Typ setzen
  //   if (type === 'success') toast.style.backgroundColor = '#4BB543';
  //   else if (type === 'error') toast.style.backgroundColor = '#FF3333';
  //   else if (type === 'warning') toast.style.backgroundColor = '#FFA500';
  //   else toast.style.backgroundColor = '#333';
  //   toast.show();
  //   setTimeout(() => toast.hide(), 3000);
  // }

  // Beispielhafte Nutzung in bestehenden Funktionen:
  // Nach erfolgreichem Dokumenten-Upload/Löschen:
  // showNotification('Document deleted successfully', 'success');
  // Bei Fehlern:
  // showNotification('Error deleting document', 'error');
  // Bei Settings-Änderungen:
  // showNotification('Settings saved', 'success');
});