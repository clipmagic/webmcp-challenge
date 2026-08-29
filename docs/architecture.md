# Architecture

## Roles

1. The person describes what they want to do to an agent of their choice.
2. The agent decides whether the public Clip Magic content and the exposed tool fit the request.
3. The browser discovers the WebMCP capability when the Contact form is available.
4. The website tool populates the existing visible form.
5. The person reviews the values and clicks Submit.
6. FormBuilder validates, filters, stores, and emails the enquiry.
7. The website returns a structured result for the agent to explain.

WebMCP defines the browser-facing tool contract. It does not define or require a particular natural-language agent.

## Declarative layer

`source/hooks-contact.php` adds `toolname`, `tooldescription`, and field-level `toolparamdescription` attributes to the rendered `contact` FormBuilder form. The tool schema is therefore derived from the existing form rather than maintained as a second independent field list.

## Compatibility bridge

`source/webmcp-contact.js` reads those rendered attributes and registers the same capability through `document.modelContext.registerTool()` for browser clients that do not discover the declarative form metadata reliably.

The bridge:

- exposes only `request_website_review`;
- accepts only declared string fields;
- populates the visible form;
- waits for the human form submission;
- handles cancellation, stale executions, validation errors, and network errors;
- does not submit automatically;
- unregisters the capability when the dynamic Contact dialog closes.

## Existing form ownership

The integration does not duplicate the submission workflow. FormBuilder remains responsible for validation, spam filtering, database storage, and email delivery. The ordinary form path remains available when WebMCP is unsupported.
