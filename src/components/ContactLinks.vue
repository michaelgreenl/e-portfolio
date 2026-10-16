<script setup>
import { ref } from 'vue';
import { useTimeoutFn } from '@vueuse/core';
import Button from '@/components/Button.vue';
import GithubFillIcon from '@/components/SVGs/GithubFillIcon.vue';
import LinkedInIcon from '@/components/SVGs/LinkedInIcon.vue';
import MailSquareIcon from '@/components/SVGs/MailSquareIcon.vue';

const copyFeedback = ref('');
const { start: hideCopyFeedback } = useTimeoutFn(() => (copyFeedback.value = ''), 1250, { immediate: false });

async function copyEmail() {
    try {
        await navigator.clipboard.writeText('greenmichael5000@gmail.com');
        copyFeedback.value = 'Email copied!';
    } catch {
        copyFeedback.value = 'Could not copy email. Try again.';
    }
    hideCopyFeedback();
}
</script>

<template>
    <div class="contact-links">
        <Button
            href="https://github.com/michaelgreenl"
            target="_blank"
            aria-label="GitHub"
            :iconLeft="GithubFillIcon"
            preset="secondary contact-link"
        />
        <Button
            href="https://www.linkedin.com/in/michaelgreen5/"
            target="_blank"
            aria-label="LinkedIn"
            :iconLeft="LinkedInIcon"
            preset="secondary contact-link"
        />
        <Button
            type="button"
            aria-label="Copy email"
            :tooltip-text="copyFeedback || 'Copy email'"
            :tooltip-open="Boolean(copyFeedback)"
            :iconLeft="MailSquareIcon"
            preset="secondary contact-link"
            data-testid="copy-email"
            @click="copyEmail"
        />
        <span class="copy-status" role="status">{{ copyFeedback }}</span>
    </div>
</template>

<style scoped>
.copy-status {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    white-space: nowrap;
    border: 0;
    clip-path: inset(50%);
}
</style>
