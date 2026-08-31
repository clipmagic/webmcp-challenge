# Testing notes

## Judge-facing live test

Open the live site in ChatGPT's in-app browser, or in Chrome 149 or later with WebMCP enabled.

Use fictional details and a request such as:

> Please prepare an enquiry for Clip Magic to review my small-business website at mybusiness.com, addressing our recent performance issues. Use the name Alex and email alex@example.com. Populate the form, but leave submission to me.

Expected behaviour:

1. Exactly one page-level `request_website_review` capability is available from the homepage.
2. The agent calls that capability rather than guessing the form structure.
3. Contact opens and the visible form is populated only with supplied values.
4. The tool returns `prepared_for_review` and stops.
5. The person can review and edit the visible fields.
6. The form is not submitted until the person clicks Submit.

For a judge test, stop after visible population unless you intentionally want to send a real enquiry to Clip Magic.

## Lifecycle checks

- Homepage loaded with Contact closed: one page-level capability.
- Tool invoked: Contact opens, the form is populated, and the result is `prepared_for_review`.
- Contact closed without submission: the prepared form is reset and the page-level capability remains available.
- Contact reopened manually: the ordinary form is blank and usable.
- Direct `/contact/` page: exactly one capability is available through the supported page-level, declarative, or dialog-bound path.

## Safety checks

The implementation was tested for duplicate submission, stale tool reuse, unexpected parameters, email-header injection, unsafe URL schemes, prompt-injection text, invalid required values, and token/session handling. The tool keeps the existing spam-protection field empty and never fetches the supplied website URL.

## Observed client behaviour

The in-app browser may hide a populated email value from model-facing DOM or accessibility readback while the visible control remains correctly populated. Earlier agent runs misread that privacy redaction as an empty field and attempted to repair it. The current bridge checks the actual controls with native HTML constraint validation, returns `prepared_for_review`, and explicitly tells the agent not to inspect or re-enter populated values.

WebMCP discovery was also model-dependent during testing: Sol exposed the live tool, while Luna reported that it did not support the required tool-listing command. Use a WebMCP-capable model/client when evaluating the live site.

## Important interpretation

The browser or extension's tool-runner status is not by itself proof that an agent selected the tool. The decisive acceptance evidence is the live page: the capability is discovered from the homepage, the tool returns `prepared_for_review`, the user-supplied values are visible for human review, and submission remains a separate human action.
