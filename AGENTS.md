<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Profile club verification bypasses result and headline cache reads on opening while sharing concurrent requests; keep existing profile data and manual overrides visible so freshness never blocks rendering.
- The /players hall lists a fixed name-only roster plus players seen in this device's bubbles (localStorage `fb:seen-players`); clubs are never stored, only verified live — because there is no shared database.
- Stable player facts for well-known players live in a built-in pack (`player-pack.ts`) and skip the AI profile call; current club is still read live and verified — keeps profiles complete without AI credits.
- Discovery and profiles use fetch-only open-data services, with no AI call in their critical path; this prevents credit exhaustion from interrupting the app.
- Completed-transfer extraction is conservative and requires independent outlets plus recent lineup proof for automatic club changes; headlines alone must not turn speculation into facts.
- Refresh mutations write the returned profile directly to the shared query cache; this avoids a second request and makes fresh fields immediately visible.
