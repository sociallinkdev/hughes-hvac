/**
 * Honeybell Lead Capture + Email Alerts
 *
 * Receives leads from site forms (via sendBeacon), Honeybell chat,
 * and non-conversion insights. Sends email alerts to Brady and Chris
 * via Resend. Falls back to Netlify Forms if Resend is not configured.
 *
 * Env vars:
 *   RESEND_API_KEY - Resend API key (hughes-hvac-lead-alerts)
 */

const NOTIFY_EMAILS = [
  'chris@hugheshvacservices.com',
  'brady@sociallink.com',
];

async function sendEmailAlert(lead) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn('RESEND_API_KEY not set - no email sent');
    return null;
  }

  const isInsight = lead.source === 'insight';
  const ts = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'medium', timeStyle: 'short' });

  let subject, body;

  if (isInsight) {
    const convo = (lead.conversation || []);
    const userMsgs = convo.filter(m => m.role === 'user');
    const preview = userMsgs.length > 0 ? userMsgs[0].content.substring(0, 40) : 'chat';
    subject = `Honeybell Insight - visitor didn't convert (${preview})`;
    const convoHtml = convo.map(m => {
      const who = m.role === 'user' ? 'Visitor' : 'Honeybell';
      const bg = m.role === 'user' ? '#f3f4f6' : '#eef2ff';
      return `<div style="margin-bottom:6px;padding:8px 12px;background:${bg};border-radius:6px;font-size:13px"><b>${who}:</b> ${(m.content || '').substring(0, 400)}</div>`;
    }).join('');
    body = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#4338ca;padding:16px 20px;color:#fff;border-radius:8px 8px 0 0">
          <b>Honeybell Insight</b> - visitor left without converting
        </div>
        <div style="padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
          <table style="width:100%;font-size:14px;border-collapse:collapse">
            <tr><td style="padding:4px 0;color:#6b7280;width:80px">Page</td><td><a href="https://hugheshvacservices.com${lead.page||'/'}">${lead.page||'/'}</a></td></tr>
            <tr><td style="padding:4px 0;color:#6b7280">Messages</td><td>${convo.length} total (${userMsgs.length} from visitor)</td></tr>
            <tr><td style="padding:4px 0;color:#6b7280">Time</td><td>${ts}</td></tr>
          </table>
          <div style="margin-top:16px">${convoHtml}</div>
        </div>
      </div>`;
  } else {
    // Regular lead (form or Honeybell chat)
    const src = lead.source === 'form' ? 'Website Form' : 'Honeybell Chat';
    const isEmergency = (lead.urgency || '').toLowerCase() === 'emergency';
    const urgencyBadge = isEmergency ? '🚨 EMERGENCY' : (lead.urgency === 'today' ? '⚡ URGENT' : '');
    subject = `${urgencyBadge ? urgencyBadge + ' ' : ''}Hughes HVAC Lead - ${lead.name || 'Unknown'} (${src})`;

    const phone = lead.phone || '';
    const phoneCta = phone ? `<a href="tel:${phone.replace(/[^+\d]/g,'')}" style="display:inline-block;background:#D4541A;color:#fff;padding:10px 24px;border-radius:50px;text-decoration:none;font-weight:600;font-size:16px;margin:12px 0">Call ${(lead.name||'').split(' ')[0]||'Lead'}: ${phone}</a>` : '';

    body = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#0E1C2F;padding:16px 20px;color:#fff;border-radius:8px 8px 0 0">
          <b>Hughes HVAC Lead</b> - ${src}
        </div>
        <div style="padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
          ${phoneCta}
          <table style="width:100%;font-size:14px;border-collapse:collapse;margin-top:8px">
            <tr><td style="padding:6px 0;color:#6b7280;width:80px"><b>Phone</b></td><td style="font-weight:600"><a href="tel:${phone.replace(/[^+\d]/g,'')}" style="color:#D4541A">${phone || 'Not provided'}</a></td></tr>
            <tr><td style="padding:6px 0;color:#6b7280"><b>Name</b></td><td>${lead.name || 'Not provided'}</td></tr>
            ${lead.email ? `<tr><td style="padding:6px 0;color:#6b7280">Email</td><td><a href="mailto:${lead.email}" style="color:#D4541A">${lead.email}</a></td></tr>` : ''}
            <tr><td style="padding:6px 0;color:#6b7280">Service</td><td>${lead.service || lead.issue || 'General inquiry'}</td></tr>
            ${lead.urgency ? `<tr><td style="padding:6px 0;color:#6b7280">Urgency</td><td>${lead.urgency}</td></tr>` : ''}
            ${lead.address ? `<tr><td style="padding:6px 0;color:#6b7280">Address</td><td>${lead.address}</td></tr>` : ''}
            ${lead.zip ? `<tr><td style="padding:6px 0;color:#6b7280">ZIP</td><td>${lead.zip}</td></tr>` : ''}
            ${lead.details ? `<tr><td style="padding:6px 0;color:#6b7280">Details</td><td>${lead.details.substring(0,500)}</td></tr>` : ''}
            <tr><td style="padding:6px 0;color:#6b7280">Page</td><td><a href="https://hugheshvacservices.com${lead.page||'/'}" style="color:#D4541A">${lead.page || '/'}</a></td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">Time</td><td>${ts}</td></tr>
          </table>
          ${lead.conversation ? `<div style="margin-top:12px;padding:10px;background:#f9fafb;border-radius:6px;font-size:12px;color:#374151"><b>Conversation:</b><br>${(lead.conversation||[]).map(m=>(m.role==='user'?'Visitor':'Honeybell')+': '+m.content).join('<br>').substring(0,1000)}</div>` : ''}
        </div>
        <div style="padding:8px 20px;font-size:11px;color:#9ca3af">Honeybell AI | Social Link for Hughes HVAC</div>
      </div>`;
  }

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        from: 'Honeybell <onboarding@resend.dev>',
        to: NOTIFY_EMAILS,
        subject,
        html: body,
      }),
    });
    const result = await resp.json();
    console.log('Resend:', resp.status, JSON.stringify(result));
    return { status: resp.status, result };
  } catch (err) {
    console.error('Resend failed:', err);
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

    // Require at least name or phone to prevent blank submissions
    if (!lead.name && !lead.phone && lead.source !== 'insight') {
      return { statusCode: 200, headers, body: JSON.stringify({ success: false, error: 'No lead data' }) };
    }

    console.log('LEAD:', lead.source, lead.name, lead.phone);

    // Send email alerts to Brady and Chris
    const emailResult = await sendEmailAlert(lead);

    // Feed to Mega Honey if configured
    const webhookUrl = process.env.MEGA_HONEY_WEBHOOK;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: lead.source === 'form' ? 'hughes-hvac-form' : lead.source === 'insight' ? 'honeybell-hvac-insight' : 'honeybell-hvac',
            client: 'hughes-hvac',
            domain: 'hugheshvacservices.com',
            timestamp: new Date().toISOString(),
            lead,
          }),
        });
      } catch (err) {
        console.error('Mega Honey webhook error:', err);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, leadId: `hb-${Date.now()}`, emailSent: !!emailResult }),
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
