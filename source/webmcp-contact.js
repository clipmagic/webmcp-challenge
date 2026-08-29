(function (window) {
    'use strict';

    const formId = 'FormBuilder_contact';
    let activeExecution = null;
    let registrationController = null;
    let registrationForm = null;
    let registrationPending = false;
    let dialogListenerBound = false;

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

    function finishExecution(result) {
        if(!activeExecution) return;

        const execution = activeExecution;
        activeExecution = null;

        if(execution.signal && execution.abortHandler) {
            execution.signal.removeEventListener('abort', execution.abortHandler);
        }

        execution.resolve(result);
    }

    function cancelExecution(message) {
        if(activeExecution && !activeExecution.submitting) {
            activeExecution.form.reset();
        }

        finishExecution({
            ok: false,
            status: 'cancelled',
            message: message || 'The website review request was cancelled before submission.'
        });
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

    function prepareWebsiteReview(values, context) {
        const form = toolForm();
        if(!form) {
            return {
                ok: false,
                status: 'unavailable',
                message: 'The contact form is not currently available.'
            };
        }

        if(activeExecution) {
            return {
                ok: false,
                status: 'busy',
                message: 'Another website review request is already awaiting review.'
            };
        }

        populateForm(form, values || {});

        return new Promise(function (resolve) {
            const signal = context && context.signal;
            const abortHandler = function () {
                cancelExecution('The website review request was cancelled before submission.');
            };

            activeExecution = {
                form: form,
                resolve: resolve,
                signal: signal,
                abortHandler: abortHandler,
                submitting: false
            };

            if(signal) {
                if(signal.aborted) {
                    abortHandler();
                    return;
                }
                signal.addEventListener('abort', abortHandler, { once: true });
            }
        });
    }

    function unregisterImperativeTool() {
        if(activeExecution && !activeExecution.submitting) cancelExecution();
        if(activeExecution) return;

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

    function missingRequiredFields(form) {
        const missing = [];

        form.querySelectorAll('[required]').forEach(function (field) {
            if(typeof field.value !== 'string' || field.value.trim()) return;
            field.value = '';
            if(field.name) missing.push(field.name);
        });

        if(missing.length) form.reportValidity();
        return missing;
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
            const missing = missingRequiredFields(form);
            if(missing.length) {
                event.preventDefault();
                const result = {
                    ok: false,
                    status: 'validation_error',
                    message: 'Please complete the required fields before submitting.',
                    fields: missing
                };

                if(event.agentInvoked === true && typeof event.respondWith === 'function') {
                    event.respondWith(Promise.resolve(result));
                }

                if(activeExecution && activeExecution.form === form) finishExecution(result);
                return;
            }

            event.preventDefault();

            const submission = submitForm(form, event.submitter);

            if(event.agentInvoked === true && typeof event.respondWith === 'function') {
                event.respondWith(submission);
                return;
            }

            if(activeExecution && activeExecution.form === form) {
                activeExecution.submitting = true;
                submission.then(function (result) {
                    finishExecution(result);
                    init();
                });
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
        const form = toolForm();

        bindDialogLifecycle();

        if(!form) {
            unregisterImperativeTool();
            return;
        }

        bindAgentSubmission();
        registerImperativeTool(form);
    }

    window.ClipMagicWebMCPContact = {
        init: init
    };

    init();
})(window);
