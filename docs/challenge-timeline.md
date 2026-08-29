# Challenge timeline

Clip Magic existed before the challenge. The WebMCP capability and the supporting workflow were added and tested during the submission period.

The following dates are taken from the private canonical repository's dated commit history. The public repository is a curated release and is not a mirror of that private repository.

## Pre-existing

- Before 25 August 2026: the Clip Magic ProcessWire website and ordinary Contact workflow existed.

## WebMCP work during the submission period

- 27 August 2026: aligned required-field handling and rendered Contact inline for WebMCP discovery in the top-level document.
- 28 August 2026: preserved the confirmed submission state and recorded the functional, failure, and security regression matrix.
- 29 August 2026: completed live acceptance testing with ChatGPT's in-app browser and Chrome's WebMCP client, and prepared the challenge handoff.

The relevant private source commits include:

```text
e43141c 2026-08-27 Guard WebMCP submissions against whitespace-only required fields
5a78a4f 2026-08-27 Render Contact forms inline for WebMCP submissions
9d14c12 2026-08-28 Preserve WebMCP submission success state
54f3e70 2026-08-28 Record WebMCP security regressions
738cb91 2026-08-29 Update WebMCP test handoff
```

These entries distinguish the pre-existing site from the WebMCP work added during the challenge period without publishing the private site's unrelated history.
