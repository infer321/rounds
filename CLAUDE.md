# Rounds — notes for Claude Code

Clinical workflow app for med students/residents. React Native 0.81 + Expo SDK 54, EAS builds, iOS-first. No backend.

## Hard rules
- **HIPAA by structure**: patients = initials + age + sex + descriptor only. Never add name/MRN/DOB/room fields. No network calls with patient data. No analytics.
- All patient data goes through `PatientsContext` → debounced, AES-encrypted AsyncStorage write. Don't write patient data anywhere else.
- Colors/sizes come from `theme.ts` (C, T, S, R). No raw hex in components. Icons from `components/Icon.tsx`, no unicode glyphs.
- Destructive single-item actions use toast + Undo (`useToast`), not confirm dialogs. Mass deletes (new shift) use a confirm.
- Haptics via `utils/haptics.ts`.

## Map
- `context/SettingsContext` — settings + timer presets (shared store)
- `context/PatientsContext` — patients, items, notifications, `patchHP` (functional), `advancePanel` / `completeRound`
- `utils/clinical.ts` — ranges, labels, panels, H/L flags (single source of truth)
- `utils/noteExport.ts` — plain-text H&P / SOAP / signout for Teams → Cerner paste
- `utils/rounds.ts` — snapshot/advance logic (pure, tested)
- `components/NoteEditor.tsx` — H&P and SOAP tabs (one component, `mode` prop)
- `components/TimersTab.tsx` — owns the 1s clock; keep `useNow` out of note screens
- `components/FindingsBuilder.tsx` — exam + ROS builders

## Checks before shipping
`npx tsc --noEmit` and `npx expo export --platform ios --output-dir /tmp/exp`
