/**
 * Honeybell Lead Capture + Email Alerts
 *
 * Handles leads from Honeybell chat AND site forms.
 * Sends branded email alerts to Chris and Brady on every lead.
 */

const NOTIFY_EMAILS = [
  'chris@hugheshvacservices.com',
  'brady@sociallink.com',
];

const FROM_EMAIL = 'Honeybell <onboarding@resend.dev>';
// RESEND_API_KEY must be set as an environment variable in Netlify

function buildLeadEmailHtml(lead) {
  const isEmergency = lead.urgency === 'emergency';
  const isUrgent = lead.urgency === 'urgent';
  const sourceLabel = lead.source === 'form' ? 'Website Form' : 'Honeybell Chat';

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
      <div style="background:#0E1C2F;padding:20px 24px;color:#fff">
        <h2 style="margin:0;font-size:18px;font-weight:600">Honeybell Lead Alert</h2>
        <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.6)">Hughes HVAC - hugheshvacservices.com | ${sourceLabel}</p>
      </div>
      <div style="padding:24px">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 0;color:#6b7280;width:100px">Name</td><td style="padding:8px 0;font-weight:600">${lead.name || 'Not provided'}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Phone</td><td style="padding:8px 0;font-weight:600"><a href="tel:${lead.phone}" style="color:#D4541A;text-decoration:none">${lead.phone || 'Not provided'}</a></td></tr>
          ${lead.email ? `<tr><td style="padding:8px 0;color:#6b7280">Email</td><td style="padding:8px 0"><a href="mailto:${lead.email}" style="color:#D4541A">${lead.email}</a></td></tr>` : ''}
          <tr><td style="padding:8px 0;color:#6b7280">Issue</td><td style="padding:8px 0">${lead.issue || lead.service || 'General inquiry'}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Urgency</td><td style="padding:8px 0"><span style="background:${isEmergency ? '#DC2626' : isUrgent ? '#F59E0B' : '#10B981'};color:#fff;padding:2px 10px;border-radius:50px;font-size:12px;font-weight:600">${(lead.urgency || 'normal').toUpperCase()}</span></td></tr>
          ${lead.address ? `<tr><td style="padding:8px 0;color:#6b7280">Address/ZIP</td><td style="padding:8px 0">${lead.address}</td></tr>` : ''}
          <tr><td style="padding:8px 0;color:#6b7280">Page</td><td style="padding:8px 0"><a href="https://hugheshvacservices.com${lead.page || '/'}" style="color:#D4541A">${lead.page || '/'}</a></td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Time</td><td style="padding:8px 0">${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'medium', timeStyle: 'short' })}</td></tr>
        </table>
        ${lead.details ? `<div style="margin-top:16px;padding:12px;background:#f9fafb;border-radius:6px;font-size:13px;color:#374151"><strong>Details:</strong> ${lead.details.substring(0, 500)}</div>` : ''}
        ${lead.diagnosis ? `<div style="margin-top:16px;padding:12px;background:#f9fafb;border-radius:6px;font-size:13px;color:#374151"><strong>Diagnosis:</strong> ${lead.diagnosis.substring(0, 500)}</div>` : ''}
        <div style="margin-top:20px">
          <a href="tel:${lead.phone}" style="display:inline-block;background:#D4541A;color:#fff;padding:10px 24px;border-radius:50px;text-decoration:none;font-weight:600;font-size:14px">Call ${lead.name ? lead.name.split(' ')[0] : 'Lead'} Now</a>
        </div>
      </div>
      <div style="padding:12px 24px;background:#f9fafb;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb">
        Captured by Honeybell AI | Social Link for Hughes HVAC
      </div>
    </div>
  `;
}

function buildInsightEmailHtml(lead) {
  // Format conversation into readable HTML
  const convo = (lead.conversation || []);
  const convoHtml = convo.map(m => {
    const who = m.role === 'user' ? 'Visitor' : 'Honeybell';
    const bg = m.role === 'user' ? '#f3f4f6' : '#eef2ff';
    const color = m.role === 'user' ? '#374151' : '#4338ca';
    const content = (m.content || '').substring(0, 500);
    return `<div style="margin-bottom:8px;padding:10px 14px;background:${bg};border-radius:8px;font-size:13px;color:${color}"><strong>${who}:</strong> ${content}</div>`;
  }).join('');

  const userMsgs = convo.filter(m => m.role === 'user');
  const topicSummary = userMsgs.map(m => m.content).join(' ').substring(0, 200);

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
      <div style="background:#4338ca;padding:20px 24px;color:#fff">
        <h2 style="margin:0;font-size:18px;font-weight:600">Honeybell Insight - Visitor Did Not Convert</h2>
        <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.7)">Hughes HVAC - hugheshvacservices.com</p>
      </div>
      <div style="padding:24px">
        <div style="margin-bottom:16px;padding:14px;background:#fef3c7;border-radius:8px;border-left:4px solid #f59e0b">
          <strong style="font-size:14px;color:#92400e">A visitor chatted with Honeybell but left without sharing their contact info.</strong>
          <p style="margin:8px 0 0;font-size:13px;color:#78350f">This could be a warm lead worth following up on if they return, or an opportunity to improve Honeybell's conversion flow.</p>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px">
          <tr><td style="padding:8px 0;color:#6b7280;width:100px">Page</td><td style="padding:8px 0"><a href="https://hugheshvacservices.com${lead.page || '/'}" style="color:#4338ca">${lead.page || '/'}</a></td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Messages</td><td style="padding:8px 0">${convo.length} total (${userMsgs.length} from visitor)</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Time</td><td style="padding:8px 0">${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'medium', timeStyle: 'short' })}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Topics</td><td style="padding:8px 0;font-style:italic">${topicSummary || 'Unknown'}</td></tr>
        </table>
        <h3 style="font-size:15px;font-weight:600;color:#111827;margin:20px 0 12px">Full Conversation</h3>
        ${convoHtml || '<p style="color:#9ca3af;font-size:13px">No conversation recorded.</p>'}
      </div>
      <div style="padding:12px 24px;background:#f9fafb;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb">
        Honeybell Insight Report | Social Link for Hughes HVAC
      </div>
    </div>
  `;
}

async function sendEmailAlert(lead) {
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.error('RESEND_API_KEY not set'); return null; }

  const isInsight = lead.source === 'insight';
  const isEmergency = lead.urgency === 'emergency';
  const isUrgent = lead.urgency === 'urgent';

  let subject, html;
  if (isInsight) {
    const userMsgs = (lead.conversation || []).filter(m => m.role === 'user');
    const topicPreview = userMsgs.length > 0 ? userMsgs[0].content.substring(0, 50) : 'chat';
    subject = `🔍 Honeybell Insight - Visitor didn't convert (${topicPreview}...)`;
    html = buildInsightEmailHtml(lead);
  } else {
    const urgencyLabel = isEmergency ? '🚨 EMERGENCY' : isUrgent ? '⚡ URGENT' : '📋 New';
    const sourceLabel = lead.source === 'form' ? 'Website Form' : 'Honeybell Chat';
    subject = `${urgencyLabel} Hughes HVAC Lead - ${lead.name || 'Unknown'} (${sourceLabel})`;
    html = buildLeadEmailHtml(lead);
  }

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: NOTIFY_EMAILS,
        subject,
        html,
      }),
    });
    const result = await resp.json();
    console.log('Email sent:', resp.status, JSON.stringify(result));
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
    console.log('LEAD RECEIVED:', JSON.stringify(lead));

    // Send email alerts to Chris and Brady
    await sendEmailAlert(lead);

    // Feed to Mega Honey if configured
    const webhookUrl = process.env.MEGA_HONEY_WEBHOOK;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: lead.source === 'form' ? 'hughes-hvac-form' : 'honeybell-hvac',
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
      body: JSON.stringify({ success: true, leadId: `hb-${Date.now()}` }),
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
