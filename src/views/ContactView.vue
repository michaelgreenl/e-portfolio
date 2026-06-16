<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { useRouteStore } from '@/stores/routeStore.js';
import { useUtilAnimations } from '@/composables/useUtilAnimations.js';
import emailjs from '@emailjs/browser';
import Button from '@/components/Button.vue';
import MailIcon from '@/components/SVGs/MailIcon.vue';
import GithubFillIcon from '@/components/SVGs/GithubFillIcon.vue';
import LinkedInIcon from '@/components/SVGs/LinkedInIcon.vue';

const SERVICE_ID = import.meta.env.VITE_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_PUBLIC_KEY;

const routeStore = useRouteStore();

const { headerReveal, headerDismiss } = useUtilAnimations();

const pageHeader = ref(null);

const formElement = ref(null);
const form = reactive({ email: '', subject: '', message: '' });
const errors = reactive({ email: '', subject: '', message: '' });
const touched = reactive({ email: false, subject: false, message: false });

const isSubmitting = ref(false);
const submitStatus = ref(''); // 'success', 'error', or ''

onMounted(() => {
    headerReveal({
        headerEl: pageHeader.value,
        extraTargets: ['.form-label, .form-input, .form-textarea, .contact-link'],
    });
});

watch(
    () => routeStore.isLeaving,
    (newVal) => {
        if (newVal) {
            headerDismiss({
                headerEl: pageHeader.value,
                extraTargets: ['.form-label, .form-input, .form-textarea, .contact-link'],
            });
        }
    },
);

const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validateField = (fieldName) => {
    if (!touched[fieldName]) return;

    const value = form[fieldName];
    let errorMessage = '';

    switch (fieldName) {
        case 'email':
            if (!value) {
                errorMessage = 'Email is required';
            } else if (!validateEmail(value)) {
                errorMessage = 'Please enter a valid email address';
            }
            break;
        case 'subject':
            if (!value.trim()) {
                errorMessage = 'Subject is required';
            } else if (value.trim().length < 3) {
                errorMessage = 'Subject must be at least 3 characters long';
            }
            break;
        case 'message':
            if (!value.trim()) {
                errorMessage = 'Message is required';
            } else if (value.trim().length < 10) {
                errorMessage = 'Message must be at least 10 characters long';
            }
            break;
    }

    errors[fieldName] = errorMessage;
};

const handleFieldInput = (fieldName) => {
    touched[fieldName] = true;
};

const handleFieldBlur = (fieldName) => {
    validateField(fieldName);
};

const handleFieldFocus = (fieldName) => {
    errors[fieldName] = '';
};

const validateForm = () => {
    let isValid = true;

    errors.email = '';
    errors.subject = '';
    errors.message = '';

    if (!form.email) {
        errors.email = 'Email is required';
        isValid = false;
    } else if (!validateEmail(form.email)) {
        errors.email = 'Please enter a valid email address';
        isValid = false;
    }

    if (!form.subject.trim()) {
        errors.subject = 'Subject is required';
        isValid = false;
    } else if (form.subject.trim().length < 3) {
        errors.subject = 'Subject must be at least 3 characters long';
        isValid = false;
    }

    if (!form.message.trim()) {
        errors.message = 'Message is required';
        isValid = false;
    } else if (form.message.trim().length < 10) {
        errors.message = 'Message must be at least 10 characters long';
        isValid = false;
    }

    return isValid;
};

const handleSubmit = async () => {
    if (!validateForm()) {
        return;
    }

    isSubmitting.value = true;
    submitStatus.value = '';

    emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, formElement.value, PUBLIC_KEY).then(
        (res) => {
            if (res.text === 'OK') {
                submitStatus.value = 'success';
                isSubmitting.value = false;

                form.email = '';
                form.subject = '';
                form.message = '';
                touched.email = false;
                touched.subject = false;
                touched.message = false;
            }
        },
        (error) => {
            console.error(error);
            submitStatus.value = 'error';
            isSubmitting.value = false;
        },
    );
};

const clearStatus = () => {
    setTimeout(() => {
        submitStatus.value = '';
    }, 5000);
};
</script>

<template>
    <div ref="pageElement" class="contact-container">
        <div ref="pageHeader" class="contact-header">
            <h1 class="contact-title">Get In Touch!</h1>
            <hr class="contact-rule" />
            <p class="contact-copy">
                It'd be great to hear from you. Send me a message and I'll respond as soon as I can!
            </p>
        </div>

        <form ref="formElement" @submit.prevent="handleSubmit" class="contact-form">
            <div class="form-group">
                <label for="email" class="form-label">Email Address</label>
                <input
                    id="email"
                    v-model="form.email"
                    type="email"
                    class="form-input"
                    :class="{ error: errors.email }"
                    placeholder="your.email@example.com"
                    required
                    @input="handleFieldInput('email')"
                    @blur="handleFieldBlur('email')"
                    @focus="handleFieldFocus('email')"
                />
                <span class="error-message" aria-live="polite">{{ errors.email }}</span>
            </div>

            <div class="form-group">
                <label for="subject" class="form-label">Subject</label>
                <input
                    id="subject"
                    v-model="form.subject"
                    type="text"
                    class="form-input"
                    :class="{ error: errors.subject }"
                    placeholder="What's this about?"
                    required
                    @input="handleFieldInput('subject')"
                    @blur="handleFieldBlur('subject')"
                    @focus="handleFieldFocus('subject')"
                />
                <span class="error-message" aria-live="polite">{{ errors.subject }}</span>
            </div>

            <div class="form-group form-group-message">
                <label for="message" class="form-label">Message</label>
                <textarea
                    id="message"
                    v-model="form.message"
                    class="form-textarea"
                    :class="{ error: errors.message }"
                    placeholder="What's up?"
                    rows="6"
                    required
                    @input="handleFieldInput('message')"
                    @blur="handleFieldBlur('message')"
                    @focus="handleFieldFocus('message')"
                ></textarea>
                <span class="error-message" aria-live="polite">{{ errors.message }}</span>
            </div>

            <div class="form-actions">
                <div class="contact-links">
                    <a href="https://github.com/michaelgreenl" target="_blank" rel="noopener noreferrer">
                        <Button class="contact-link" :iconLeft="GithubFillIcon" preset="secondary" />
                    </a>
                    <a href="https://www.linkedin.com/in/michaelgreen5/" target="_blank" rel="noopener noreferrer">
                        <Button class="contact-link" :iconLeft="LinkedInIcon" preset="secondary" />
                    </a>
                </div>

                <Button
                    type="submit"
                    class="contact-link"
                    preset="primary"
                    :text="isSubmitting ? 'Sending...' : 'Send'"
                    :disabled="isSubmitting"
                    :styles="{
                        opacity: isSubmitting ? 0.7 : 1,
                        pointerEvents: isSubmitting ? 'none' : 'auto',
                    }"
                    :iconRight="MailIcon"
                />
            </div>
        </form>

        <div v-if="submitStatus === 'success'" class="status-message success" @click="clearStatus">
            <p>✓ Message sent successfully! I'll get back to you soon.</p>
        </div>

        <div v-if="submitStatus === 'error'" class="status-message error" @click="clearStatus">
            <p>✗ There was an error sending your message. Please try again.</p>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.contact-container {
    position: relative;
    display: grid;
    flex-grow: 1;
    grid-template-rows: auto minmax(0, auto);
    gap: $size-3;
    align-content: center;
    justify-items: center;
    width: 100%;
    min-height: 0;
    max-height: 100%;
    padding: $size-2 $size-4 $size-1;
    margin: 0 auto;
    overflow: hidden;
    font-size: 0.9em;

    @include bp-xsm-phone {
        font-size: 0.95em;
    }

    @include bp-sm-phone {
        gap: $size-4;
        padding: $size-4;
        font-size: 1em;
    }
}

.contact-header {
    width: min(100%, 34em);
    margin: 0;
    text-align: center;

    @include bp-md-tablet {
        width: min(100%, 42em);
    }
}

.contact-title,
.contact-copy {
    margin: 0;
}

.contact-title {
    font-size: 2.1em;
    line-height: 1;

    @include bp-sm-phone {
        font-size: 2.65em;
    }
}

.contact-rule {
    width: 100%;
    height: 1px;
    margin: $size-1 auto;
    border: 0;

    @include theme-dark {
        background-color: $color-gray6;
    }

    @include theme-light {
        background-color: $color-primary-darker;
    }
}

.contact-copy {
    max-width: 42ch;
    margin: 0 auto;
    font-size: 0.92em;
    line-height: 1.35;
    color: $color-text-secondary;

    @include bp-sm-phone {
        font-size: 1em;
        line-height: 1.45;
    }
}

.contact-form {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: $size-1;
    width: 100%;
    max-width: 36em;
    min-height: 0;

    @include bp-md-tablet {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: $size-3 $size-4;
        max-width: 46em;
    }

    @include bp-lg-laptop {
        max-width: 50em;
    }
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: $size-1;
    min-width: 0;
}

.form-group-message,
.form-actions {
    @include bp-md-tablet {
        grid-column: 1 / -1;
    }
}

.form-label {
    font-family: $primary-font-stack;
    font-size: 0.88em;
    font-weight: 500;
    line-height: 1.15;

    @include theme-dark {
        color: $color-text-primary;
    }

    @include theme-light {
        color: $color-primary-darker;
    }
}

.form-input,
.form-textarea {
    width: 100%;
    padding: 0.45em $size-3;
    font-family: $secondary-font-stack;
    font-size: 0.95em;
    line-height: 1.2;
    resize: none;
    background-color: transparent;
    border: 2px solid transparent;
    border-radius: 8px;

    @include theme-dark {
        color: $color-text-primary;
        background-color: rgba($color-gray8, 0.3);
        border-color: $color-gray6;

        &::placeholder {
            color: $color-gray6;
        }

        &:focus {
            background: linear-gradient(90deg, #21252922, #21252900);
            border-color: $color-primary;
            outline: none;
            box-shadow: 0 0 0 3px rgba($color-primary, 0.1);
            backdrop-filter: blur(4px);
        }
    }

    @include theme-light {
        color: $color-primary-darker;
        background-color: rgba($color-white, 0.7);
        border-color: $color-gray5;

        &::placeholder {
            color: darken-color($color-gray5, 10%);
        }

        &:focus {
            background: linear-gradient(90deg, #dee2e622, #dee2e600);
            border-color: $color-primary;
            outline: none;
            box-shadow: 0 0 0 3px rgba($color-primary, 0.1);
            backdrop-filter: blur(4px);
        }
    }

    &.error {
        border-color: $color-error;

        @include theme-dark {
            background-color: rgb(231 76 60 / 10%);
        }

        @include theme-light {
            background-color: rgb(231 76 60 / 5%);
        }
    }
}

.form-textarea {
    height: 4.5rem;
    min-height: 0;
    font-family: $secondary-font-stack;
    line-height: 1.35;

    @include bp-sm-phone {
        height: 5.25rem;
    }

    @include bp-md-tablet {
        height: 6.5rem;
    }
}

.error-message {
    min-height: 1.1em;
    margin-top: 0;
    font-family: $secondary-font-stack;
    font-size: 0.74em;
    line-height: 1.1;
    color: $color-error;
}

.status-message {
    position: absolute;
    right: $size-3;
    bottom: $size-2;
    left: $size-3;
    max-width: 36em;
    padding: $size-4;
    margin: 0 auto;
    font-family: $secondary-font-stack;
    font-weight: 500;
    text-align: center;
    cursor: pointer;
    border-radius: 8px;
    transition: opacity 0.3s ease;

    &:hover {
        opacity: 0.8;
    }

    &.success {
        color: $color-success;
        background-color: rgb(46 204 113 / 10%);
        border: 1px solid rgb(46 204 113 / 30%);
    }

    &.error {
        color: $color-error;
        background-color: rgb(231 76 60 / 10%);
        border: 1px solid rgb(231 76 60 / 30%);
    }

    p {
        margin: 0;
        font-size: 0.95em;
    }
}

.form-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding-top: $size-1;
    font-size: 0.86em;

    @include bp-sm-phone {
        font-size: 0.95em;
    }

    .contact-links {
        display: flex;
        gap: $size-1;
        font-size: 1.35em;

        @include bp-sm-phone {
            font-size: 1.5em;
        }

        a :deep(button) .icon:hover {
            fill: $color-primary;
        }
    }

    :deep(button) {
        gap: $size-2;
    }
}

@media (max-height: 600px) {
    .contact-container {
        gap: $size-1;
        padding-block: $size-1 0;
        font-size: 0.84em;
    }

    .contact-title {
        font-size: 1.95em;
    }

    .contact-rule {
        margin: 0 auto $size-1;
    }

    .contact-copy {
        font-size: 0.86em;
        line-height: 1.25;
    }

    .contact-form {
        gap: $size-1;
    }

    .form-label {
        font-size: 0.84em;
    }

    .form-input,
    .form-textarea {
        padding: 0.35em $size-3;
        font-size: 0.9em;
    }

    .form-textarea {
        height: 3.75rem;
    }

    .error-message {
        min-height: 1em;
        font-size: 0.72em;
    }

    .form-actions {
        padding-top: 0;
        font-size: 0.8em;
    }
}
</style>
