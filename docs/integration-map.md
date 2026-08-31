# Integration map

The public package intentionally avoids publishing the complete private ProcessWire templates. These are the WebMCP-related integration points used by the live project.

| Public package | Live project file | Purpose |
| --- | --- | --- |
| `source/hooks-contact.php` | `site/templates/FormBuilder/hooks-contact.php` | Adds the declarative tool and field metadata to the existing `contact` form. |
| `source/webmcp-contact.js` | `site/templates/scripts/webmcp-contact.js` | Registers the page-level capability and fallback, opens Contact, populates the visible form, checks HTML constraints, and preserves human submission. |
| `_main.php` integration | `site/templates/_main.php` | Loads the bridge on the base page and calls its initializer after dynamic Contact content is inserted or removed. |
| Contact inline-rendering integration | `site/templates/contact.php` | Renders the Contact form in the top-level document for the homepage dialog and direct Contact page. |
| FormBuilder endpoint integration | `site/templates/form-builder.php` | Loads the bridge for the direct FormBuilder contact response path. |
| `examples/contact-form.redacted.json` | `aaa-stuff/backups/.backup-templates/forms-contact.json` | Public, redacted representation of the form fields and required settings. |

## Dynamic dialog requirement

The bridge loads with the base page. When `document.modelContext.registerTool()` is available, it registers `request_website_review` before Contact is opened. Invoking the tool clicks the existing Contact opener and waits for the asynchronously loaded inline form.

After inserting the Contact fragment, the existing dialog loader calls:

```js
if (window.ClipMagicWebMCPContact) {
    window.ClipMagicWebMCPContact.init();
}
```

It calls the initializer again after any form scripts have loaded, so the bridge can bind the final rendered form and suppress duplicate form-level registration when the page-level capability is active. Closing the dialog resets an unsubmitted prepared form and removes any dialog-bound fallback registration; the page-level capability remains available for the page lifetime.

## Form requirement

The rendered form must expose the `toolparamdescription` attributes added by the PHP hook. They identify the controls the bridge may populate and support the declarative and dialog-bound fallbacks. The page-level schema must remain aligned with the same fields and required state. The public form fixture documents that contract, but does not replace FormBuilder or provide its module source.
