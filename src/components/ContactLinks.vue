<script setup>
import Button from '@/components/Button.vue';
import GithubFillIcon from '@/components/SVGs/GithubFillIcon.vue';
import LinkedInIcon from '@/components/SVGs/LinkedInIcon.vue';
import MailSquareIcon from '@/components/SVGs/MailSquareIcon.vue';
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
            href="mailto:greenmichael5000@gmail.com"
            aria-label="Email Michael Green"
            :iconLeft="MailSquareIcon"
            preset="secondary contact-link"
        />
    </div>
</template>
