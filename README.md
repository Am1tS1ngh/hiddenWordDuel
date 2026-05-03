# Hidden Word Duel

A real-time multi-player word guessing game. Two players connect, a random word gets picked, and letters reveal one by one every few seconds. First to guess the full word wins the round. Best of 5 wins the match.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-6366f1?style=for-the-badge)](https://hidden-word-duel-ten.vercel.app/)

---
## Screenshots

### Landing Page
<img width="1571" height="861" alt="image" src="https://github.com/user-attachments/assets/7f151cd1-1f03-466a-b501-e20d7a7ea7e7" />


### Waiting for Opponent
<img width="1572" height="856" alt="image" src="https://github.com/user-attachments/assets/f0cc5070-935e-4e5e-8da8-17545fda3e47" />


### In Game
<img width="1907" height="868" alt="image" src="https://github.com/user-attachments/assets/d959552c-081d-4578-b3aa-f4bbb5ee7676" />


### Next Round Countdown
<img width="1571" height="856" alt="image" src="https://github.com/user-attachments/assets/a6d89685-9f52-4889-aa88-290d74b3c3d2" />


### Final Result
<img width="1570" height="854" alt="image" src="https://github.com/user-attachments/assets/a490595b-c219-4778-830b-c9ec1c53767f" />

---

## How it works

- Two players join the lobby and get matched automatically
- A word is chosen randomly and shown as blank tiles `_ _ _ _ _`
- Every 5 seconds a new letter reveals at a random position
- Both players submit one guess per tick
- First correct guess wins the round — if both guess right at the same time it's a draw
- Match ends when someone hits 3 points or all 5 rounds finish
- If a player disconnects mid-round, the other player wins after a short delay

---

## Tech stack

- **Frontend** — Next.js + Tailwind CSS, deployed on Vercel
- **Backend** — NestJS with WebSocket gateway, deployed on Railway
- **Database** — PostgreSQL via Supabase, Prisma as ORM
- **Real-time** — Socket.io

---

## Project structure

```
hiddenWordDuel/
├── client/       # Next.js frontend
└── server/       # NestJS backend
```

---

## Local setup

You need Node.js and a PostgreSQL database (or a free Supabase project).

**1. Clone the repo**
```bash
git clone https://github.com/Am1tS1ngh/hiddenWordDuel.git
cd hiddenWordDuel
```

**2. Setup the server**
```bash
cd server
npm install
```

Create a `.env` file inside `server/`:
```env
#these are example values for db related connections 
# Direct connection for migrations
DIRECT_URL="postgresql://postgres:[DB_PASSWORD]@db.lvkyqqvdmxjop.supabase.co:5432/postgres"

# Pooled connection for runtime queries
DATABASE_URL="postgresql://postgres.lvkyqqvdmxjop:[DB_PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
PORT=5000
```

Run migrations and start:
```bash
npx prisma migrate deploy
npm run start:dev
```

**3. Setup the client**
```bash
cd client
npm install
```

Create a `.env.local` file inside `client/`:
```env
NEXT_PUBLIC_SERVER_URL=http://localhost:5000
```

Start the frontend:
```bash
npm run dev
```

Open `http://localhost:3000` in two different browser tabs and play against yourself.

---

## Deployment

- Backend is on Railway — it reads `PORT` automatically and runs `prisma migrate deploy` on every deploy
- Frontend is on Vercel — just set `NEXT_PUBLIC_SERVER_URL` to your Railway backend URL
- Database is on Supabase — copy the direct connection and pool connection strings into Railway's environment variables as `DIRECT_URL` and `DATABASE_URL`

---

## Edge cases handled

- Player disconnects mid-round → opponent gets the win after 3 seconds
- Both players guess correctly at the same time → round draw, no points
- Late guess after tick ends → rejected with reason
- Multiple guess attempts in one tick → only first one accepted
- Duplicate socket registration on play again → fixed with registration ref reset

---

## Commits

| Date | Commit |
|------|--------|
| May 4 | fix: play again, disconnect handling |
| May 3 | fix: use polling transport for socket connection |
| May 3 | fix: bind NestJS server to 0.0.0.0 for Railway |
| May 3 | fix: DB connection issues, gameplay stability, and player registration |
| May 2 | fix: address minor bugs in game logic and synchronization |
| May 2 | feat: build interactive game interface with animations and state handling |
| May 1 | feat: complete core websocket gateway and edge case handling |
| May 1 | Word dictionary service getRandomWord() |
| May 1 | Database schema and Prisma service setup |
| May 1 | Initial Setup done |
