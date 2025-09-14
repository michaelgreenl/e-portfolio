<script setup>
import { ref, reactive, watch } from 'vue';
import { useRouteStore } from '../stores/routeStore.js';
import { useMotions, useMotion } from '@vueuse/motion';
import { Motions } from '../utils/motions.js';
import Button from '../components/Button.vue';
import MailIcon from '../components/SVGs/MailIcon.vue';
import GithubFillIcon from '../components/SVGs/GithubFillIcon.vue';
import LinkedInIcon from '../components/SVGs/LinkedInIcon.vue';

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

const isSubmitting = ref(false);
const submitStatus = ref(''); // 'success', 'error', or ''

const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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

    try {
        // TODO: Use a backend service
        const mailtoLink = `mailto:greenmichael5000@gmail.com?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(`From: ${form.email}\n\n${form.message}`)}`;
        window.location.href = mailtoLink;

        setTimeout(() => {
            submitStatus.value = 'success';
            isSubmitting.value = false;

            form.email = '';
            form.subject = '';
            form.message = '';
        }, 1000);
    } catch (error) {
        console.error('Error sending email:', error);
        submitStatus.value = 'error';
        isSubmitting.value = false;
    }
};

const clearStatus = () => {
    setTimeout(() => {
        submitStatus.value = '';
    }, 5000);
};

const routeStore = useRouteStore();

const contactBtn1 = ref(null);
const contactBtn2 = ref(null);
const headerTitle = ref(null);
const headerLine = ref(null);
const headerText = ref(null);
const emailLabel = ref(null);
const emailInput = ref(null);
const subjectLabel = ref(null);
const subjectInput = ref(null);
const messageLabel = ref(null);
const messageInput = ref(null);
const submitBtn = ref(null);

const contactBtn1Motion = useMotion(contactBtn1, Motions.directives['fade-in-leave']);
const contactBtn2Motion = useMotion(contactBtn2, Motions.directives['fade-in-leave']);
const headerTitleMotion = useMotion(headerTitle, Motions.directives['fade-in-leave']);
const headerLineMotion = useMotion(headerLine, Motions.directives['fade-in-scalex']);
const headerTextMotion = useMotion(headerText, Motions.directives['fade-in-leave']);
const emailLabelMotion = useMotion(emailLabel, Motions.directives['fade-in-leave']);
const emailInputMotion = useMotion(emailInput, Motions.directives['fade-in-leave']);
const subjectLabelMotion = useMotion(subjectLabel, Motions.directives['fade-in-leave']);
const subjectInputMotion = useMotion(subjectInput, Motions.directives['fade-in-leave']);
const messageLabelMotion = useMotion(messageLabel, Motions.directives['fade-in-leave']);
const messageInputMotion = useMotion(messageInput, Motions.directives['fade-in-leave']);
const submitBtnMotion = useMotion(submitBtn, Motions.directives['fade-in-leave']);

watch(
    () => routeStore.isLeaving,
    (newVal) => {
        if (newVal) {
            contactBtn1Motion.set('leave');
            contactBtn2Motion.set('leave');
            headerTitleMotion.set('leave');
            headerLineMotion.set('leave');
            headerTextMotion.set('leave');
            emailLabelMotion.set('leave');
            emailInputMotion.set('leave');
            subjectLabelMotion.set('leave');
            subjectInputMotion.set('leave');
            messageLabelMotion.set('leave');
            messageInputMotion.set('leave');
            submitBtnMotion.set('leave');
        }
    },
);
</script>

<template>
    <div class="contact-container">
        <div class="contact-header">
            <h1 ref="headerTitle" v-motion-fade-in :duration="200">Get In Touch!</h1>
            <hr ref="headerLine" v-motion-fade-in-scalex />
            <p ref="headerText" v-motion-fade-in :delay="50" :duration="200">
                It'd be great to hear from you. Send me a message and I'll respond as soon as I can!
            </p>
        </div>
        <form @submit.prevent="handleSubmit" class="contact-form">
            <div class="form-group">
                <label ref="emailLabel" for="email" class="form-label" v-motion-fade-in :delay="150" :duration="200"
                    >Email Address</label
                >
                <input
                    ref="emailInput"
                    id="email"
                    v-model="form.email"
                    type="email"
                    class="form-input"
                    :class="{ error: errors.email }"
                    placeholder="your.email@example.com"
                    required
                    v-motion-fade-in
                    :delay="200"
                    :duration="200"
                />
                <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
            </div>
            <div class="form-group">
                <label ref="subjectLabel" for="subject" class="form-label" v-motion-fade-in :delay="250" :duration="200"
                    >Subject</label
                >
                <input
                    ref="subjectInput"
                    id="subject"
                    v-model="form.subject"
                    type="text"
                    class="form-input"
                    :class="{ error: errors.subject }"
                    placeholder="What's this about?"
                    required
                    v-motion-fade-in
                    :delay="300"
                    :duration="200"
                />
                <span v-if="errors.subject" class="error-message">{{ errors.subject }}</span>
            </div>
            <div class="form-group">
                <label ref="messageLabel" for="message" class="form-label" v-motion-fade-in :delay="350" :duration="200"
                    >Message</label
                >
                <textarea
                    ref="messageInput"
                    id="message"
                    v-model="form.message"
                    class="form-textarea"
                    :class="{ error: errors.message }"
                    placeholder="What's up?"
                    rows="6"
                    required
                    v-motion-fade-in
                    :delay="400"
                    :duration="200"
                ></textarea>
                <span v-if="errors.message" class="error-message">{{ errors.message }}</span>
            </div>
            <div class="form-actions">
                <div class="contact-links">
                    <Button
                        ref="contactBtn1"
                        :iconLeft="GithubFillIcon"
                        preset="secondary"
                        v-motion-fade-in
                        :delay="450"
                        :duration="200"
                    />
                    <Button
                        ref="contactBtn2"
                        :iconLeft="LinkedInIcon"
                        preset="secondary"
                        v-motion-fade-in
                        :delay="500"
                        :duration="200"
                    />
                </div>
                <Button
                    ref="submitBtn"
                    preset="primary"
                    :text="isSubmitting ? 'Sending...' : 'Send'"
                    :onClick="handleSubmit"
                    :styles="{
                        opacity: isSubmitting ? 0.7 : 1,
                        pointerEvents: isSubmitting ? 'none' : 'auto',
                    }"
                    :iconRight="MailIcon"
                    v-motion-fade-in
                    :delay="450"
                    :duration="200"
                />
            </div>
            <div v-if="submitStatus === 'success'" class="status-message success" @click="clearStatus">
                <p>✓ Message sent successfully! I'll get back to you soon.</p>
            </div>
            <div v-if="submitStatus === 'error'" class="status-message error" @click="clearStatus">
                <p>✗ There was an error sending your message. Please try again.</p>
            </div>
        </form>
    </div>
</template>

<style lang="scss" scoped>
.contact-container {
    position: relative;
    font-size: 0.9em;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin: 0 auto;
    padding: $size-8 $size-4;
    width: 100%;
    flex-grow: 1;

    .contact-header {
        max-width: 27em;
        text-align: center;
        margin-bottom: $size-8;
        margin: $size-6 0 $size-10;

        h1,
        p {
            margin: 0;
        }

        h1 {
            font-size: 2.6em;
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

        .form-group {
            display: flex;
            flex-direction: column;
            gap: $size-2;

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
                transition: all 0.3s ease;
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
                    border-color: #e74c3c;

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
                color: #e74c3c;
                font-family: $secondary-font-stack;
                margin-top: $size-1;
            }
        }

        .form-actions {
            font-size: 0.95em;
            display: flex;
            width: 100%;
            justify-content: space-between;
            padding: 0 $size-3;

            .contact-links {
                font-size: 1.5em;
                display: flex;
                gap: $size-1;

                :deep(button) .icon:hover {
                    fill: $color-primary;
                }
            }

            :deep(button) {
                gap: $size-2;
                font-weight: 500;
            }
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
                color: #27ae60;
            }

            &.error {
                background-color: rgba(231, 76, 60, 0.1);
                border: 1px solid rgba(231, 76, 60, 0.3);
                color: #e74c3c;
            }

            p {
                margin: 0;
                font-size: 0.95em;
            }
        }
    }

    @include bp-xsm-phone {
        font-size: clamp(0.9em, 3.5vw, 1em);

        .contact-header h1 {
            font-size: 3em;
        }
    }

    @include bp-xsm-phone {
        .contact-header h1 {
            font-size: 3.2em;
        }
    }

    @include bp-md-tablet {
        .contact-header h1 {
            font-size: 3.2em;
        }
    }

    @include bp-lg-laptop {
        .contact-header {
            font-size: 1.25em;
        }

        .contact-form {
            max-width: 40em;
        }
    }
}
</style>
