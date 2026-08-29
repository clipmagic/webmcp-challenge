# Public file manifest

This manifest is for review before copying the package into the public GitHub repository.

## Intended public files

```text
README.md
LICENSE
NOTICE.md
source/hooks-contact.php
source/webmcp-contact.js
examples/contact-form.redacted.json
docs/architecture.md
docs/challenge-timeline.md
docs/integration-map.md
docs/testing.md
docs/public-file-manifest.md
```

## Deliberately excluded

```text
site/config.php
site/modules/FormBuilder/
site/modules/ProCache/
site/assets/files/
site/assets/backups/
site/assets/logs/
site/assets/sessions/
databases and database exports
credentials and API keys
private Clip Magic templates and content
private project summaries and deployment handoffs
```

The public source files are copied from the DDEV implementation only after checking their contents against the current source. The complete CM repository remains private.
