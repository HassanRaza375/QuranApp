Historical: the Phase 7A handoff for a second machine, kept for reference (the phases have moved on; see docs/PROGRESS.md). Paths updated for the standalone repo.

Run these on the other machine (PowerShell or Git Bash). You need Node 22 or newer, because Node 20 breaks eslint.


# 1. Get the code
git clone https://github.com/HassanRaza375/QuranApp.git   # skip if you already have it
cd QuranApp
git fetch origin
git checkout main
git pull

# 2. Install and build the revamp
node -v                      # must be v22.21 or newer
npm install
npx playwright install chromium
npm run build
Then start Claude Code in the repo root (QuranApp) and paste this prompt:


Continue Phase 7A. Read CLAUDE.md, docs/PROGRESS.md and
docs/phases/phase-07a-people.md (see "Handoff" at the end). Remaining:
1. Run: node scripts/screenshots/phase-07a-people.mjs   (production build already built)
2. Look at the images in docs/design/people-compare/ (the 12 pairs and the states) and say which I only generated.
3. Write docs/design/people-compare/README.md in the format of docs/design/library-compare/README.md.
4. Mark row 7A in docs/PROGRESS.md as done, awaiting review.
5. Run: npm run verify, commit as revamp(people): ..., push, then stop.
Do not edit app/data/quranPersons.ts; my decision on the three relationship entries is: <a / b / c>.
Replace <a / b / c> with your choice on the relationship entries (see the last message).

If you only want to check the app first, run npm run dev and open http://localhost:3001/persons (the port may differ; the terminal prints it).