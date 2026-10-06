import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// This check sends one real email to the portfolio inbox.
const siteUrl = process.env.PORTFOLIO_URL ?? 'https://michaelgreenl.net/';
const fields = {
    email: 'greenmichael5000@gmail.com',
    subject: '[Deployment check] Contact form',
    message: `Automated contact form check for deployment ${process.env.GITHUB_SHA ?? 'manual'}. No reply needed.`,
};
const browser = await chromium.launch();
const page = await browser.newPage();
page.setDefaultTimeout(30_000);

try {
    await page.goto(new URL('contact', siteUrl).href);
    await page.getByLabel('Email Address', { exact: true }).fill(fields.email);
    await page.getByLabel('Subject', { exact: true }).fill(fields.subject);
    await page.getByLabel('Message', { exact: true }).fill(fields.message);

    const [response] = await Promise.all([
        page.waitForResponse((result) => result.url() === 'https://api.emailjs.com/api/v1.0/email/send-form'),
        page.getByRole('button', { name: 'Send', exact: true }).click(),
    ]);
    const submittedFields = await new Response(response.request().postDataBuffer(), {
        headers: { 'Content-Type': response.request().headers()['content-type'] },
    }).formData();
    for (const [name, value] of Object.entries(fields)) {
        assert.equal(submittedFields.get(name), value, `The contact form did not serialize ${name}`);
    }
    assert.equal(response.status(), 200, `EmailJS rejected the contact form: ${await response.text()}`);
    await page.getByText('✓ Message sent successfully!', { exact: false }).waitFor({ state: 'visible' });
    assert.equal(await page.getByLabel('Message', { exact: true }).inputValue(), '', 'The form did not reset');
    console.log('PASS: All form fields reached EmailJS, EmailJS accepted the email, and the form reset.');
} catch (error) {
    await page.screenshot({ path: 'contact-health-failure.png', fullPage: true });
    throw error;
} finally {
    await browser.close();
}
