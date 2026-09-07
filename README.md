# SmritiSaathi (স্মৃতিসাথী) — NER Cognitive Gaming & Memory Assistance Platform

**SmritiSaathi** ("Memory Companion") is an AI-powered cognitive gaming and memory assistance platform designed specifically for elderly dementia patients and their caregivers in India's North Eastern Region (NER).

---

## 1. System Architecture

```text
Elderly User (Large Touch UI, Voice)      Caregiver (Clinical Observation, Analytics)
              │                                                │
              ▼                                                ▼
     Mobile-Responsive Web App (React 19 + Tailwind CSS + Web Speech & Web Audio APIs)
                                       │
                                       ▼ REST API
                          Express / Node.js Backend
      ├── Game & Session Logging Service (`POST /api/game-sessions`)
      ├── AI Personalization Engine (Rolling weighted engagement scoring & rule-based difficulty)
      ├── Reminders CRUD Service (`/api/reminders`)
      ├── Alerts & SOS Notification Service (`/api/alerts`)
      ├── Familiar Loved Ones Service (`/api/familiar-people`)
      └── Auth & Patient Linking Service (`/api/auth/login`, `/api/patients`)
                                       │
                                       ▼
                 PostgreSQL / Structured In-Memory Database
```

---

## 2. Core Modules

### 👵 Elderly User Experience
- **Accessibility First**: Large minimum 60px tap targets, high contrast, warm and calm tones (no alarming clinical vibes).
- **Voice Guidance**: Integrated Web Speech API with regional fallbacks reading aloud greetings, questions, and game directions.
- **Gentle Feedback**: End of games provides encouraging stars (1–3 stars), smiling faces, soothing chimes, and cultural celebration—never stressful numbers, failure buzzers, or countdown clocks.
- **Prominent SOS Button**: Instant touch notification to caregiver Priya Barua with calm audio reassurance.
- **5 Cognitive Games**:
  1. **Memory Card Match**: Culturally familiar symbols (Kaji Nemu lemon, One-horned Rhino, Bihu Dhol, Living Root Bridge, Japi hat, Hornbill bird).
  2. **Sequence Recall**: Repeat rhythmic sequences of Northeast musical instruments and fruits.
  3. **Cultural Picture Recognition**: High-resolution image identification of regional treasures.
  4. **Simple Scenery Puzzle**: Tap-swap jigsaw of iconic sights with reference thumbnail.
  5. **Family & Friends Face Match**: Match caregiver-uploaded family photos (Granddaughter Priya, Son Rohan, Grandson Nilav) to preserve personal memory ties.

### 🩺 Caregiver Dashboard
- **Patient Switcher**: Toggle between linked patients (e.g. Bhaben Barua Dadaji in Guwahati, Kong Mary Lyngdoh in Shillong).
- **Interactive Charts (Recharts)**:
  - Accuracy trend across sessions compared to baseline
  - Average response time trends (seconds)
  - Cognitive domain participation breakdown
- **Weekly Baseline Observation**: Empirical calculation of deviation from typical baseline (e.g. *"+6% above typical baseline — patient demonstrates consistent cognitive alertness"*).
- **Full Reminders CRUD**: Schedule daily medications, meals, exercise, and doctor check-ups with automatic sync to the elderly interface.
- **Safety Alert Log**: Review and resolve SOS triggers and missed medication logs.
- **Family Loved Ones Manager**: Add family photos, relationship labels, and personal voice memory cues.

---

## 3. AI Personalization Engine

The backend AI engine computes a rolling **Cognitive Engagement Index**:
$$\text{Engagement Score} = (0.60 \times \text{Accuracy}) + (0.25 \times \text{Normalized Speed}) + 15$$

- **Rule-Based Adaptive Difficulty**:
  - If rolling accuracy $\ge 88\%$, response time $< 6.0\text{s}$, and mistakes $\le 1.2$: Automatically steps up to `medium` / `hard` to stimulate neuroplasticity.
  - If accuracy $< 60\%$ or high mistake frequency: Automatically relaxes to `easy` with extra comforting cues.
- **Rotation Recommendation**: Chooses next recommended activity based on least played domain to ensure balanced cognitive engagement.

---

## 4. NER Regional & Cultural Adaptation Pack

Configurable regional content pack supporting:
- **Assamese (অসমীয়া)**
- **Khasi (Ka Ktien Khasi - Meghalaya)**
- **Manipuri (মৈতৈলোন্ / Meiteilon)**
- **Hindi (हिन्दी)**
- **English (Universal)**

Includes localized cultural symbols:
- Assam Lemon (Kaji Nemu), Kaziranga Great One-Horned Rhino, Bihu Dhol & Pepa horn, Majuli Vaishnavite Mask, Living Root Bridges (Jingkieng Jri) of Meghalaya, Sohphie wild berries, Manipuri Pung Cholom, and Great Indian Hornbill of Nagaland.

---

## 5. Mandatory Ethical Guardrail

Every screen displaying scores, charts, or observations prominently displays the ethical disclaimer:

> **"This is a cognitive engagement tool, not a medical diagnosis. Consult a healthcare professional for clinical assessment."**

All AI insights are intentionally framed as **"Engagement Observations"** rather than clinical cognitive deficits.
