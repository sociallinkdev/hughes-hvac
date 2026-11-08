/**
 * Honeybell Lead Capture - Mega Honey Feed + Email Alerts
 *
 * Receives lead data, sends email notifications to Chris and Brady,
 * and feeds the lead to the Mega Honey central system.
 *
 * Env vars required:
 *   RESEND_API_KEY - Resend.com API key for transactional email
 *   MEGA_HONEY_WEBHOOK - (optional) Mega Honey central intake endpoint
 */

const NOTIFY_EMAILS = [
  'chris@hugheshvacservices.com',
  'brady@sociallink.com',
];

const FROM_EMAIL = 'Honeybell <onboarding@resend.dev>'; // Use verified domain later

async function sendEmailAlert(lead, resendKey) {
  const urgencyLabel = lead.urgency === 'emergency' ? '🚨 EMERGENCY' : lead.urgency === 'urgent' ? '⚡ URGENT' : '📋 New';
  const subject = `${urgencyLabel} Hughes HVAC Lead - ${lead.name || 'Unknown'}`;

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
      <div style="background:#0E1C2F;padding:20px 24px;color:#fff">
        <h2 style="margin:0;font-size:18px;font-weight:600">Honeybell Lead Alert</h2>
        <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.6)">Hughes HVAC - hugheshvacservices.com</p>
      </div>
      <div style="padding:24px">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 0;color:#6b7280;width:100px">Name</td><td style="padding:8px 0;font-weight:600">${lead.name || 'Not provided'}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Phone</td><td style="padding:8px 0;font-weight:600"><a href="tel:${lead.phone}" style="color:#D4541A;text-decoration:none">${lead.phone || 'Not provided'}</a></td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Issue</td><td style="padding:8px 0">${lead.issue || 'General inquiry'}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Urgency</td><td style="padding:8px 0"><span style="background:${lead.urgency === 'emergency' ? '#DC2626' : lead.urgency === 'urgent' ? '#F59E0B' : '#10B981'};color:#fff;padding:2px 10px;border-radius:50px;font-size:12px;font-weight:600">${(lead.urgency || 'normal').toUpperCase()}</span></td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Page</td><td style="padding:8px 0"><a href="https://hugheshvacservices.com${lead.page || '/'}" style="color:#D4541A">${lead.page || '/'}</a></td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Time</td><td style="padding:8px 0">${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'medium', timeStyle: 'short' })}</td></tr>
        </table>
        ${lead.diagnosis ? `<div style="margin-top:16px;padding:12px;background:#f9fafb;border-radius:6px;font-size:13px;color:#374151"><strong>Diagnosis:</strong> ${lead.diagnosis.substring(0, 500)}</div>` : ''}
        <div style="margin-top:20px">
          <a href="tel:${lead.phone}" style="display:inline-block;background:#D4541A;color:#fff;padding:10px 24px;border-radius:50px;text-decoration:none;font-weight:600;font-size:14px">Call ${lead.name ? lead.name.split(' ')[0] : 'Lead'} Now</a>
        </div>
      </div>
      <div style="padding:12px 24px;background:#f9fafb;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb">
        Captured by Honeybell AI - Social Link's diagnostic assistant for Hughes HVAC
      </div>
    </div>
  `;

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: NOTIFY_EMAILS,
        subject: subject,
        html: html,
      }),
    });
    const result = await resp.json();
    console.log('Email sent:', JSON.stringify(result));
    return result;
  } catch (err) {
    console.error('Email send failed:', err);
    return null;
  }
}

export async function handler(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const lead = JSON.parse(event.body);

    const megaLead = {
      source: 'honeybell-hvac',
      client: 'hughes-hvac',
      domain: 'hugheshvacservices.com',
      timestamp: new Date().toISOString(),
      lead: {
        name: lead.name || '',
        phone: lead.phone || '',
        issue: lead.issue || '',
        diagnosis: lead.diagnosis || '',
        urgency: lead.urgency || 'normal',
        page: lead.page || '/',
        conversation: lead.conversation || [],
      },
    };

    // 1. Send email alerts to Chris and Brady
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      await sendEmailAlert(megaLead.lead, resendKey);
    } else {
      console.warn('RESEND_API_KEY not set - email alerts disabled');
    }

    // 2. Feed to Mega Honey webhook if configured
    const webhookUrl = process.env.MEGA_HONEY_WEBHOOK;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(megaLead),
        });
      } catch (err) {
        console.error('Mega Honey webhook error:', err);
      }
    }

    console.log('HONEYBELL LEAD:', JSON.stringify(megaLead));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Lead captured and notifications sent',
        leadId: `hb-${Date.now()}`,
      }),
    };
  } catch (err) {
    console.error('Lead capture error:', err);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: false, error: 'Lead capture failed' }),
    };
  }
}
