// The demo dataset behind /live-demo — the direct-hiring model (Platform
// Admin, companies with Admin / HR / Employee, students). Runs
// scripts/seed-hiring-demo.mjs (same flags):
//
//   node scripts/seed-demo.mjs           → create (skips if it already exists)
//   node scripts/seed-demo.mjs --reset   → remove the demo set, then recreate
//   add --yes to allow a non-local DATABASE_URL (dedicated demo DB only)
//
// Back the database up first (node scripts/backup-db.mjs before-demo).
// The older agency-flow demo is still available: scripts/seed-recq-demo.mjs.
await import('./seed-hiring-demo.mjs');
