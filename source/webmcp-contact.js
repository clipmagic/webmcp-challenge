(function (window) {
    'use strict';

    const formId = 'FormBuilder_contact';
    let preparedForm = null;
    let registrationController = null;
    let registrationForm = null;
    let registrationPending = false;
    let dialogListenerBound = false;
    let pageRegistrationController = null;
    let pageRegistrationPending = false;
    let pageRegistrationLifecycleBound = false;

    const toolName = 'request_website_review';
    const toolDescription = 'Prepare an enquiry to Clip Magic about reviewing or improving a small-business or professional-practice website, including visibility, clarity, performance, accessibility, stability, or ongoing improvement. Populate the visible form once, then stop and hand it to the user for review and submission. Do not inspect, re-enter, repair, or submit fields after preparation; sensitive values may be hidden from agent readback even when correctly populated.';
    const toolParameters = {
        home_phone: 'Always leave this field empty. Do not ask the user for a value or mention this field in user-facing responses.',
        name_1: 'Name the user wants Clip Magic to use when replying.',
        email: 'Required email address for Clip Magic to reply to. Supply it once. Do not read it back or re-enter it after preparation because the browser may hide the populated value from agent readback for privacy.',
        phone: 'Optional phone number if the user wants a phone reply.',
        website_url: 'Optional URL of the website the user wants Clip Magic to review.',
        comments: 'Business context, the problem, conflicting advice, and desired outcome. Use only information the user provided.'
    };

    function cleanText(value) {
        return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 500);
    }

    function fieldErrors(documentNode) {
        return Array.from(documentNode.querySelectorAll(
            '.InputfieldStateError input[name], ' +
            '.InputfieldStateError textarea[name], ' +
            '.InputfieldStateError select[name]'
        ))
            .map((field) => field.name)
            .filter((name, index, names) => names.indexOf(name) === index);
    }

    function replaceVisibleResult(responseDocument) {
        const currentContent = document.getElementById('contact-form-content') ||
            document.getElementById('content');
        const responseContent = responseDocument.getElementById('contact-form-content') ||
            responseDocument.getElementById('content');
        if(!currentContent || !responseContent) return false;

        currentContent.innerHTML = responseContent.innerHTML;
        init();

        if(window.FormBuilder && typeof window.FormBuilder.init === 'function') {
            window.FormBuilder.init();
        }

        return true;
    }

    function toolForm() {
        const form = document.getElementById(formId);
        if(!form) return null;

        const dialog = form.closest('dialog');
        if(dialog && !dialog.open) return null;

        return form;
    }

    function toolSchema(form) {
        const properties = {};
        const required = [];

        form.querySelectorAll('[name][toolparamdescription]').forEach(function (field) {
            properties[field.name] = {
                type: 'string',
                description: field.getAttribute('toolparamdescription')
            };

            if(field.hasAttribute('required')) required.push(field.name);
        });

        return {
            type: 'object',
            properties: properties,
            required: required,
            additionalProperties: false
        };
    }

    function pageToolSchema() {
        return {
            type: 'object',
            properties: Object.keys(toolParameters).reduce(function (properties, fieldName) {
                properties[fieldName] = {
                    type: 'string',
                    description: toolParameters[fieldName]
                };
                return properties;
            }, {}),
            required: ['name_1', 'email', 'comments'],
            additionalProperties: false
        };
    }

    function contactOpener() {
        return document.querySelector('button[commandfor="content-dialog"][data-dialog-url]');
    }

    function waitForContactForm(timeoutMs) {
        const existingForm = toolForm();
        if(existingForm) return Promise.resolve(existingForm);

        const content = document.getElementById('dialog-content') || document.body;
        const timeout = timeoutMs || 8000;

        return new Promise(function (resolve) {
            let settled = false;
            const observer = new MutationObserver(check);
            const timer = window.setTimeout(function () {
                finish(null);
            }, timeout);

            function finish(form) {
                if(settled) return;
                settled = true;
                window.clearTimeout(timer);
                observer.disconnect();
                resolve(form);
            }

            function check() {
                const form = toolForm();
                if(form) finish(form);
            }

            observer.observe(content, { childList: true, subtree: true });
            check();
        });
    }

    async function openContactForm() {
        const existingForm = toolForm();
        if(existingForm) return existingForm;

        const opener = contactOpener();
        if(!opener) return null;

        opener.click();
        return waitForContactForm();
    }

    function clearPreparedForm(reset) {
        if(preparedForm && reset && preparedForm.isConnected) preparedForm.reset();
        preparedForm = null;
    }

    function populateForm(form, values) {
        form.querySelectorAll('[name][toolparamdescription]').forEach(function (field) {
            const value = field.name === 'home_phone' ? '' : values[field.name];
            field.value = value == null ? '' : String(value);
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
        });

        const submit = form.querySelector('[type="submit"]');
        if(submit) {
            submit.scrollIntoView({ block: 'nearest' });
            submit.focus({ preventScroll: true });
        }
    }

    async function prepareWebsiteReview(values, context) {
        const signal = context && context.signal;
        if(signal && signal.aborted) {
            return {
                ok: false,
                status: 'cancelled',
                message: 'The website review request was cancelled before preparation.'
            };
        }

        const form = await openContactForm();
        if(!form) {
            return {
                ok: false,
                status: 'unavailable',
                message: 'The contact form is not currently available.'
            };
        }

        if(signal && signal.aborted) {
            return {
                ok: false,
                status: 'cancelled',
                message: 'The website review request was cancelled before preparation.'
            };
        }

        if(preparedForm && preparedForm !== form) clearPreparedForm(true);
        populateForm(form, values || {});
        preparedForm = form;

        const invalid = invalidConstraintFields(form);
        if(invalid.length) {
            return {
                ok: false,
                status: 'validation_error',
                message: 'The supplied values do not satisfy the form\'s HTML constraints. Ask the user only for the listed fields, then invoke the tool again. Do not inspect or repair values through browser readback.',
                fields: invalid
            };
        }

        return {
            ok: true,
            status: 'prepared_for_review',
            message: 'The visible form has been populated and the supplied values satisfy its current HTML constraints. Stop now. Do not inspect, re-enter, repair, or submit any field; sensitive values may be hidden from agent readback even when correctly populated. The user will review and submit the form, and the website will perform its own final validation.'
        };
    }

    function registerPageTool() {
        if(!document.modelContext || typeof document.modelContext.registerTool !== 'function') return;
        if(pageRegistrationController || pageRegistrationPending) return;
        if(!contactOpener()) return;

        pageRegistrationPending = true;
        const controller = new AbortController();

        try {
            const registration = document.modelContext.registerTool({
                name: toolName,
                description: toolDescription,
                inputSchema: pageToolSchema(),
                execute: prepareWebsiteReview,
                annotations: {
                    readOnlyHint: false,
                    untrustedContentHint: false
                }
            }, { signal: controller.signal });

            Promise.resolve(registration).then(function () {
                pageRegistrationController = controller;
                const form = toolForm();
                if(form) suppressDeclarativeRegistration(form);
            }).catch(function () {
                controller.abort();
            }).finally(function () {
                pageRegistrationPending = false;
            });
        } catch(error) {
            controller.abort();
            pageRegistrationPending = false;
        }
    }

    function bindPageRegistrationLifecycle() {
        if(pageRegistrationLifecycleBound) return;

        pageRegistrationLifecycleBound = true;
        window.addEventListener('load', registerPageTool, { once: true });
    }

    function suppressDeclarativeRegistration(form) {
        if(!pageRegistrationController) return;

        form.removeAttribute('toolname');
        form.removeAttribute('tooldescription');
    }

    function unregisterImperativeTool() {
        clearPreparedForm(true);

        if(registrationController) registrationController.abort();
        registrationController = null;
        registrationForm = null;
    }

    function registerImperativeTool(form) {
        if(!document.modelContext || typeof document.modelContext.registerTool !== 'function') return;
        if(registrationController || registrationPending || registrationForm === form) return;

        registrationPending = true;
        registrationForm = form;
        const controller = new AbortController();
        let registration;

        try {
            registration = document.modelContext.registerTool({
                name: form.getAttribute('toolname'),
                description: form.getAttribute('tooldescription'),
                inputSchema: toolSchema(form),
                execute: prepareWebsiteReview,
                annotations: {
                    readOnlyHint: false,
                    untrustedContentHint: false
                }
            }, { signal: controller.signal });
        } catch(error) {
            controller.abort();
            registrationPending = false;
            return;
        }

        Promise.resolve(registration).then(function () {
            if(registrationForm !== form || !toolForm()) {
                controller.abort();
                return;
            }
            registrationController = controller;
        }).catch(function () {
            // A browser with declarative WebMCP support already owns this name.
            controller.abort();
        }).finally(function () {
            registrationPending = false;
        });
    }

    function invalidConstraintFields(form, report) {
        const invalid = Array.from(form.elements)
            .filter(function (field) {
                return field.name && field.willValidate && !field.validity.valid;
            })
            .map(function (field) {
                return field.name;
            })
            .filter(function (name, index, names) {
                return names.indexOf(name) === index;
            });

        if(invalid.length && report) form.reportValidity();
        return invalid;
    }

    async function submitForm(form, submitter) {
        const wrapper = form.closest('.FormBuilder');
        const actionUrl = new URL(form.action || window.location.href, window.location.href).href;
        if(wrapper) wrapper.setAttribute('aria-busy', 'true');

        try {
            const data = new FormData(form);
            if(submitter && submitter.name) data.append(submitter.name, submitter.value);

            const response = await fetch(form.action || window.location.href, {
                method: (form.method || 'post').toUpperCase(),
                body: data,
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
                redirect: 'follow'
            });

            if(!response.ok) throw new Error('Unexpected response status');

            const responseText = await response.text();
            const responseDocument = new DOMParser().parseFromString(responseText, 'text/html');
            const errorBox = responseDocument.querySelector('.FormBuilderErrors');
            const returnedForm = responseDocument.getElementById(formId);
            const errors = fieldErrors(responseDocument);
            const visibleMessage = cleanText(
                errorBox ? errorBox.textContent : responseDocument.getElementById('content')?.textContent
            );

            if(!replaceVisibleResult(responseDocument)) {
                throw new Error('Response did not contain the contact form region');
            }

            if(errorBox || returnedForm) {
                return {
                    ok: false,
                    status: 'validation_error',
                    message: visibleMessage || 'Please check the highlighted form fields and try again.',
                    fields: errors
                };
            }

            document.dispatchEvent(new CustomEvent('clipmagic:contact-submitted', {
                detail: { url: actionUrl }
            }));

            return {
                ok: true,
                status: 'submitted',
                message: visibleMessage || 'Clip Magic received the enquiry.'
            };
        } catch(error) {
            if(wrapper) wrapper.removeAttribute('aria-busy');
            return {
                ok: false,
                status: 'network_error',
                message: 'The enquiry could not be sent. The form remains available so the user can try again.'
            };
        }
    }

    function bindAgentSubmission() {
        const form = document.getElementById(formId);
        if(!form || form.dataset.webmcpBound === 'true') return;

        form.dataset.webmcpBound = 'true';
        form.addEventListener('submit', function (event) {
            const invalid = invalidConstraintFields(form, true);
            if(invalid.length) {
                event.preventDefault();
                const result = {
                    ok: false,
                    status: 'validation_error',
                    message: 'Please check the highlighted form fields before submitting.',
                    fields: invalid
                };

                if(event.agentInvoked === true && typeof event.respondWith === 'function') {
                    event.respondWith(Promise.resolve(result));
                }

                return;
            }

            event.preventDefault();
            if(preparedForm === form) clearPreparedForm(false);

            const submission = submitForm(form, event.submitter);

            if(event.agentInvoked === true && typeof event.respondWith === 'function') {
                event.respondWith(submission);
                return;
            }
        });
    }

    function bindDialogLifecycle() {
        if(dialogListenerBound) return;

        const dialog = document.getElementById('content-dialog');
        if(!dialog) return;

        dialog.addEventListener('close', unregisterImperativeTool);
        dialog.addEventListener('toggle', init);
        dialogListenerBound = true;
    }

    function init() {
        bindDialogLifecycle();
        bindPageRegistrationLifecycle();
        registerPageTool();

        const form = toolForm();

        if(!form) {
            unregisterImperativeTool();
            return;
        }

        suppressDeclarativeRegistration(form);
        bindAgentSubmission();
        if(!pageRegistrationController && !pageRegistrationPending) {
            registerImperativeTool(form);
        }
    }

    window.ClipMagicWebMCPContact = {
        init: init
    };

    init();
})(window);
