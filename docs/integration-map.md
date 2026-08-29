# Integration map

The public package intentionally avoids publishing the complete private ProcessWire templates. These are the WebMCP-related integration points used by the live project.

| Public package | Live project file | Purpose |
| --- | --- | --- |
| `source/hooks-contact.php` | `site/templates/FormBuilder/hooks-contact.php` | Adds the declarative tool and field metadata to the existing `contact` form. |
| `source/webmcp-contact.js` | `site/templates/scripts/webmcp-contact.js` | Registers the compatibility bridge and handles visible population and human submission. |
| `_main.php` integration | `site/templates/_main.php` | Loads the bridge on the base page and calls its initializer after dynamic Contact content is inserted or removed. |
| Contact inline-rendering integration | `site/templates/contact.php` | Renders the Contact form in the top-level document for the homepage dialog and direct Contact page. |
| FormBuilder endpoint integration | `site/templates/form-builder.php` | Loads the bridge for the direct FormBuilder contact response path. |
| `examples/contact-form.redacted.json` | `aaa-stuff/backups/.backup-templates/forms-contact.json` | Public, redacted representation of the form fields and required settings. |

## Dynamic dialog requirement

The homepage Contact dialog loads HTML asynchronously. After inserting the Contact fragment, the existing dialog loader calls:

```js
if (window.ClipMagicWebMCPContact) {
    window.ClipMagicWebMCPContact.init();
}
```

It calls the initializer again after any form scripts have loaded, so the bridge can see the final rendered form. Closing the dialog triggers the bridge cleanup, which removes the tool and cancels any pending execution.

## Form requirement

The rendered form must expose the `toolparamdescription` attributes added by the PHP hook. The public form fixture documents the field names and required state, but does not replace FormBuilder or provide its module source.
