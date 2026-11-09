/**
 * Honeybell Lead Capture
 *
 * Receives leads from Honeybell chat, site forms, and non-conversion insights.
 * Submits all leads to Netlify Forms (which handles email notifications natively).
 * No third-party email service needed.
 */

const SITE_URL = process.env.URL || 'https://hugheshvacservices.com';

async function submitToNetlifyForm(lead) {
  const isInsight = lead.source === 'insight';
  const convoText = (lead.conversation || [])
    .map(m => `${m.role === 'user' ? 'Visitor' : 'Honeybell'}: ${m.content}`)
    .join('\n')
    .substring(0, 3000);

  const formData = {
    'form-name': 'honeybell-lead',
    'hb-name': lead.name || (isInsight ? '[No contact - insight only]' : 'Not provided'),
    'hb-phone': lead.phone || '',
    'hb-issue': lead.issue || lead.service || (isInsight ? 'Non-conversion insight' : 'General inquiry'),
    'hb-urgency': lead.urgency || (isInsight ? 'insight' : 'normal'),
    'hb-page': lead.page || '/',
    'hb-timestamp': new Date().toISOString(),
    'hb-diagnosis': isInsight ? convoText : (lead.diagnosis || lead.details || ''),
  };

  try {
    const resp = await fetch(SITE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(formData).toString(),
    });
    console.log('Netlify Form submission:', resp.status);
    return resp.ok;
  } catch (err) {
    console.error('Netlify Form submission failed:', err);
    return false;
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

    // Submit to Netlify Forms for native email notifications
    await submitToNetlifyForm(lead);

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
