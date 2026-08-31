# Clip Magic WebMCP Challenge

This repository contains the WebMCP integration layer demonstrated on the live Clip Magic website for the OpenAI WebMCP Challenge.

Live demonstration: https://clipmagic.com.au/

## What this demonstrates

Clip Magic exposes one bounded capability to a user's browser agent:

```text
request_website_review
```

The capability lets an agent prepare an enquiry about reviewing or improving a small-business or professional-practice website. The agent gathers only information supplied by the user, opens the existing Contact form, and populates the visible fields.

After population, the tool returns `prepared_for_review` and stops. The person remains in control of the consequential step: they review the visible form and click Submit themselves. The tool does not auto-submit the enquiry.

This is a progressively enhanced website experience, not a site-owned chatbot or an authenticated agent service.

## Underlying platform

Clip Magic is built on [ProcessWire](https://processwire.com/), an open-source CMS and framework with a powerful API. The live site uses [FormBuilder](https://processwire.com/store/form-builder/), a commercial ProcessWire module, for its existing contact workflow. The [ProcessWire source repository](https://github.com/processwire/processwire) is available separately.

This public challenge package contains only the authored WebMCP integration. It does not include or redistribute ProcessWire, FormBuilder, licensed third-party modules, or the complete private Clip Magic website.

## Why WebMCP fits this use case

On the live site, WebMCP is a small browser-facing layer added to an existing ProcessWire site and its FormBuilder contact workflow. An ordinary website visitor can already complete the Contact form. WebMCP adds a reliable contract so a user-controlled agent can help translate a natural-language request into the existing form without guessing field names, page structure, or submission behaviour.

The website continues to own the form workflow. FormBuilder remains responsible for validation, spam filtering, storage, and email delivery. WebMCP adds the agent-facing layer and preserves the existing human path when WebMCP is unavailable.

## Public package scope

The public repository is a curated challenge package. It is not a copy of the private Clip Magic website, and it is not a standalone ProcessWire distribution.

Included:

- the authored WebMCP hook and compatibility bridge;
- integration notes for the dynamic Contact dialog and direct Contact page;
- a redacted representation of the Contact form configuration;
- testing notes and a dated challenge timeline.

Not included:

- the private Clip Magic site repository;
- customer, enquiry, database, backup, or server data;
- ProcessWire core;
- commercial FormBuilder, ProCache, or other third-party modules;
- credentials, API keys, private configuration, or deployment secrets;
- Clip Magic brand assets unless separately authorised.

See [NOTICE.md](NOTICE.md) and [docs/public-file-manifest.md](docs/public-file-manifest.md) for the licensing and release boundary.

## Source files

- [`source/hooks-contact.php`](source/hooks-contact.php) adds the declarative WebMCP metadata to the existing FormBuilder contact form.
- [`source/webmcp-contact.js`](source/webmcp-contact.js) registers the page-level imperative capability and declarative compatibility fallback, opens and populates the visible form, checks native HTML constraints, and returns control to the person before submission.
- [`examples/contact-form.redacted.json`](examples/contact-form.redacted.json) records the relevant public form schema without live recipient or internal configuration values.
- [`docs/integration-map.md`](docs/integration-map.md) describes the small integration points in the private ProcessWire templates without publishing the complete site templates.

## Prerequisites for reproducing the integration

The live demonstration uses:

1. A ProcessWire website.
2. A licensed FormBuilder installation with a `contact` form.
3. The fields shown in the redacted form fixture: `name_1`, `email`, `phone`, `website_url`, and `comments`, plus the existing optional spam-protection field.
4. A page/template integration with a Contact opener and an inline Contact form in the top-level document.
5. A browser client with WebMCP support, such as ChatGPT's in-app browser or Chrome with WebMCP enabled.

The judges do not need to install this package to evaluate the entry. They can use the live URL, the demonstration video, this source, and the testing notes.

## About the rules' code example

The rules show a generic `search_products` tool registration as an example of the WebMCP shape. They do not require every project to implement product search or to use that tool name.

Clip Magic deliberately exposes one focused capability: `request_website_review`. Adding an unrelated search tool would not improve the demonstrated contact-enquiry workflow, and would make the public package less clear rather than more complete.

## Safety boundaries

- The agent must not invent missing user information.
- The bridge does not fetch a supplied website URL.
- The website URL is stored as form text only.
- The visible form remains available to ordinary human visitors.
- Final submission remains an explicit human action.
- No CMS, customer records, or administrative actions are exposed as WebMCP tools.

## Licence

The original files intentionally released in this repository are available under the MIT License. See [LICENSE](LICENSE).

The licence does not apply to excluded dependencies, third-party code, trademarks, or any material copied from the private Clip Magic site unless that material is explicitly identified as being released under MIT.
