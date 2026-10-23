# WasteWise: setup brief for Gemini / Google AI Studio

> **To the AI reading this:** your job is to connect this existing project to a Gemini API key and to
> Firebase so that every feature works. **Do not redesign, rename, restyle or rewrite features.** Only touch the
> config files and the exact lines named below. If something here doesn't match the code you see, stop and ask
> the user before changing anything else.

---

## 1. What the project is

- **WasteWise** ("Sort smarter. Waste less."): an AI waste-sorting assistant for a college campus.
  A user scans, uploads or describes an item; Gemini identifies it; the app looks the item up in a
  campus waste guide and shows the bin, the preparation steps and the exact rule it used.
- **Two pages, one Vite project:**
  - `/` → `index.html` + `hero/style.css` + `hero/script.js`: plain HTML/CSS/JS landing page.
  - `/app.html` → `src/main.tsx`: the React app. Screens have addresses: `#scan`, `#guide`,
    `#leaderboard`, `#history`, `#profile`, `#lulu` (opens the chat).
- **Stack:** Vite 8, React 19, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), lucide-react,
  `@google/genai`, Firebase (Anonymous Auth + Cloud Firestore), three.js / React Three Fiber / drei for
  the 3D globe. Path alias `@/` → `src/`.

### The one rule that must never change

**Gemini identifies the item. The guide decides the bin.** Gemini only returns an item name and a
`rule_id` (JSON, enforced by a response schema). `src/lib/flow.ts` checks that `rule_id` against
`src/data/wasteGuide.json`, and the screen shows the category, steps and rule text **from the guide
file**, never from the model's wording. If the rule isn't in the guide, the app says "Local disposal rule
not found". No numbers, ranks or stats are ever invented; points and ranks come from app code and
Firestore.

---

## 2. Gemini API key

### 2a. Running with Vite (local machine, or any normal Node host)

1. Get a key at <https://aistudio.google.com/apikey>.
2. In the project root, create **`.env.local`** (it must never be committed):

   ```bash
   VITE_GEMINI_API_KEY=paste-your-gemini-key-here
   # optional: any multimodal Gemini model that supports JSON output with a response schema
   VITE_GEMINI_MODEL=gemini-2.5-flash
   ```

3. Restart the dev server. Vite only reads env files at start-up.

The key is read in exactly one place, `src/lib/gemini.ts` lines 6–7:

```ts
const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
const model = (import.meta.env.VITE_GEMINI_MODEL as string | undefined) || "gemini-2.5-flash"
```

If `gemini-2.5-flash` is not available on the account, set `VITE_GEMINI_MODEL` to the current Gemini
Flash model name. Don't change any code for that.

### 2b. Running inside AI Studio's app builder

If the environment injects the key as `process.env.API_KEY` or `process.env.GEMINI_API_KEY` instead of
using `.env.local`, change **only line 6** of `src/lib/gemini.ts` to:

```ts
const apiKey =
  (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ||
  (typeof process !== "undefined" ? process.env.GEMINI_API_KEY || process.env.API_KEY : undefined)
```

…and, only if that environment builds with this project's `vite.config.ts`, add a `define` block so the
value exists in the browser bundle:

```ts
// vite.config.ts — inside defineConfig({...}), next to `plugins`
define: {
  "process.env.GEMINI_API_KEY": JSON.stringify(process.env.GEMINI_API_KEY ?? ""),
  "process.env.API_KEY": JSON.stringify(process.env.API_KEY ?? ""),
},
```

Everything else about Gemini stays as is: the system instructions, the two response schemas
(`scanSchema`, `luluSchema`), the silent single retry on invalid JSON, and the client-side `rule_id`
validation.

### 2c. Check that it worked

With no key, the app shows: *"Gemini isn't set up yet — add VITE_GEMINI_API_KEY to .env.local and restart
the app."* Once the key is in, typing "a greasy pizza box" on Home should either ask a clarifying question
or show **Wet Waste: Green bin, Campus Waste Guide §2.3**.

---

## 3. Firebase (profiles, points, live leaderboard)

Without Firebase the app still works: points and levels stay on the device, and the leaderboard shows
"not connected". To turn on the shared campus leaderboard:

1. **Create a project** at <https://console.firebase.google.com> → *Add app* → **Web**. Copy the config.
2. Add it to the same **`.env.local`**:

   ```bash
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   ```

   (Read in `src/lib/firebase.ts`. The app switches on Firebase when `API_KEY`, `PROJECT_ID` and `APP_ID` are set.)
3. **Authentication** → *Sign-in method* → enable **Anonymous**. No sign-up form is used.
4. **Firestore Database** → *Create database* (production mode).
5. **Deploy the security rules and indexes** that are already in the repo:

   ```bash
   npx firebase-tools login
   npx firebase-tools use --add          # pick the project
   npx firebase-tools deploy --only firestore
   ```

   This uses `firebase.json`, `firestore.rules` and `firestore.indexes.json`. Index builds take a few
   minutes; until they finish, the leaderboard says the index is still being created. **Do not loosen
   the rules.** They let users write only their own document, allow points only to go up (by at most 25
   per write), and keep hidden users out of public queries.

Collections used: `users/{uid}` (profile + points) and `nicknames/{name}` (reserves unique nicknames).
Scan history never leaves the device (`localStorage`).

---

## 4. Install and run

```bash
npm install
npm run dev
```

- Landing page: `http://localhost:5173/` · App: `http://localhost:5173/app.html`
- Production build: `npm run build` (type-check + both pages into `dist/`), preview with `npm run preview`.
- On this Mac, Homebrew's Node is currently broken (missing `libsimdjson`). Run `brew upgrade node` first.
- If the browser shows **"Invalid hook call"** right after installing packages, it's Vite's dependency
  cache: stop the server and run `npx vite --force` once.

---

## 5. Repo hygiene: fix this first

The latest commit on `master` ("hi lol") tracks `node_modules/`, `dist/`, `.DS_Store` and `.claude/`,
because `.gitignore` was deleted. `.env.example` was deleted too. Restore both and untrack the
generated folders. This only removes them from git; the local files stay.

**`.gitignore`**

```gitignore
node_modules
dist
.env
.env.local
.env.*.local
.DS_Store
.claude
*.log
```

**`.env.example`**: copy of the variables in sections 2a and 3 with empty values.

```bash
git rm -r --cached node_modules dist .claude .DS_Store
git add .gitignore .env.example
git commit -m "Stop tracking generated files; restore .gitignore and .env.example"
```

---

## 6. Acceptance check (what "working" means)

1. **Photo:** Scan Item / Upload Photo of a plastic bottle → item, Dry Waste: Blue bin, prep steps,
   quoted rule §1.1, "+10 Eco Points 🌱" (first scan of the day adds +5).
2. **Tricky item:** a paper cup or snack wrapper → Lulu asks one question with option chips → answer → result.
3. **Blurry photo:** clarification or "Try a clearer photo"; never a guess.
4. **Correction:** "That's not right" → type the real item → result tagged "Corrected by you"; History keeps both.
5. **Not in guide:** e.g. a phone charger cable → "Local disposal rule not found", no category.
6. **Lulu chat (Hinglish):** "ye aerosol can kahan daalu?" → answer from §3.2 or "not found".
7. **Leaderboard:** two devices, two nicknames → both appear live; "meri rank kya hai?" in chat shows the
   real rank; scanning the same item twice within 10 minutes gives no extra points; max 20 scored scans a day.
8. **Addresses:** `/app.html#guide`, `#leaderboard`, `#history`, `#lulu` open the right screen, and Back works.
9. **No invented numbers anywhere** on either page.

---

## 7. Before the demo

- `src/data/wasteGuide.json` is a **draft with sample wording**. Replace every `source_text` with the
  exact sentences from the official campus guide, and remove items the guide doesn't cover. Keep the same
  JSON shape (`categories[]`, `rules[]` with `rule_id`, `item_names`, `material`, `category_id`,
  `preparation`, `source_text`). The landing page's carousel (`ITEMS` in `hero/script.js`) lists ten of
  these items; keep their names and rule ids in step with the guide.
- Have 5–6 teammates scan with their own nicknames so the leaderboard has real entries. Don't add fake users.

---

## 8. Security notes

- Anything named `VITE_*` is bundled into the browser JavaScript, so the Gemini key is visible to
  anyone using the app. In Google Cloud Console → *APIs & Services* → *Credentials*, restrict the key
  to the **Generative Language API** and to your site's **HTTP referrers** (for example
  `http://localhost:5173/*` and the deployed domain).
- Firebase web config is meant to be public; the Firestore rules are what protect the data.
- Never commit `.env.local`.

---

## 9. Optional: deploy on Firebase Hosting

```bash
npm run build
npx firebase-tools deploy --only hosting
```

`firebase.json` already serves `dist/`. `/` is the landing page and `/app.html` is the app.

---

## 10. File map

| Area | Files |
| --- | --- |
| Gemini calls, prompts, JSON schemas | `src/lib/gemini.ts` |
| Guide lookup + validation | `src/lib/flow.ts`, `src/lib/guide.ts`, `src/data/wasteGuide.json` |
| Firebase setup | `src/lib/firebase.ts`, `src/lib/store.ts`, `src/lib/leaderboard.ts` |
| Points, limits, streaks | `src/lib/points.ts` |
| Screens | `src/screens/*` (Home, Scan, Guide, History, Leaderboard, Profile) |
| Lulu chat | `src/chat/LuluChat.tsx` |
| App state + screen addresses | `src/state/AppContext.tsx` |
| Landing page | `index.html`, `hero/style.css`, `hero/script.js` |
| Firestore rules / indexes | `firestore.rules`, `firestore.indexes.json`, `firebase.json` |

**Leave unchanged:** `src/components/ui/LuluMascot.tsx` (the mascot), `src/components/ui/3d-globe.tsx`
(Aceternity component), all styling, and the screen layouts.
