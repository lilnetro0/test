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

## Arabic-first product direction

Nexus targets **Arabic-speaking gamers in Saudi Arabia and the wider MENA region**.
Arabic is the primary product language (English supported). Do **not** treat Arabic as a secondary translation layer after English UX is finished.

Standing docs (required reading for user-facing work):

- [`docs/ARABIC-PRODUCT-GUIDELINES.md`](docs/ARABIC-PRODUCT-GUIDELINES.md)
- [`docs/ARABIC-TERMINOLOGY.md`](docs/ARABIC-TERMINOLOGY.md)
- [`docs/RTL-TEST-CHECKLIST.md`](docs/RTL-TEST-CHECKLIST.md)
- [`docs/MENA-MODERATION-GUIDE.md`](docs/MENA-MODERATION-GUIDE.md)
- [`docs/I18N-RTL.md`](docs/I18N-RTL.md)

**Do not start large redesigns by default.** Audit → incremental tested changes. Every future phase completion report must include an **Arabic-first impact** section (UI, RTL tests, bidi, search, moderation, unresolved).
