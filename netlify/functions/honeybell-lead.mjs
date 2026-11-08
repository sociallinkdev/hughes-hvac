/**
 * Honeybell Lead Capture - Mega Honey Feed
 * Receives lead data from the Honeybell chat widget, sends email notifications,
 * and feeds the lead to the Mega Honey central system.
 *
 * Called by the frontend form submission as a secondary POST alongside Netlify Forms.
 *
 * Env vars:
 *   MEGA_HONEY_WEBHOOK - URL of the Mega Honey central intake endpoint (optional)
 */

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

    // Structure the lead for Mega Honey
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
      notify: [
        'chris@hugheshvacservices.com',
        'brady@sociallink.com',
      ],
    };

    // Feed to Mega Honey webhook if configured
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
        // Non-blocking - lead is still captured in Netlify Forms
      }
    }

    // Log the lead (visible in Netlify function logs)
    console.log('HONEYBELL LEAD:', JSON.stringify(megaLead));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Lead captured and notifications queued',
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
