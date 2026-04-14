<div align="center">

<img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
<img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
<img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
<img src="https://img.shields.io/badge/Twilio-F22F46?style=for-the-badge&logo=twilio&logoColor=white" />
<img src="https://img.shields.io/badge/Razorpay-02042B?style=for-the-badge&logo=razorpay&logoColor=3395FF" />

<br /><br />

# 🗣️ BusinessVaani

### *The AI Operating System for India's WhatsApp Economy*

> Built for 60M+ Indian SMBs who run their business inside WhatsApp chats — but deserve so much more than that.

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-vaani--v--neon.vercel.app-00C896?style=for-the-badge)](https://vaani-v-neon.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-pearll12%2Fvaani--v-181717?style=for-the-badge&logo=github)](https://github.com/pearll12/vaani-v)

</div>

---

## 📸 Screenshots
### Dashboard — Real-Time Business Hub
<img width="2879" height="1468" alt="image" src="https://github.com/user-attachments/assets/e7010a56-3f18-4e80-a859-cc31ef377923" />
<sub><em>Live sales, pending orders, GST collected — all in one glance.</em></sub>

### AI Order Intelligence — WhatsApp → Structured Order
<img width="1851" height="1366" alt="image" src="https://github.com/user-attachments/assets/32899b9a-aea7-4aa5-b268-c0045f8aabe4" />
<sub><em>A voice note saying "bhaiya 2 kilo aloo kal bhejna" becomes a confirmed order with delivery details extracted automatically.</em></sub>
### Instant Invoicing — GST-Compliant, One Click
<img width="1033" height="1250" alt="image" src="https://github.com/user-attachments/assets/beffb36f-1fc3-4022-930e-fdc83a8818b5" />

*Tax Invoice generated via PDFKit and sent back over WhatsApp — no human intervention needed.*

### Khata — Credit Ledger for Trusted Customers
<img width="2842" height="1449" alt="image" src="https://github.com/user-attachments/assets/3feb8602-8b1f-4353-ac6f-cfae5fe78c1e" />

*Track who owes what. The digital equivalent of the shopkeeper's bahi-khata.*

---

## 🚨 The Problem

India has **60M+ small businesses** — kiranas, distributors, traders — that live inside WhatsApp. But WhatsApp was never built for business operations.

| Pain Point | Real Impact |
|---|---|
| Orders buried in group chats | Lost sales, wrong quantities |
| Payments mentioned casually | ₹500 Cash? Paytm? Nobody knows. |
| Manual Excel entry at night | 2+ hours wasted daily |
| No invoice trail | GST headaches, disputes |

> **💸 Businesses lose 10–15% of daily revenue because of this chaos.**

---

## ✅ Our Solution

BusinessVaani is a **WhatsApp-native AI operating system** that sits invisibly behind every chat and converts conversational chaos into structured business operations — without changing how shopkeepers already work.

```
Customer texts/voices  →  AI extracts order  →  Invoice generated  →  Payment link sent  →  Analytics updated
         (WhatsApp)            (Groq LLaMA)           (PDFKit)              (Razorpay)            (Supabase)
```

### Core Features

#### 🧠 AI Order Intelligence
- Reads **text + voice messages** from WhatsApp automatically
- Understands **Hinglish, Hindi, Tamil, Urdu, Marathi** and mixed-language inputs
- Extracts: items, quantity, delivery address, customer intent
- Example: *"bhaiya 2 kilo aloo aur ek packet namak kal subah bhejna"* → `{ item: "aloo", qty: 2, unit: "kg", item2: "namak", qty2: 1, delivery: "tomorrow morning" }`

#### 🧾 Instant GST Invoicing
- Auto-generates **GST-compliant Tax Invoices** (CGST 9% + SGST 9%)
- One-click PDF via PDFKit — no template editing
- Invoice **sent back on WhatsApp** automatically
- Status tracking: Pending → Invoiced → Paid

#### 💰 Revenue Management
- Tracks every payment — cash, UPI, Razorpay
- **Auto-generates Razorpay payment links** and sends them to customers
- Reduces missed collections with pending payment alerts

#### 📊 Business Intelligence Dashboard
- Real-time sales & inventory analytics
- Customer repeat-purchase tracking
- Low stock alerts
- Simple, mobile-first UI designed for non-technical shopkeepers

#### 📒 Khata (Credit Ledger)
- Digital bahi-khata for trusted credit customers
- Track outstanding balances per buyer
- Send payment reminders directly over WhatsApp

---

## 🏗️ Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                        INPUT LAYER                          │
│           Twilio WhatsApp API → Webhook /api/webhook        │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                     PROCESSING LAYER                        │
│          Groq (LLaMA 3.3) → NLP Extraction (nlu.js)        │
│         [ Voice transcription + Hinglish parsing ]          │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                      BACKEND LAYER                          │
│         Next.js API Routes: /orders /invoice /payments      │
└──────────┬──────────────────────────────┬───────────────────┘
           │                              │
┌──────────▼──────────┐       ┌───────────▼───────────────────┐
│     DATA LAYER      │       │         OUTPUT LAYER           │
│ Supabase PostgreSQL │       │  PDFKit (Invoices)             │
│  + Realtime subs    │       │  Razorpay (Payment Links)      │
└──────────┬──────────┘       └───────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────┐
│                    FRONTEND LAYER                           │
│              Next.js Dashboard + Tailwind UI                │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, Tailwind CSS |
| **Backend** | Next.js API Routes (Edge-compatible) |
| **AI / NLP** | Groq API — LLaMA 3.3 70B |
| **WhatsApp** | Twilio WhatsApp Business API |
| **Database** | Supabase (PostgreSQL + Realtime) |
| **Invoicing** | PDFKit |
| **Payments** | Razorpay |
| **Hosting** | Vercel |

### Supabase Schema (Key Tables)

```
orders          → id, customer_phone, raw_message, items (jsonb), language, status, total_amount, source
invoices        → id, order_id, pdf_url, sent_at
customers       → phone (PK), business_name, logo_url, created_at
inventory       → id, name, sku, category, quantity, unit, price, lowStockThreshold
business_profiles → id, business_name, whatsapp_number, upi_id, invoice_footer, currency
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Twilio](https://twilio.com) account with WhatsApp sandbox enabled
- A [Supabase](https://supabase.com) project
- A [Groq](https://console.groq.com) API key
- A [Razorpay](https://razorpay.com) account (test mode works)

### 1. Clone the repo

```bash
git clone https://github.com/pearll12/vaani-v.git
cd vaani-v
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Twilio
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Groq
GROQ_API_KEY=your_groq_api_key

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set up the Supabase database

Run the SQL schema in your Supabase dashboard (SQL Editor):

```sql
-- Orders table
create table orders (
  id bigint primary key generated always as identity,
  customer_phone text,
  raw_message text,
  items jsonb,
  language text,
  status text default 'pending',
  total_amount numeric,
  source text,
  created_at timestamp with time zone default now()
);

-- Invoices table
create table invoices (
  id bigint primary key generated always as identity,
  order_id bigint references orders(id),
  pdf_url text,
  sent_at timestamp with time zone
);

-- Customers table
create table customers (
  phone text primary key,
  business_name text,
  logo_url text,
  created_at timestamp with time zone default now()
);

-- Inventory table
create table inventory (
  id text primary key,
  name text,
  sku text,
  category text,
  quantity int4,
  unit text,
  price numeric,
  "lowStockThreshold" int4,
  "createdAt" timestamptz default now()
);

-- Business profiles table
create table business_profiles (
  id uuid primary key default gen_random_uuid(),
  business_name text,
  logo_url text,
  whatsapp_number text,
  upi_id text,
  invoice_footer text,
  currency text default 'INR',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 4. Configure Twilio Webhook

In your Twilio console, set the WhatsApp sandbox **"When a message comes in"** webhook to:

```
https://your-deployment-url.vercel.app/api/webhook
```

> For local development, use [ngrok](https://ngrok.com): `ngrok http 3000`

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📱 How It Works (End-to-End Flow)

```
1. Customer sends WhatsApp message (text or voice note)
        ↓
2. Twilio receives → fires POST to /api/webhook
        ↓
3. Groq LLaMA 3.3 parses the message:
   - Detects language (Hindi/English/Hinglish/Tamil...)
   - Extracts: items, quantities, units, delivery info
   - For voice notes: transcribes first, then extracts
        ↓
4. Order saved to Supabase → appears live on dashboard
        ↓
5. Bot replies: "✅ Order record ho gaya! (#4) • 2x aloo • 1x namak"
        ↓
6. Shopkeeper clicks "Send Invoice" on dashboard
        ↓
7. PDFKit generates GST-compliant PDF → stored on Supabase storage
        ↓
8. Razorpay payment link generated + sent back to customer over WhatsApp
        ↓
9. Payment confirmed → order status updated → analytics refreshed
```

---

## 🆚 How We Compare

| Capability | Interakt / Zoko | **BusinessVaani** |
|---|---|---|
| Problem Scope | Chat management only | Full workflow: order → invoice → payment → analytics |
| Input Handling | Text-based, limited multilingual | Voice notes + Hinglish + 6 Indian languages |
| Execution Layer | Insights / extracted data | Direct actions: invoicing, payment links, reminders |
| Operational Depth | No business tools | Inventory, Khata (credit), low-stock alerts |
| Target Users | Digitally mature businesses | Informal, WhatsApp-first SMBs |

---

## 🔮 Future Scope

- **📸 Smart Input Expansion** — Photo upload to extract orders from handwritten lists or product images
- **🏢 Multi-Business Platform** — Separate data profiles per business, white-label support
- **🤖 Intelligent Context Handling** — Conversation memory so the bot remembers "Ravi always orders 5kg aata on Mondays"
- **📦 Supplier-side Integration** — Auto-reorder when inventory hits threshold
- **🏦 Embedded Credit** — Khata → creditworthiness signal → micro-loans via NBFC partners

---

## 👥 Team — LevelUp

| Name |
|---|---|
| **Anushree Jain** 
| **Pearl Vashistha** 
| **Priya Agrasen** 


---

## 📄 License

MIT © 2025 LevelUp Team

---

<div align="center">

**"We don't digitize business. We understand it where it actually happens — inside WhatsApp."**

[![Live Demo](https://img.shields.io/badge/Try_BusinessVaani_Live-00C896?style=for-the-badge&logo=vercel&logoColor=white)](https://vaani-v-neon.vercel.app/)

</div>
