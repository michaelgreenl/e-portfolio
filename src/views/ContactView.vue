<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { useRouteStore } from '@/stores/routeStore.js';
import { useContactAnimations } from '@/composables/animations/useContactAnimations.js';
import emailjs from '@emailjs/browser';
import Button from '@/components/Button.vue';
import MailIcon from '@/components/SVGs/MailIcon.vue';
import GithubFillIcon from '@/components/SVGs/GithubFillIcon.vue';
import LinkedInIcon from '@/components/SVGs/LinkedInIcon.vue';

const SERVICE_ID = import.meta.env.VITE_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_PUBLIC_KEY;

const routeStore = useRouteStore();

const { enterPageAnim, exitPageAnim } = useContactAnimations();

const form = reactive({
    email: '',
    subject: '',
    message: '',
});

const errors = reactive({
    email: '',
    subject: '',
    message: '',
});

const touched = reactive({
    email: false,
    subject: false,
    message: false,
});

const isSubmitting = ref(false);
const submitStatus = ref(''); // 'success', 'error', or ''

onMounted(() => {
    enterPageAnim();
});

watch(
    () => routeStore.isLeaving,
    (newVal) => {
        if (newVal) {
            exitPageAnim();
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
        <div class="contact-header">
            <h1>Get In Touch!</h1>
            <hr />
            <p>It'd be great to hear from you. Send me a message and I'll respond as soon as I can!</p>
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
                <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
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
                <span v-if="errors.subject" class="error-message">{{ errors.subject }}</span>
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
                <span v-if="errors.message" class="error-message">{{ errors.message }}</span>
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
            </div>
            <Button
                type="submit"
                class="contact-link"
                preset="primary"
                :text="isSubmitting ? 'Sending...' : 'Send'"
                :onClick="handleSubmit"
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
    font-size: 0.9em;
    @include flexCenterAll;
    flex-direction: column;
    margin: 0 auto;
    padding: $size-8 $size-4;
    width: 100%;
    flex-grow: 1;

    @include bp-xsm-phone {
        font-size: clamp(0.9em, 3.5vw, 1em);
    }
}

.contact-header {
    max-width: 27em;
    text-align: center;
    margin-bottom: $size-8;
    margin: $size-6 0 $size-10;

    @include bp-lg-laptop {
        font-size: 1.25em;
    }

    h1,
    p {
        margin: 0;
    }

    h1 {
        font-size: 2.6em;

        @include bp-xsm-phone {
            font-size: 3em;
        }

        @include bp-sm-phone {
            font-size: 3.2em;
        }
    }

    hr {
        border: 0;
        width: 100%;
        margin: $size-1 auto $size-2;
        height: 1px;

        @include theme-dark {
            background-color: $color-gray6;
        }

        @include theme-light {
            background-color: $color-primary-darker;
        }
    }

    p {
        line-height: 1.6;
        max-width: 42ch;
        color: $color-text-secondary;
    }
}

.contact-form {
    display: flex;
    flex-direction: column;
    gap: $size-6;
    width: 100%;
    max-width: 33em;

    @include bp-lg-laptop {
        max-width: 40em;
    }
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: $size-2;
}

.form-label {
    font-family: $primary-font-stack;
    font-weight: 500;
    font-size: 1em;

    @include theme-dark {
        color: $color-text-primary;
    }

    @include theme-light {
        color: $color-primary-darker;
    }
}

.form-input,
.form-textarea {
    font-family: $secondary-font-stack;
    font-size: 1em;
    padding: $size-3 $size-4;
    border-radius: 8px;
    border: 2px solid transparent;
    background-color: transparent;
    resize: vertical;

    @include theme-dark {
        color: $color-text-primary;
        border-color: $color-gray6;
        background-color: rgba($color-gray8, 0.3);

        &::placeholder {
            color: $color-gray6;
        }

        &:focus {
            outline: none;
            border-color: $color-primary;
            box-shadow: 0 0 0 3px rgba($color-primary, 0.1);
            background: linear-gradient(90deg, #21252922, #21252900);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
        }
    }

    @include theme-light {
        color: $color-primary-darker;
        border-color: $color-gray5;
        background-color: rgba($color-white, 0.7);

        &::placeholder {
            color: darken-color($color-gray5, 10%);
        }

        &:focus {
            outline: none;
            border-color: $color-primary;
            box-shadow: 0 0 0 3px rgba($color-primary, 0.1);
            background: linear-gradient(90deg, #dee2e622, #dee2e600);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
        }
    }

    &.error {
        border-color: $color-error;

        @include theme-dark {
            background-color: rgba(231, 76, 60, 0.1);
        }

        @include theme-light {
            background-color: rgba(231, 76, 60, 0.05);
        }
    }
}

.form-textarea {
    min-height: 120px;
    font-family: $secondary-font-stack;
    line-height: 1.5;
}

.error-message {
    font-size: 0.9em;
    color: $color-error;
    font-family: $secondary-font-stack;
    margin-top: $size-1;
}

.status-message {
    padding: $size-4;
    border-radius: 8px;
    text-align: center;
    font-family: $secondary-font-stack;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.3s ease;

    &:hover {
        opacity: 0.8;
    }

    &.success {
        background-color: rgba(46, 204, 113, 0.1);
        border: 1px solid rgba(46, 204, 113, 0.3);
        color: $color-success;
    }

    &.error {
        background-color: rgba(231, 76, 60, 0.1);
        border: 1px solid rgba(231, 76, 60, 0.3);
        color: $color-error;
    }

    p {
        font-size: 0.95em;
    }
}

.form-actions {
    font-size: 0.95em;
    display: flex;
    width: 100%;
    max-width: 33em;
    justify-content: space-between;
    padding: $size-5 $size-3;

    @include bp-lg-laptop {
        max-width: 40em;
    }

    .contact-links {
        font-size: 1.5em;
        display: flex;
        gap: $size-1;

        a :deep(button) .icon:hover {
            fill: $color-primary;
        }
    }

    :deep(button) {
        gap: $size-2;
    }
}
</style>
