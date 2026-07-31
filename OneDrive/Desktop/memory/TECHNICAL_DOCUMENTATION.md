# Our Story — Complete Technical Documentation

## 1. Project Overview

| Attribute | Value |
|---|---|
| **Name** | Our Story (`our-story`) |
| **Version** | 0.1.0 |
| **Type** | Full-stack Progressive Web App (PWA) |
| **Purpose** | Private digital memory book and couple's journal for two people in love |
| **Target Users** | Exactly 2 people in a romantic relationship |
| **Architecture** | Next.js 16 App Router + custom Node.js server with Socket.IO |

## 2. Codebase Statistics

| Category | Count |
|---|---|
| Total source files | **196** (src/) |
| Components | **74** |
| Page routes | **28** |
| API route handlers | **47** |
| Socket.IO events (inbound) | **24** |
| Socket.IO events (outbound) | **24** |
| Mongoose models | **19** |
| React hooks | **13** |
| Zustand stores | **5** |
| Lib utilities | **13** |
| Export services | **7** |
| Type definitions | **2 files, ~30 interfaces** |
| Config files | **10** |

### Largest Files

| Lines | File |
|---|---|
| 1027 | `chat/page.tsx` |
| 1021 | `settings/export/page.tsx` |
| 1016 | `ChatInput.tsx` |
| 790 | `BookTemplate.tsx` |
| 757 | `chat/appearance/page.tsx` |
| 740 | `ImageViewer.tsx` |
| 730 | `chat/profile/page.tsx` |
| 728 | `VideoViewer.tsx` |
| 665 | `useSocket.ts` |
| 585 | `queries.ts` |

## 3. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.10 |
| Language | TypeScript | ^5 |
| UI | React | 19.2.4 |
| Styling | Tailwind CSS | v4 |
| Animation | Framer Motion | ^12.42.2 |
| Client State | Zustand | ^5.0.14 |
| Server State | TanStack React Query | ^5.101.2 |
| Database | MongoDB via Mongoose | ^9.7.4 |
| Real-time | Socket.IO | ^4.8.3 |
| Auth | JWT + bcryptjs | ^9.0.3 / ^3.0.3 |
| Cloud Storage | Cloudinary | ^2.10.0 |
| Push Notifications | Firebase Cloud Messaging | firebase ^12.16.0, firebase-admin ^14.2.0 |
| PDF Generation | jsPDF + html2canvas | ^4.2.1 / ^1.4.1 |
| ZIP Export | JSZip | ^3.10.1 |
| Encryption | Web Crypto API (AES-256-GCM) | Native |
| HTTP Client | Axios | ^1.18.1 |
| Forms | React Hook Form | ^7.81.0 |
| Icons | lucide-react | ^1.28.0 |
| Dates | dayjs | ^1.11.21 |
| QR Codes | qrcode | ^1.5.4 |
| IDs | uuid | ^14.0.1 |

## 4. Folder Structure

```
our-story/
├── server.js                    # Custom Node.js server (661 lines) - Socket.IO + MongoDB
├── package.json
├── next.config.ts               # Security headers, Cloudinary images, server externals
├── tsconfig.json                # Strict mode, @/* path alias
├── postcss.config.mjs           # Tailwind CSS v4
├── eslint.config.mjs
├── .env.example                 # MONGODB_URI, JWT_SECRET, CLOUDINARY_*
├── scripts/
│   └── generate-firebase-sw.js  # Generates Firebase service worker
├── public/
│   ├── manifest.json            # PWA manifest
│   ├── firebase-messaging-sw.js # Generated service worker
│   └── icons/                   # PWA icons (192px, 512px)
└── src/
    ├── app/                     # Next.js App Router
    │   ├── layout.tsx           # Root layout (ThemeScript, Providers)
    │   ├── page.tsx             # Lock screen (splash → password → profile)
    │   ├── globals.css          # Tailwind + glassmorphism utilities
    │   ├── theme-script.tsx     # SSR-safe dark mode injection
    │   ├── manifest.ts          # PWA manifest generator
    │   ├── (main)/              # Authenticated route group
    │   │   ├── layout.tsx       # Auth guard, AppShell, FCM, AppLock
    │   │   ├── home/            # Dashboard
    │   │   ├── chat/            # Real-time chat (1027 lines)
    │   │   │   ├── appearance/  # Chat theme customization
    │   │   │   └── profile/     # Partner profile
    │   │   ├── add-memory/      # Create/edit memory
    │   │   ├── memory/[id]/     # Memory detail
    │   │   ├── timeline/        # Chronological memory list
    │   │   ├── gallery/         # Photo grid
    │   │   ├── calendar/        # Calendar view
    │   │   ├── journal/         # Journal entries
    │   │   ├── letters/         # Time-locked letters
    │   │   ├── time-capsule/    # Time capsules
    │   │   ├── special-days/    # Anniversaries, birthdays
    │   │   ├── music/           # Shared playlist
    │   │   ├── story-books/     # Generated PDF books
    │   │   ├── map/             # Location-based memories
    │   │   ├── search/          # Full-text search
    │   │   ├── profile/         # Relationship stats
    │   │   ├── more/            # Feature grid menu
    │   │   └── settings/        # App settings
    │   │       ├── security/    # Password + biometric
    │   │       ├── export/      # Data export (JSON/ZIP/PDF)
    │   │       └── delete-requests/ # Mutual delete workflow
    │   └── api/                 # 47 API route handlers
    │       ├── auth/            # Password + biometric login
    │       ├── chat/            # Messaging, typing, presence, polling
    │       ├── memories/        # CRUD + comments
    │       ├── journal/         # CRUD
    │       ├── letters/         # CRUD + auto-unlock
    │       ├── time-capsule/    # CRUD + auto-unlock
    │       ├── special-days/    # CRUD
    │       ├── music/           # CRUD
    │       ├── storybooks/      # CRUD + PDF upload
    │       ├── settings/        # App settings + password change
    │       ├── upload/          # File upload (Cloudinary)
    │       ├── search/          # Full-text search
    │       ├── stats/           # Aggregate statistics
    │       ├── export/          # Full data export (JWT required)
    │       ├── fcm/             # Firebase token management
    │       ├── delete-requests/ # Mutual delete workflow
    │       └── conversation-delete/ # Conversation deletion
    ├── components/              # 74 React components
    │   ├── ui/                  # 8 primitives (Button, Card, Input, Modal, etc.)
    │   ├── layout/              # 8 layout components (AppShell, BottomNav, etc.)
    │   ├── chat/                # 24 chat components
    │   ├── home/                # 13 dashboard widgets
    │   ├── memory/              # 3 memory components
    │   ├── post/                # 3 post components
    │   ├── timeline/            # 2 timeline components
    │   ├── calendar/            # 1 calendar component
    │   ├── gallery/             # 1 gallery component
    │   ├── security/            # 2 security components
    │   └── modals/              # 4 modal components
    ├── hooks/                   # 13 custom hooks
    ├── stores/                  # 5 Zustand stores
    ├── models/                  # 19 Mongoose schemas (6 files)
    ├── lib/                     # 13 utility modules
    ├── services/export/         # 7 export service files
    └── types/                   # 2 type definition files
```

## 5. Database Analysis

### Connection
- **Method**: Mongoose with global singleton cache (survives hot reloads)
- **URI**: `MONGODB_URI` env var (supports MongoDB Atlas with TLS)
- **Pool**: max 10, min 1, 30s idle timeout, 10s selection/connect timeout
- **Detection**: Auto-detects Atlas (`mongodb+srv` or `.mongodb.net`)

### Collections (19 total)

| # | Collection | TTL | Unique | Purpose |
|---|---|---|---|---|
| 1 | `Memory` | — | — | Photo/video memories with mood, location, tags |
| 2 | `Journal` | — | — | Daily journal entries with mood |
| 3 | `SpecialDay` | — | — | Anniversaries, birthdays, milestones |
| 4 | `Letter` | — | — | Time-locked letters (unlockDate) |
| 5 | `TimeCapsule` | — | — | Locked memories with images |
| 6 | `Comment` | — | — | Comments on memories |
| 7 | `Music` | — | — | Shared music tracks |
| 8 | `AppSettings` | — | — | Singleton: password, partner names, lockout |
| 9 | `StoryBook` | — | — | Generated PDF love story books |
| 10 | `ChatMessage` | — | — | Chat messages (text, image, video, voice, document) |
| 11 | `ChatTyping` | — | compound | Typing indicators per conversation |
| 12 | `DeleteRequest` | **expiresAt: 0s** | — | Mutual delete requests (auto-purge) |
| 13 | `ChatTheme` | — | conversationId | Chat visual theme settings |
| 14 | `FcmToken` | — | token | Firebase push notification tokens |
| 15 | `DisappearingConfig` | — | conversationId | Disappearing messages config |
| 16 | `Typing` | **8s** | sender | Socket typing indicators (auto-expire) |
| 17 | `Presence` | **60s** | sender | Online/offline presence (auto-expire) |
| 18 | `EditNotification` | **15s** | — | Edit/reaction sync notifications (auto-expire) |
| 19 | `PartnerLastSeen` | — | sender | Persistent last-seen timestamp |
| 20 | `ConversationDelete` | — | — | Conversation deletion requests |

### Key Indexes
- `ChatMessage`: compound on `(conversationId, createdAt)`, text search on `content`
- `Memory`: compound on `(year, month)`, `(date)`, `(tags)`, text search on `title, description, location`
- `Journal`: text search on `content`
- `StoryBook`: compound on `(year, createdAt DESC)`

### Relationships
- `Comment.memoryId` → `Memory._id` (logical, String type)
- `Music.memoryId` → `Memory._id` (optional, String type)
- `DeleteRequest.contentId` → polymorphic (any content type via `contentType` field)
- `ChatMessage.replyTo` → `ChatMessage._id` (self-referential)
- `EditNotification.messageId` → `ChatMessage._id`
- Chat-related collections share `conversationId` grouping key

## 6. Authentication System

### Password Login
- **Endpoint**: `POST /api/auth`
- **Default password**: `ourlove` (bcrypt-hashed)
- **Progressive lockout**: 0-4 attempts → no lock; 5th → 30s; 6th → 60s; up to 600s max
- **Returns**: JWT (30-day expiry) with `{ authenticated: true }` payload

### Biometric Login
- **Endpoint**: `POST /api/auth/biometric`
- **WebAuthn**: Platform authenticator (fingerprint/Face ID)
- **Encryption**: Password encrypted with AES-256-GCM in IndexedDB
- **Flow**: Biometric verify → decrypt password → call `/api/auth`

### Client-side Lock (`useAppLock`)
- **Triggers**: visibilitychange, pagehide, beforeunload, keyboard shortcut
- **Privacy**: Paints privacy canvas, changes title to "Protected"
- **Security**: Pushes history entry to prevent back-button bypass

## 7. Real-Time Architecture

### Socket.IO (server.js, 661 lines)
- **Path**: `/api/socketio`
- **Transports**: WebSocket + HTTP polling
- **Room model**: Single conversation room (`main`)

### 24 Inbound Events
`joinConversation`, `leaveConversation`, `sendMessage`, `typing`, `stopTyping`, `partnerReading`, `partnerStopReading`, `updatePresence`, `messageDelivered`, `messageSeen`, `messageReadBatch`, `addReaction`, `editMessage`, `deleteMessage`, `sendConversationDeleteRequest`, `approveConversationDeleteRequest`, `declineConversationDeleteRequest`, `chatThemeUpdated`, `sendDeleteRequest`, `approveDeleteRequest`, `declineDeleteRequest`, `disappearingConfigUpdated`, `keepMessage`, `disconnect`

### HTTP Polling Fallback (`useSocket.ts`)
- **Message poll**: every 2s (`/api/chat/poll`)
- **Status poll**: every 1.5s
- **Edit-notify poll**: every 1s (always runs)
- **Presence heartbeat**: every 5s (`/api/chat/presence`)

### Data Flow
1. Socket connected → use socket for all events
2. Socket disconnects → automatically switches to HTTP polling
3. Socket reconnects → switches back to socket mode
4. Both paths use same React Query cache, keeping UI consistent

## 8. State Management

### Zustand Stores (5)
| Store | Persistence | Fields |
|---|---|---|
| `auth` | localStorage (`our-story-auth`) | isAuthenticated, token, activeProfile, rememberProfile |
| `app` | localStorage (darkMode only) | activeTab, isAdding, searchQuery, darkMode |
| `chat` | None | 32 fields: messages, presence, typing, UI state, viewers |
| `chatTheme` | None (server-backed) | theme settings |
| `lock` | None | isLocked, lastPath, failedAttempts, lockoutUntil |

### React Query
- 16 query hooks, 16 mutation hooks, 2 helper hooks
- Infinite query for chat messages (cursor-based, 30/page)
- Stale times: 30s (chat) → 5min (settings/stats)
- Cache helpers for surgical updates (reactions, read receipts, kept status)

## 9. Security Analysis

| Layer | Implementation |
|---|---|
| Password | bcryptjs hashing |
| Auth tokens | JWT (30-day expiry) |
| API protection | Bearer token on export endpoint; lockout on auth endpoints |
| Security headers | X-Content-Type-Options, X-Frame-Options DENY, XSS-Protection, Referrer-Policy, Permissions-Policy |
| Privacy | Canvas overlay on background, title spoofing, history manipulation |
| Biometric | WebAuthn + AES-256-GCM encrypted password in IndexedDB |
| Data export | Optional AES-256-GCM encryption with PBKDF2 key derivation |
| Disappearing messages | Configurable duration, both users can "keep" |
| Delete workflow | Mutual approval required for content deletion |

### Environment Variables
| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | JWT signing secret |
| `CLOUDINARY_CLOUD_NAME` | No | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | No | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | No | Cloudinary API secret |

## 10. Performance

- **Lazy loading**: Images use `loading="lazy"`, dynamic imports for heavy components
- **Code splitting**: Next.js App Router automatic route-based splitting
- **Infinite scrolling**: Chat messages use cursor-based pagination
- **Image optimization**: Cloudinary auto-quality transforms
- **Video optimization**: Cloudinary HD streaming eager transforms
- **Database indexing**: Compound indexes on frequently queried fields
- **Optimistic updates**: Messages, reactions, read receipts update UI instantly
- **TTL auto-cleanup**: MongoDB auto-deletes expired typing/presence/notification documents
- **Connection caching**: Mongoose global singleton, React Query client singleton

## 11. Export System

| Format | Service | Features |
|---|---|---|
| JSON | `jsonExporter.ts` | Full data dump, sanitized (no passwordHash) |
| ZIP | `zipExporter.ts` | JSON + optional AES-256-GCM encrypted archive + media files |
| PDF Book | `bookGenerator.ts` + `pdfExporter.ts` + `BookTemplate.tsx` | 790-line React template → html2canvas → jsPDF |

## 12. Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ React 19 │  │ Zustand  │  │ TanStack Query 5  │  │
│  │ Next.js  │  │ (5 store)│  │ (16 queries)      │  │
│  │ 16 SSR   │  └──────────┘  └───────────────────┘  │
│  └──────────┘                                        │
│       │              │                │               │
│  ┌────▼────┐  ┌──────▼──────┐  ┌────▼──────────┐    │
│  │ Socket  │  │   Axios     │  │  Framer Motion │    │
│  │ .IO     │  │  HTTP/API   │  │  (animations)  │    │
│  │ Client  │  │  Client     │  │                │    │
│  └────┬────┘  └──────┬──────┘  └────────────────┘    │
└───────┼──────────────┼───────────────────────────────┘
        │              │
   WebSocket      HTTP/REST
        │              │
┌───────▼──────────────▼───────────────────────────────┐
│              CUSTOM SERVER (Node.js)                  │
│  ┌──────────────────────────────────────────────┐    │
│  │  server.js (661 lines)                       │    │
│  │  • Socket.IO (24 inbound events)             │    │
│  │  • Next.js request handler                   │    │
│  │  • Health check endpoint                     │    │
│  └──────────────────────────────────────────────┘    │
│       │                    │                         │
│  ┌────▼────┐         ┌────▼──────────┐              │
│  │ Next.js │         │  47 API Routes │              │
│  │ Pages   │         │  (App Router)  │              │
│  └─────────┘         └───────┬────────┘              │
└──────────────────────────────┼───────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │     MongoDB         │
                    │  (19 collections)   │
                    │  • TTL indexes      │
                    │  • Text search      │
                    │  • Compound indexes │
                    └─────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
     ┌────────▼──────┐ ┌──────▼─────┐ ┌───────▼───────┐
     │  Cloudinary   │ │  Firebase  │ │  Web Crypto   │
     │  (media CDN)  │ │  (FCM)     │ │  (AES-256)    │
     └───────────────┘ └────────────┘ └───────────────┘
```
