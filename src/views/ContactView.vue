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
                extraTargets: [
                    '.form-label, .form-input, .form-textarea, .contact-link, .status-message, .error-message',
                ],
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
    <div ref="pageElement" class="contact-container page-shell">
        <div ref="pageHeader" class="contact-header">
            <h1>Get in Touch!</h1>
            <hr />
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
                <span v-if="errors.email" class="status-message error-message">{{ errors.email }}</span>
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
                <span v-if="errors.subject" class="status-message error-message">{{ errors.subject }}</span>
            </div>

            <div class="form-group">
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

                <span v-if="errors.message" class="status-message error-message">{{ errors.message }}</span>
            </div>
        </form>

        <div class="form-actions">
            <div class="contact-links">
                <a href="https://github.com/michaelgreenl" target="_blank">
                    <Button class="contact-link" :iconLeft="GithubFillIcon" preset="secondary" />
                </a>
                <a href="https://www.linkedin.com/in/michaelgreen5/" target="_blank">
                    <Button class="contact-link" :iconLeft="LinkedInIcon" preset="secondary" />
                </a>
                <a href="mailto:greenmichael5000@gmail.com" aria-label="Email Michael Green">
                    <Button class="contact-link" :iconLeft="MailIcon" preset="secondary" />
                </a>
            </div>

            <Button
                type="submit"
                class="contact-link"
                preset="primary"
                :text="isSubmitting ? 'Sending...' : 'Send'"
                @click="handleSubmit"
                :styles="{
                    opacity: isSubmitting ? 0.7 : 1,
                    pointerEvents: isSubmitting ? 'none' : 'auto',
                }"
                :iconRight="MailIcon"
            />
        </div>

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
    padding: $size-2 $size-4;

    @include bp-xl-desktop {
        font-size: clamp(0.9em, 3.5vw, 1em);
    }
}

.contact-header {
    width: 90%;
    max-width: 27em;
    margin: $size-6 0 $size-6;
    text-align: center;

    h1,
    p {
        margin: 0;
    }

    h1 {
        font-size: 2.6em;
        white-space: nowrap;

        @include bp-xsm-phone {
            font-size: 3em;
        }

        @include bp-sm-phone {
            font-size: 3.4em;
        }
    }

    hr {
        width: 100%;
        margin: $size-3 auto $size-2;
    }

    p {
        max-width: 27ch;
        line-height: 1.6;
        color: $color-text-secondary;

        @include bp-xsm-phone {
            max-width: 42ch;
        }
    }
}

.contact-form {
    display: flex;
    flex-wrap: wrap;
    gap: $size-4;
    width: 100%;
    max-width: 33em;

    @include bp-md-tablet {
        max-width: 36em;
    }

    @include bp-lg-laptop {
        gap: $size-5;
        max-width: 40em;
    }
}

.form-group {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: $size-2;
    min-width: 18em;
}

.form-label {
    font-family: $primary-font-stack;
    font-size: 1em;
    font-weight: 500;

    @include theme-dark {
        color: $color-text-primary;
    }

    @include theme-light {
        color: $color-primary-darker;
    }
}

.form-input,
.form-textarea,
.error-message,
.status-message {
    font-family: $secondary-font-stack;
}

.form-input,
.form-textarea,
.status-message {
    border-radius: 8px;
}

.form-textarea {
    height: 6.5em;
    line-height: 1.5;
    resize: vertical;

    @include bp-sm-phone {
        min-height: 120px;
    }
}

.form-input,
.form-textarea {
    padding: $size-3 $size-4;
    font-size: 1em;
    background-color: transparent;
    border: 2px solid transparent;

    &:focus {
        border-color: $color-primary !important;
        outline: none;
        box-shadow: 0 0 0 3px rgba($color-primary, 0.1);
        backdrop-filter: blur(4px);
    }

    @include theme-dark {
        color: $color-text-primary;
        background-color: rgba($color-gray8, 0.3);
        border-color: $color-gray6;

        &::placeholder {
            color: $color-gray6;
        }

        &:focus {
            background: linear-gradient(90deg, #21252922, #21252900);
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

.error-message {
    color: $color-error;
}

.status-message {
    padding: 0 $size-4;
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    font-size: 0.8em;

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
        font-size: 0.95em;
    }

    @include bp-xsm-phone {
        font-size: 0.85em;
    }

    @include bp-sm-phone {
        font-size: 0.9em;
    }
}

.form-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 33em;
    padding: $size-5 $size-3;
    font-size: 0.95em;

    @include bp-md-tablet {
        max-width: 36em;
    }

    @include bp-lg-laptop {
        max-width: 40em;
    }

    .contact-links {
        display: flex;
        gap: $size-1;
        font-size: 1.5em;

        a :deep(button) .icon:hover {
            fill: $color-primary;
        }
    }

    :deep(button) {
        gap: $size-2;
    }
}
</style>
