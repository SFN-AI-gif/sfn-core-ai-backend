# SFN Core AI – Technical Documentation & Implementation Guide

## 1. Purpose & Vision

The SFN Core AI Server is a dedicated AI-based business advisor tailored for the racquet facility industry. It provides exclusive, high-value operational guidance and insights for racquet facility operators and investors. The tool is available only to paying subscribers of the "SFN Core AI" section on www.squashfacilities.com.

### Key Business Topics Covered:
- **Facility Planning**: Court capacity, construction costs, location analysis
- **Membership Models**: Pricing strategies, retention programs, customer segmentation
- **Multi-Sport Integration**: Squash, padel, pickleball facility optimization
- **Data-Driven Benchmarking**: Industry comparisons, performance metrics, KPI tracking
- **Operational Excellence**: Staff management, maintenance schedules, revenue optimization

### Core Value Proposition:
Subscribers can upload their business plans and concepts, which are then analyzed by SFN Core AI against existing industry benchmarks and best practices.

## 2. Access & Pricing Model

### Subscription Tiers:
- **Basic Tier**: Included with subscription; basic chat functionality
- **Pro Tier**: unlimited usage, PDF/Excel/Word/txt uploads, data exports, site-specific benchmarks, priority support

### Access Control:
- Restricted to logged-in users with active subscriptions (via Wix authentication)
- Role-based access control for different user types
- Session management and security

## 3. Technical Architecture

### AI Engine (Model Selection):
- **Standardmodell:** OpenAI GPT-4o (über OpenAI API)
- **Fallback:** DeepSeek (direkte API-Anbindung, nicht über Together AI)
- Die Auswahl des Modells erfolgt dynamisch im Backend: Standardmäßig wird GPT-4o genutzt, bei Ausfall oder Limit-Überschreitung wird automatisch auf DeepSeek umgeschaltet.

### Frontend (Wix Integration):
- **Primary Interface**: www.squashfacilities.com/core-ai
- **UI Framework**: Wix Velo with custom React components
- **Responsive Design**: Mobile-first, Perplexity-like minimal sidebar
- **Chat Interface**: ChatGPT-like experience with message threading, direct chat entry on page load

### Backend Services:
- **AI Engine:** GPT-4o via OpenAI API (Standard), DeepSeek API (Fallback, direkte Anbindung)
- **Vector Database**: Weaviate Cloud (serverless sfn-ai instance)
- **File Processing**: Document parsing and vectorization pipeline
- **External Server**: Linux server via Ionos for heavy processing tasks

### Data Management:
```
documents/
├── archive/          # Processed and archived documents
├── guidelines/       # SFN guide lines for answers
├── processed/        # Successfully vectorized documents
├── to_complete/      # Documents requiring manual review
└── to_process/       # New documents awaiting processing
```

### Security & Compliance:
- **Authentication**: Wix user management integration
- **Data Encryption**: End-to-end encryption for file uploads
- **GDPR Compliance**: Data retention policies and user consent
**API Security**: Rate limiting, request validation, DeepSeek protection

### Secrets & API Keys:
- **OPENAI_API_KEY**: Für GPT-4o (Standardmodell)
- **DEEPSEEK_API_KEY**: Für DeepSeek (direkte API-Anbindung, Fallback)
- **WEAVIATE_API_KEY/URL**: Für Vektor-Datenbank

### Vector Database (Weaviate Collections):
- **SFN_Doc**: Enthält Marktstudien, Artikel und alle Wissensdokumente für die AI.
  - Felder: text (Text), source (Text), page (Int), paragraph (Int), content_type (Text)
- **SFN_Guideline**: Enthält Richtlinien, wie die AI antworten soll.
  - Felder: name (Text), content (Text), last_modified (Text)
- **SFN_Upload**: Enthält von Nutzern hochgeladene Dokumente (z.B. Businesspläne, Analysen).
  - Felder: filename (Text), content (Text), uploadedAt (Date), userId (Text, optional), description (Text, optional)

**Hinweis:**
- Die Trennung der Collections ermöglicht eine klare Unterscheidung zwischen interner Wissensbasis, AI-Richtlinien und individuellen Kundenuploads.
- Die Felder sind so gewählt, dass sie für Suche, Kontextintegration und spätere Erweiterungen geeignet sind.

### .env-Datei (Secrets & API Keys):
Die Datei `.env` im Backend enthält alle sensiblen Zugangsdaten und wird nicht ins Repository eingecheckt.

**Beispiel-Inhalt:**
```
WEAVIATE_URL=https://ro6kegazsia3gzo6uada.c0.europe-west3.gcp.weaviate.cloud
WEAVIATE_API_KEY=... # API-Key für Weaviate
OPENAI_API_KEY=...    # API-Key für GPT-4o
DEEPSEEK_API_KEY=...  # API-Key für DeepSeek (Fallback)
WIX_CLIENT_ID=...     # (optional, für spätere Authentifizierung)
```

**Wichtige Hinweise:**
- Die Keys werden im Backend aus der .env geladen und niemals im Code hinterlegt.
- Die .env-Datei muss auf jedem Server (lokal und produktiv) gepflegt werden.

## 4. UI Component Reference (with IDs)

### Sidebar Components (Minimal Icon Bar)
- **Sidebar Container**
  - ID: `boxSidebar`
  - Purpose: Holds all sidebar elements, left-aligned, minimal width, light background
- **Home Button**
  - ID: `btnHome`
  - Purpose: Navigates to main chat/home view
- **Documents Button**
  - ID: `btnDocuments`
  - Purpose: Navigates to documents view
- **Chat Button**
  - ID: `btnChat`
  - Purpose: Navigates to chat view (if separated)
- **Settings Button (Sidebar)**
  - ID: `btnSettingsSidebar`
  - Purpose: Opens global settings modal or page
- **FAQ Link**
  - ID: `faqLink`
  - Purpose: Opens help/FAQ section

### Main Content Area (Dynamic, Perplexity-like)
- **Logo/Header**
  - ID: `coreAILogo`
  - Purpose: Branding, always visible at the top
- **Home/Chat Box**
  - ID: `homeBox`
  - Purpose: Main chat interface, default visible on page load
- **Documents Box**
  - ID: `documentsBox`
  - Purpose: Document management and upload area
- **Chat Box (optional, if separated)**
  - ID: `chatBox`
  - Purpose: Dedicated chat area (if not using homeBox for chat)
- **Settings Box**
  - ID: `settingsBox`
  - Purpose: Settings and preferences area

### Chat Area Components (Inside homeBox or chatBox)
- **Chat History Repeater**
  - ID: `chatHistoryRepeater`
  - Purpose: Displays all chat messages
    - **User Message**: `userMessage`
    - **AI Message**: `aiMessage`
    - **Message Timestamp**: `messageTimestamp`
- **Input Section Container**
  - ID: `chatInputBox` (or `inputSection`)
  - Purpose: Holds all input controls at the bottom of the chat area
    - **Chat Input Field**: `chatInput`
    - **Send Button**: `chatSendBtn`
    - **File Upload Button**: `fileUploadBtn`
    - **Voice Input Button**: `voiceInputBtn`
    - **Settings Button (Input/Chat-specific)**: `chatSettingsBtn`

### Documents Area Components (Inside documentsBox)
- **Documents Repeater**
  - ID: `repDocuments`
  - Purpose: Lists uploaded files
    - **Document Name**: `txtDocumentName`
    - **Document Date**: `txtDocumentDate`
    - **Document Type Icon**: `iconDocumentType`
    - **Status Badge**: `txtDocumentStatus`
    - **Download Icon**: `iconDocumentDownload`
    - **Delete Icon**: `iconDocumentDelete`

### Global/Utility Components
- **Error Message Banner**
  - ID: `errorMessage`
  - Purpose: Shows errors (e.g., upload/API issues)
- **AI Status Indicator**
  - ID: `aiStatus`
  - Purpose: Shows AI readiness or typing status
- **Loading Indicator**
  - ID: `loadingIndicator`
  - Purpose: Shows when AI is generating a response
- **Notification Toast**
  - ID: `notificationToast`
  - Purpose: Shows system notifications (success, warning, error)

## 5. Design & Navigation Principles (Updated)
- **Minimal Sidebar:** Only essential navigation icons, docked left (desktop) or bottom (mobile). No text labels, only tooltips/aria-labels for accessibility.
- **Direct Chat Entry:** On page load, user lands directly in the chat interface (`homeBox`).
- **Dynamic Main Content:** Only one main content box (homeBox, documentsBox, chatBox, settingsBox) is visible at a time, controlled by sidebar icon clicks.
- **Consistent Branding:** Logo/header always visible at the top, outside of content boxes.
- **Mobile-First:** All components are responsive, sidebar icons move to bottom on mobile.
- **Unique IDs:** Every interactive element has a unique, descriptive ID (e.g., `btnSettingsSidebar` vs. `chatSettingsBtn`).
- **Separation of Concerns:** Global settings (sidebar) and chat-specific settings (input) are clearly separated in UI and code.

## 6. Technical Specifications

### API Endpoints:
```
POST /api/chat          # Chat message processing
POST /api/upload        # File upload and processing
GET  /api/benchmarks    # Retrieve industry benchmarks
GET  /api/analytics     # User analytics and insights
POST /api/export        # Export data and reports

# Dokumentenverwaltung
GET    /api/upload         # Liste aller hochgeladenen Dokumente abrufen
DELETE /api/upload/:id     # Dokument mit gegebener ID löschen
POST   /api/upload         # Neues Dokument hochladen
```

**Antwortstruktur für GET /api/upload:**
```json
[
  {
    "id": "string",
    "filename": "string",
    "uploadedAt": "YYYY-MM-DD",
    "type": "pdf|docx|xlsx|txt",
    "status": "verarbeitet|in Bearbeitung|fehlerhaft",
    "downloadUrl": "string"
  }
]
```

**Antwortstruktur für DELETE /api/upload/:id:**
```json
{ "success": true }
```

### Database Schema:
- **Users**: User profiles, subscription status, usage metrics
- **Conversations**: Chat history, context, metadata
- **Documents**: Uploaded files, processing status, vector embeddings
- **Analytics**: Usage patterns, feature adoption, performance metrics

### Performance Requirements:
- **Response Time**: < 3 seconds for chat responses
- **Upload Processing**: < 30 seconds for standard documents
- **Concurrent Users**: Support for 100+ simultaneous users
- **Uptime**: 99.9% availability

## 7. Quality Assurance & Testing

### Testing Strategy:
- **Unit Tests**: Individual component testing
- **Integration Tests**: API and service integration
- **End-to-End Tests**: Complete user journey validation
- **Performance Tests**: Load testing and optimization
- **Security Tests**: Vulnerability assessment and penetration testing

### Monitoring & Analytics:
- **Application Performance Monitoring**: Response times, error rates
- **User Behavior Analytics**: Feature usage, conversion rates
- **Business Intelligence**: Subscription metrics, revenue tracking
- **System Health**: Server performance, database optimization

## 8. Business Intelligence & Analytics

### Key Metrics:
- **User Engagement**: Daily active users, session duration
- **Feature Adoption**: Most used features, conversion rates
- **Revenue Metrics**: Subscription growth, churn rate
- **Content Performance**: Most valuable insights, user feedback

### Reporting Dashboard:
- Real-time analytics for business stakeholders
- Automated reports for subscription management
- User behavior insights for product improvement
- Performance metrics for technical optimization

## 9. Risk Management & Contingency Plans

### Technical Risks:
- **API Rate Limits**: Fallback strategies for OpenAI/Weaviate
- **Data Loss**: Regular backups and disaster recovery
- **Security Breaches**: Incident response procedures
- **Performance Issues**: Scalability planning and optimization

### Business Risks:
- **Subscription Churn**: Retention strategies and user feedback loops
- **Competition**: Continuous innovation and feature development
- **Regulatory Changes**: Compliance monitoring and adaptation
- **Market Changes**: Flexible pricing and feature strategies

## 10. Success Criteria & KPIs

### Technical KPIs:
- System uptime > 99.9%
- Average response time < 3 seconds
- User satisfaction score > 4.5/5
- Error rate < 0.1%

### Business KPIs:
- Monthly recurring revenue growth
- User retention rate > 85%
- Feature adoption rate > 70%
- Customer satisfaction score > 4.5/5

## 11. Implementation Notes

### Initial Development Approach:
- **Open Access**: Initially accessible to all users for testing
- **Pricing Integration**: Implement Wix pricing controls after full functionality
- **ChatGPT-like Interface**: Replicate familiar user experience for adoption
- **Iterative Development**: Continuous feedback and improvement cycles

### Resource Requirements:
- **Development Team**: Full-stack developer, AI specialist, UX designer
- **Infrastructure**: Cloud hosting, database management, monitoring tools
- **Content**: Industry knowledge base, benchmark data, best practices
- **Support**: Customer service, technical support, documentation

### Backend-Deployment & API-URL
- Das Backend läuft auf einem eigenen IONOS-Server (z.B. http://217.154.114.229:3000)
- Die Firewall muss Port 3000 für eingehende Verbindungen freigeben, damit die API von außen (z.B. Wix) erreichbar ist
- Die Backend-URL wird im Frontend für alle API-Calls verwendet (nicht die Wix-URL)

### Upload-Logik & Chunking
- Beim Upload großer Dokumente (PDF, DOCX, TXT) wird der Text nach Kapitelüberschriften (oder, falls nicht gefunden, nach Absätzen) in Chunks zerlegt
- Jeder Chunk wird als separates Objekt in der Collection SFN_Upload gespeichert (mit filename, chunkIndex, content, chapterTitle, uploadedAt)
- Die API-Antwort beim Upload enthält die Anzahl der gespeicherten Chunks

### Kontextintegration im Chat
- Bei einer Nutzerfrage sucht das System per semantischer Suche die relevantesten Chunks
  - Standard: Suche in SFN_Doc (Wissensbasis)
  - Optional: Bei Fragen mit Bezug auf eigene Uploads ("mein Upload", "mein Dokument" etc.) wird in SFN_Upload gesucht
- Die Top-Treffer werden als Kontext an GPT-4o (oder DeepSeek) übergeben
- Die API-Antwort enthält jetzt auch die Felder contextSource ("SFN_Doc", "SFN_Upload" oder null) und usedSFNContext (true/false)

### Frontend-Anbindung (Wix)
- Die Wix-Seite (https://www.squashfacilities.com/sfn-core-ai/core-ai) ist das Frontend
- Das Frontend kommuniziert per HTTP-API mit dem Backend (z.B. http://217.154.114.229:3000/api/chat)
- CORS ist im Backend aktiviert
- Für den Produktivbetrieb wird empfohlen, das Backend später auch über HTTPS (Port 443) erreichbar zu machen

### Nächster Schritt
- Test der API im Browser/Frontend (z.B. mit Postman, curl oder direkt aus Wix)

---

*Last Updated: [Current Date]*
*Version: 1.0*
*Status: Planning Phase*