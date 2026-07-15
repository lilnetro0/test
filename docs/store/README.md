# ASC metadata for Fastlane deliver (optional)

Thin packaging for App Store Connect metadata. Secrets stay in Codemagic / local env — never commit `.p8` or API keys.

## Layout

```
docs/store/
  REVIEW-NOTES.txt          # paste into App Review Notes
  en-US/listing.txt         # human-readable listing fields
  screenshots/README.md     # capture sizes + shot list
fastlane/
  Deliverfile               # points metadata_path here when you run deliver
  README.md
```

## Deliver (ops machine)

```bash
# once: gem install fastlane
# Auth: ASC API key via FASTLANE_API_KEY_PATH or App Store Connect API in CI
cd fastlane
fastlane deliver --skip_binary_upload --skip_screenshots --force
```

Replace `YOUR_ORIGIN` in listing URLs before upload. Screenshots remain manual (see `docs/store/screenshots/README.md`).
