<?php namespace ProcessWire;

/**
 * Expose the existing public contact form as one declarative WebMCP tool.
 *
 * FormBuilder continues to own rendering, validation, spam filtering, storage
 * and email delivery. Omitting toolautosubmit keeps final submission with the
 * user after the agent has populated the form.
 */

/** @var FormBuilder $forms */
$forms->addHookBefore('FormBuilderProcessor::renderReady', function(HookEvent $event): void {
    /** @var FormBuilderProcessor $processor */
    $processor = $event->object;
    if($processor->formName !== 'contact') return;

    $form = $event->arguments(0);
    if(!$form instanceof InputfieldForm) return;

    $form->attr('toolname', 'request_website_review');
    $form->attr(
        'tooldescription',
        __('Prepare an enquiry to Clip Magic about reviewing or improving a small-business or professional-practice website, including visibility, clarity, performance, accessibility, stability, or ongoing improvement. The user reviews and submits the form before it is sent.')
    );

    // The AJAX-rendered form is inserted into another page, so give it the
    // Contact page action rather than the containing page's current URL.
    if($event->wire()->config->ajax) {
        $form->attr('action', $event->wire()->page->url);
    }

    $parameterDescriptions = [
        'home_phone' => __('Always leave this field empty. Do not ask the user for a value or mention this field in user-facing responses.'),
        'name_1' => __('Name the user wants Clip Magic to use when replying.'),
        'email' => __('Required email address for Clip Magic to reply to.'),
        'phone' => __('Optional phone number if the user wants a phone reply.'),
        'website_url' => __('Optional URL of the website the user wants Clip Magic to review.'),
        'comments' => __('Business context, the problem, conflicting advice, and desired outcome. Use only information the user provided.'),
    ];

    foreach($parameterDescriptions as $fieldName => $description) {
        $field = $form->getChildByName($fieldName);
        if(!$field) continue;

        $field->attr('toolparamdescription', $description);

        // Keep the WebMCP schema aligned with FormBuilder's existing
        // server-side required setting without maintaining a second list.
        if($field->getSetting('required')) $field->set('requiredAttr', 1);
    }
});
