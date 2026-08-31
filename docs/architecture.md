# Architecture

## Roles

1. The person describes what they want to do to an agent of their choice.
2. The agent decides whether the public Clip Magic content and the exposed tool fit the request.
3. The browser discovers one page-level WebMCP capability from the homepage.
4. When invoked, the website tool opens Contact and populates the existing visible form.
5. The tool checks the supplied values against the form's native HTML constraints, returns `prepared_for_review`, and stops.
6. The person reviews the values and decides whether to click Submit.
7. FormBuilder performs its own final validation, spam filtering, storage, and email delivery.

WebMCP defines the browser-facing tool contract. It does not define or require a particular natural-language agent.

## Declarative layer

`source/hooks-contact.php` adds `toolname`, `tooldescription`, and field-level `toolparamdescription` attributes to the rendered `contact` FormBuilder form. This remains the declarative WebMCP contract and fallback for clients that support it.

## Compatibility bridge

`source/webmcp-contact.js` registers the same capability from the base page through `document.modelContext.registerTool()` for browser clients that do not discover the dynamically loaded declarative form reliably. Because Contact is not yet rendered at page load, the page-level schema explicitly mirrors the same six annotated form fields.

The bridge:

- exposes only `request_website_review`;
- accepts only declared string fields;
- is discoverable before the Contact dialog is opened;
- opens Contact when invoked;
- populates the visible form;
- checks the actual controls with native HTML constraint validation;
- returns `prepared_for_review` immediately after successful preparation;
- tells the agent not to inspect, re-enter, repair, or submit populated fields;
- returns only invalid field names when supplied values fail the HTML constraints;
- does not submit automatically;
- keeps the page-level capability available while the page remains open;
- resets an unsubmitted prepared form when the Contact dialog closes.

If page-level imperative registration is unavailable, the rendered declarative metadata remains available. A dialog-bound imperative fallback can also derive its schema from those rendered attributes. When page-level registration succeeds, only the duplicate form-level tool markers are suppressed; field annotations remain available for population.

## Existing form ownership

The integration does not duplicate the business workflow. The WebMCP call prepares the form and ends before submission. FormBuilder remains responsible for final validation, spam filtering, database storage, and email delivery. The ordinary form path remains available when WebMCP is unsupported.
