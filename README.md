<div align="center">

<img src="Frontend/public/PGLens_logo_1.png" alt="PGLens Logo" width="80" />

# 🏠 PGLens

### *See your PG before you sign the lease.*

**An AI-Powered Transparency Platform for Student Accommodation in India**

[![Made with React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-orange?style=flat-square&logo=react)](https://reactjs.org/)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-orange?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-orange?style=flat-square&logo=postgresql)](https://postgresql.org/)
[![AI](https://img.shields.io/badge/AI-Gemini%20API-orange?style=flat-square&logo=google)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-Academic-white?style=flat-square)](#)

---

*Built as a semester Full-Stack + AI/ML project — but designed like something real.*

</div>

---

## 🤔 Why PGLens Exists

Every student who has looked for a PG knows the drill — glossy photos on the listing, a landlord who swears the food is "home-cooked", and then you move in and find out the WiFi barely loads a webpage and the bathroom hasn't been cleaned since 2019.

**PGLens was built to fix exactly that.**

We built a platform where student reviews aren't just star ratings — they're analysed by AI, cross-checked against what the owner claimed, and turned into a transparent scorecard that tells you *exactly* what you're walking into. No more guessing. No more getting burned on a 6-month lease.

---

## ✨ What PGLens Can Do

### 📊 Transparency Scorecard
Every PG gets a score across 5 dimensions — **Hygiene, Food, Safety, Amenities, and Pricing** — calculated automatically from student reviews. Not a vibe. Actual weighted data.

### 🧠 AI-Powered Review Analysis
When a student submits a review, our Gemini-powered NLP engine reads it, extracts the sentiment (positive / negative / neutral), pulls out key phrases like *"no hot water"* or *"amazing food"*, and tags it by topic. The insight shows up instantly on the PG detail page.

### 🖼️ Image Upload & Room Verification
Owners upload photos to Cloudinary. Students can upload residency proof. Images are stored, linked to listings, and surfaced in the gallery — no broken links, no fake stock photos.

### 💰 Fair Pricing Indicator
We compare a PG's listed rent against the city average and flag it as **Fairly Priced**, **Overpriced**, or **Good Deal** — so students can spot a rip-off before they pay the deposit.

### 🔍 Claim vs Reality
Owners make claims — *"24/7 security", "vegetarian food available", "high-speed WiFi"*. We track those claims and match them against what students actually report in reviews. The mismatches show up on the scorecard.

### 🗺️ Distance from College
Find PGs near your college using map-based distance filtering. We use OpenStreetMap + Leaflet to calculate how far each PG is from a given set of coordinates.

### ⭐ Verified Student Reviews
Before a student's review goes live, they can verify residency by uploading proof. Verified reviews get a badge — and carry more weight in the scorecard algorithm.

### 🛡️ Admin Moderation Panel
Admins can approve/reject PG listings, manage pending residency verifications, and moderate reviews — with a full filter view (All / Approved / Flagged / Removed) and live NLP sentiment badges on every review.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | Node.js, Express.js, REST API |
| **Database** | PostgreSQL (with raw SQL — no ORM) |
| **Auth** | JWT, bcrypt, Google OAuth (Passport.js) |
| **AI / NLP** | Google Gemini 1.5 Flash API |
| **Image Storage** | Cloudinary |
| **Maps** | OpenStreetMap + Leaflet (react-leaflet) |
| **Animations** | Framer Motion |
| **Dev Tools** | Nodemon, dotenv, CORS |

---

## 🧱 How It All Connects

```
Student submits a review
        ↓
Express backend saves it to PostgreSQL
        ↓
Gemini API analyses the text → sentiment + keywords stored
        ↓
Scorecard engine recalculates weighted scores for that PG
        ↓
Frontend fetches updated scorecard + NLP insights
        ↓
Student sees a transparent, AI-backed report on the PG detail page
```

Owner claims → stored at listing creation
Student reviews → cross-referenced against claims
Admin panel → moderation + approval layer on top of everything

---

## 🗂️ Project Structure

```
PGLens/
├── Frontend/               # React + Vite app
│   └── src/
│       ├── pages/          # Home, Explore, PGDetail, Dashboards
│       ├── components/     # Navbar, ScoreCard, PGCard, ImageUploader
│       └── lib/
│           └── api.ts      # All backend calls in one place
│
├── backend/                # Node.js + Express API
│   └── src/
│       ├── routes/         # auth, pgs, reviews, admin, images
│       ├── controllers/    # Business logic per resource
│       ├── config/         # DB, Cloudinary, NLP (Gemini), Passport
│       └── middleware/     # JWT protect, role-based restrictTo
│
└── nlp_service/            # Python NLP microservice (experimental)
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js 18+
- PostgreSQL running locally
- A free [Gemini API key](https://aistudio.google.com/app/apikey)
- A free [Cloudinary account](https://cloudinary.com/)

### Backend
```bash
cd backend
npm install
# Create your .env (see below)
npm start
```

### Frontend
```bash
cd Frontend
npm install
npm run dev
```

### Environment Variables — `backend/.env`
```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/pglens
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GEMINI_API_KEY=your_gemini_key
```

---

## 📌 Roadmap

- [x] Auth — register, login, JWT, role-based guards (student / owner / admin)
- [x] PG listing creation, image upload, admin approval flow
- [x] Transparency scorecard — weighted scores from student reviews
- [x] NLP sentiment analysis on review text (Gemini API)
- [x] Admin review moderation panel with sentiment badges
- [x] Residency verification for trusted reviews
- [x] Owner reply to reviews
- [x] Saved PGs for students
- [ ] Map view on Explore page (react-leaflet)
- [ ] Claim vs Reality display on PG detail page
- [ ] Computer Vision analysis on uploaded room images
- [ ] Homepage live stats from real database
- [ ] Mobile-responsive polish pass

---

## 👩‍💻 The Team

We're three CS students who got tired of bad PG experiences and decided to build the thing we wished existed.

<table>
<tr>
<td align="center">
<a href="https://github.com/Ayushi536">
<img src="https://github.com/Ayushi536.png" width="80" style="border-radius:50%" /><br/>
<strong>Ayushi Sharma</strong><br/>
<sub>@Ayushi536</sub>
</a>
</td>
<td align="center">
<a href="https://github.com/Kritika-Kanchan-dev">
<img src="https://github.com/Kritika-Kanchan-dev.png" width="80" style="border-radius:50%" /><br/>
<strong>Kritika Kanchan</strong><br/>
<sub>@Kritika-Kanchan-dev</sub>
</a>
</td>
<td align="center">
<a href="https://github.com/Navya-Garg1105">
<img src="https://github.com/Navya-Garg1105.png" width="80" style="border-radius:50%" /><br/>
<strong>Navya Garg</strong><br/>
<sub>@Navya-Garg1105</sub>
</a>
</td>
</tr>
</table>

---

## 🎯 Impact We're Going For

The Indian PG market is massive, unregulated, and deeply opaque — especially for students moving to a new city for the first time. PGLens won't fix all of that overnight, but it takes a real swing at the core problem: **information asymmetry**.

When students can see verified reviews, AI-extracted insights, and owner claim comparisons side by side — they make better decisions. And when owners know their PG will be held accountable by real data, they have a reason to actually improve.

That's the idea. We're building it one feature at a time.

---

## 🔭 What's Next (Future Scope)

- 📱 Mobile app (React Native)
- 🔖 Online booking + waitlist system
- 💳 Deposit escrow & dispute resolution
- 🤝 Roommate compatibility matching
- 🏫 College & institutional partnerships
- 🚨 Advanced fraud detection on listings

---

<div align="center">

*Made with chai, late nights, and a genuine hatred of misleading PG listings.*

⭐ **If you find this useful, give the repo a star — it means a lot to a student project.**

</div>