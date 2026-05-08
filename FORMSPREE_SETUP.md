# Hughes HVAC — Form Setup Guide
## Takes 5 minutes. Free plan handles 50 submissions/month.

---

### Step 1 — Create Formspree account
Go to **formspree.io** → Sign up (free)

---

### Step 2 — Create a new form
- Click **"+ New Form"**
- Name it: `Hughes HVAC — Service Request`
- Click **Create**
- Copy the **Form ID** — looks like `xpzgkrjd` (8 characters)

---

### Step 3 — Add both email recipients
In your form settings → **"Email Notifications"**
- Add: `brady@sociallink.com`
- Add: `chris@hugheshvacservices.com`

Both addresses will receive every submission.

---

### Step 4 — Upload the email template
In form settings → **"Custom Email Template"**
- Paste the contents of `hughes_email_alert.html`
- Formspree supports `{{name}}`, `{{email}}`, `{{phone}}`, `{{service}}`, `{{message}}`, `{{address}}` variables — these are already in the template

---

### Step 5 — Replace the Form ID in the site files
In the deployed site, every HTML file contains:

```
https://formspree.io/f/HUGHES_FORM_ID
```

Replace `HUGHES_FORM_ID` with your actual 8-character ID (e.g. `xpzgkrjd`).

**Fastest way:** Open Terminal, navigate to the hughes-hvac-deploy folder, run:
```bash
find . -name "*.html" -exec sed -i '' 's/HUGHES_FORM_ID/YOUR_ACTUAL_ID/g' {} +
```

Replace `YOUR_ACTUAL_ID` with the real ID from Formspree.

---

### Step 6 — Test
Open any page → fill out the form → submit → 
Both emails should receive the branded Social Link alert within 60 seconds.

---

### Formspree free plan limits
- 50 submissions/month
- If Hughes gets more than 50 leads/month (great problem), upgrade to $10/month for 1,000/month

