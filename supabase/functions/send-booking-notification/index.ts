import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NotificationPayload {
  bookingId: string;
  phone: string;
  email: string;
  customerName: string;
  serviceName: string;
  date: string;
  time: string;
  status: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const payload: NotificationPayload = await req.json();

    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'notifications@autocare.com';

    const statusMessages: Record<string, string> = {
      pending: 'Your booking has been received and is pending confirmation.',
      confirmed: 'Your booking has been confirmed!',
      in_progress: 'Your vehicle service is now in progress.',
      completed: 'Your vehicle service has been completed. Thank you for choosing AutoCare!',
      cancelled: 'Your booking has been cancelled.',
    };

    const message = statusMessages[payload.status] || 'Your booking status has been updated.';

    const smsBody = `Hi ${payload.customerName}, ${message} Service: ${payload.serviceName}, Date: ${payload.date} at ${payload.time}. - AutoCare`;

    const promises = [];

    if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
      const twilioAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

      const twilioPromise = fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${twilioAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: payload.phone,
          From: twilioPhoneNumber,
          Body: smsBody,
        }),
      });

      promises.push(twilioPromise);
    }

    if (sendgridApiKey) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">AutoCare</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937; margin-top: 0;">Booking Update</h2>
            <p style="color: #4b5563; font-size: 16px;">Hi ${payload.customerName},</p>
            <p style="color: #4b5563; font-size: 16px;">${message}</p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 10px 0; color: #6b7280;">Service:</td>
                  <td style="padding: 10px 0; color: #1f2937; font-weight: bold;">${payload.serviceName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280;">Date:</td>
                  <td style="padding: 10px 0; color: #1f2937; font-weight: bold;">${payload.date}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280;">Time:</td>
                  <td style="padding: 10px 0; color: #1f2937; font-weight: bold;">${payload.time}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280;">Status:</td>
                  <td style="padding: 10px 0; color: #2563eb; font-weight: bold; text-transform: capitalize;">${payload.status.replace('_', ' ')}</td>
                </tr>
              </table>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">Thank you for choosing AutoCare!</p>
          </div>
        </div>
      `;

      const sendgridPromise = fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: payload.email }],
            subject: `AutoCare Booking Update - ${payload.status.replace('_', ' ').toUpperCase()}`,
          }],
          from: { email: fromEmail },
          content: [{
            type: 'text/html',
            value: emailHtml,
          }],
        }),
      });

      promises.push(sendgridPromise);
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notifications sent successfully',
        smsSent: !!twilioAccountSid,
        emailSent: !!sendgridApiKey,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error sending notifications:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});