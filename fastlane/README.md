# Fastlane (optional ASC metadata)

See [docs/store/README.md](../docs/store/README.md).

This tree is documentation + Deliverfile only. Install Fastlane on an ops machine / CI image when you are ready to push metadata.

```bash
gem install fastlane
# export ASC API key JSON path, then:
fastlane deliver --skip_binary_upload --skip_screenshots --force
```
