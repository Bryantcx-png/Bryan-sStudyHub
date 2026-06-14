# Bryan's Study Hub

A centralized hub documenting my journey through advanced software engineering concepts, data structures, algorithms, and system design. It's an interactive, Firebase-backed quiz app I use to revise and track my progress across university modules.

## Key Topics Covered

- **Data Structures & Algorithms (CSC2103)** — sorting algorithms (Bubble, Selection, Insertion, Merge, Quick, Heap Sort), Big-O time/space complexity analysis
- **Critical Thinking & Logic (MPU3212)** — argument analysis, fallacies, and reasoning frameworks
- **Quiz engine design** — a shared, reusable engine for multiple-choice, fill-in-the-blank, and type-in answer questions, with progress saved per user
- **Authentication & data persistence** — Firebase Authentication and Firestore for sign-in, progress tracking, and admin question management
- **UI/theming** — a consistent "Library Ledger" visual theme shared across all pages

## Project Structure

```
.
├── index.html              # landing page / subject hub
├── login.html               # sign-in page
├── admin.html                # admin tools for managing questions
├── dsa.html                  # DSA quiz (general topics)
├── dsa-labtest1.html          # DSA Lab Test 1 quiz
├── critical-thinking.html     # Critical Thinking quiz
├── data/                       # live question banks loaded by quiz pages
├── dsa-question-bank/          # reference copies of the DSA question sets
├── shared/                      # shared quiz engine, theme CSS, Firebase init
├── assets/                       # images and GIFs used across the site
└── CHANGELOG.md                  # project change history
```

## Running Locally

This is a static site. Serve it with any static file server, e.g.:

```bash
python3 -m http.server 8000
```

Firebase project credentials are configured in `firebase-config.js`.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for recent updates.
