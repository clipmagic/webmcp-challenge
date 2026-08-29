# Testing notes

## Judge-facing live test

Open the live site in ChatGPT's in-app browser, or in Chrome 149 or later with WebMCP enabled.

Use a request such as:

> I run a small professional practice and would like help reviewing the clarity and visibility of my website. Please gather the minimum details needed and prepare the enquiry for me to review.

Expected behaviour:

1. The agent uses the public site content to determine that the request fits.
2. The Contact form becomes available.
3. Exactly one `request_website_review` capability is exposed.
4. The agent asks only for missing information supplied by the person.
5. The visible form is populated with those values.
6. The person can review and edit the fields.
7. The form is not submitted until the person clicks Submit.

For a judge test, stop after visible population unless you intentionally want to send a real enquiry to Clip Magic.

## Lifecycle checks

- Contact closed: no WebMCP capability.
- Contact opened: one capability.
- Contact closed again: capability removed and pending population cancelled.
- Contact reopened: a fresh blank form and fresh capability.
- Direct `/contact/` page: one capability while the form is present.

## Safety checks

The implementation was tested for duplicate submission, stale tool reuse, unexpected parameters, email-header injection, unsafe URL schemes, prompt-injection text, invalid required values, and token/session handling. The tool keeps the existing spam-protection field empty and never fetches the supplied website URL.

## Important interpretation

The browser or extension's tool-runner status is not by itself proof that an agent selected the tool. The decisive acceptance evidence is the live page: the capability is discovered in the intended lifecycle, the user-supplied values are visible in the form, and human submission remains required.
