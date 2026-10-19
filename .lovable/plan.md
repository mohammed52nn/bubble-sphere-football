# Hidden Bubble Management (VAR)

## Current state
- Player profiles are built on the fly from Wikipedia, news and AI, with a temporary in-memory server cache. No shared, permanent data store exists yet.
- The only existing club correction is manual and saved on the user's own device.
- So "save for all users" needs Lovable Cloud (the built-in database). It will be enabled with no extra accounts.

## What the user will experience
1. Type `خاصية التعديل` in the existing search box. No search runs. A VAR bubble shows up in the existing bubble field.
2. Press and hold it for 7 seconds (a thin ring fills up), then tap it 3 times quickly (within about 1.5 seconds). If the hold or taps are wrong, the sequence resets with no message.
3. A small glass panel asks for the admin password. The password is checked on the server. A correct password unlocks editing for a limited time (8 hours) in an encrypted, server-only session.
4. While unlocked, an existing player's profile shows one small "تعديل" button. It lets you edit:
   - Club, image link, position, details (bio)
   - Transfer updates. All four are required: transfer date, previous club, new club, description.
5. You see a "معاينة" preview of the changes before anything is saved. Pressing "اعتماد وحفظ" stores the changes for everyone, and each save is recorded in the audit log.
6. Every visitor's profile shows the saved edits on top of the automatic data. Edits override the automatic club and the club verification, and appear before the device-only manual correction. Approved transfers are added to the top of the career list.

There is no public login, no post management and no other admin tools.

## One setup step for you
When asked, enter your chosen admin password in the secure `ADMIN_PASSWORD` form. I'll generate the session-encryption key myself.

## Technical details
- Enable Lovable Cloud. One migration creates:
  - `player_overrides` (latin_name_key PK, club, image, position, bio, transfers jsonb, updated_at). Public SELECT for anon/authenticated. No client writes.
  - `player_override_audit` (id, latin_name_key, changes jsonb, before jsonb, created_at, ip_hash). No client access at all.
- `src/lib/admin.functions.ts`:
  - `unlockAdmin`: compares with a timing-safe SHA-256 check against `process.env.ADMIN_PASSWORD`, then sets a `useSession` cookie (httpOnly, secure, sameSite lax, 8h). Simple in-memory attempt throttling.
  - `adminStatus` and `lockAdmin`.
  - `saveOverride`: Zod validation (lengths, https image URL, ISO date, all transfer fields required). Checks the session, then uses the admin client loaded inside the handler to upsert the override and insert the audit row.
- `getPlayerOverride` (public read through the publishable client) is merged inside the existing `PlayerProfileOverlay` display logic only. `profileFor` and the verification layer are unchanged.
- `ResearchBox`/`index.tsx`: an exact-phrase check stops discovery and adds the VAR bubble. `VarBubble.tsx` handles the hold timer and tap counting with pointer events, keeping the current look.
- `AdminEditPanel.tsx`: form, then preview, then save, with errors shown in Arabic.
- Tests: bun tests for the password check, the required transfer fields, and the secret-gesture timing logic.
- End-to-end Playwright test: phrase, hold 7s, 3 taps, password, edit, preview, save. Then a new browser opens the profile and sees the change, and the audit row is checked.
- AGENTS.md rule: admin writes only go through session-gated server functions.
