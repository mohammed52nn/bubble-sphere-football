# Get the app working again

## What's wrong (confirmed)
The home page shows «تعذّر جمع البيانات من المصدر». The AI service that picks the players answers "Not enough credits" (402). The app code works. The AI balance is empty, so finding players fails and no bubbles appear.

## Fix
1. **Top up AI credits** (you need to do this): Settings → Cloud & AI balance. This alone brings the bubbles back.
2. **Keep the app working when AI is down** (small change):
   - If the AI fails, the home page shows bubbles from the fixed player list already used on /players instead of an error.
   - Search falls back to matching names in that list.
   - Player profiles still open from Wikipedia data and news. Only the AI summary is skipped.
   - No made-up data. Existing design and features stay the same.
3. Check it in a phone-size test browser: bubbles appear, a profile opens, and search works with and without AI.

## Technical details
- In the discovery server function, catch `AiUnavailableError` (402/429) and return seeds built from `src/lib/football/roster.ts`, filtered by the query.
- Profile path: on the same error, return the Wikipedia-based profile without the AI fields instead of throwing.
- The existing model setting stays as it is.
