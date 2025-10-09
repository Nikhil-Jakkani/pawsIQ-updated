import { sendEmail } from '../../../services/email.service.js';
import prisma from '../../../lib/prisma.js';

/**
 * Send booking confirmation email to user
 */
const sendBookingConfirmationToUser = async (bookingId: number) => {
  const booking = await prisma.pIQ_Bookings.findUnique({
    where: { booking_id: bookingId },
    include: {
      PIQ_User: true,
      PIQ_Pets: true,
      PIQ_Service_Master: true,
      PIQ_Service_Provider: true,
    },
  });

  if (!booking || !booking.PIQ_User.user_email_id) {
    console.warn('Booking or user email not found');
    return;
  }

  const bookingDate = new Date(booking.booked_dtm).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const subject = `Booking Confirmation - ${booking.PIQ_Service_Master.service_title}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin-bottom: 20px;">🎉 Booking Confirmed!</h2>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          Hi ${booking.PIQ_User.user_full_name},
        </p>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          Your booking for <strong>${booking.PIQ_Pets.pet_name}</strong> has been confirmed!
        </p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Booking Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Booking ID:</td>
              <td style="padding: 8px 0; color: #1f2937;">#${booking.booking_id}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Service:</td>
              <td style="padding: 8px 0; color: #1f2937;">${booking.PIQ_Service_Master.service_title}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Pet:</td>
              <td style="padding: 8px 0; color: #1f2937;">${booking.PIQ_Pets.pet_name} (${booking.PIQ_Pets.pet_type})</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Date & Time:</td>
              <td style="padding: 8px 0; color: #1f2937;">${bookingDate}</td>
            </tr>
            ${booking.PIQ_Service_Provider ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Provider:</td>
              <td style="padding: 8px 0; color: #1f2937;">${booking.PIQ_Service_Provider.serv_provider_name}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Status:</td>
              <td style="padding: 8px 0;">
                <span style="background-color: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 12px; font-weight: 600; font-size: 14px;">
                  ${booking.booking_status}
                </span>
              </td>
            </tr>
          </table>
        </div>
        
        ${booking.booking_comments ? `
        <div style="margin: 20px 0;">
          <p style="color: #6b7280; font-weight: 600; margin-bottom: 8px;">Additional Notes:</p>
          <p style="color: #4b5563; line-height: 1.6;">${booking.booking_comments}</p>
        </div>
        ` : ''}
        
        <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin-top: 20px;">
          Please arrive 5-10 minutes early for your appointment. If you need to reschedule or cancel, please do so at least 24 hours in advance.
        </p>
        
        <div style="margin-top: 30px; text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/bookings" 
             style="display: inline-block; 
                    background-color: #4F46E5; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 6px; 
                    font-weight: 600;">
            View Booking
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          Thank you for choosing PawsIQ! 🐾<br>
          If you have any questions, please contact us at support@pawsiq.com
        </p>
      </div>
    </div>
  `;

  try {
    await sendEmail(booking.PIQ_User.user_email_id, subject, html);
    console.log(`Booking confirmation sent to user: ${booking.PIQ_User.user_email_id}`);
  } catch (error) {
    console.error('Failed to send booking confirmation to user:', error);
  }
};

/**
 * Send booking notification to provider
 */
const sendBookingNotificationToProvider = async (bookingId: number) => {
  const booking = await prisma.pIQ_Bookings.findUnique({
    where: { booking_id: bookingId },
    include: {
      PIQ_User: true,
      PIQ_Pets: true,
      PIQ_Service_Master: true,
      PIQ_Service_Provider: true,
    },
  });

  if (!booking) {
    console.warn('Booking not found');
    return;
  }

  if (!booking.PIQ_Service_Provider) {
    console.warn('Provider not assigned to booking');
    return;
  }

  if (!booking.PIQ_Service_Provider.serv_provider_email) {
    console.warn(`Provider ${booking.PIQ_Service_Provider.serv_provider_name} has no email address`);
    return;
  }

  const bookingDate = new Date(booking.booked_dtm).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const subject = `New Booking - ${booking.PIQ_Service_Master.service_title}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin-bottom: 20px;">📅 New Booking Received</h2>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          Hi ${booking.PIQ_Service_Provider.serv_provider_name},
        </p>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          You have a new booking for <strong>${booking.PIQ_Service_Master.service_title}</strong>.
        </p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Booking Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Booking ID:</td>
              <td style="padding: 8px 0; color: #1f2937;">#${booking.booking_id}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Service:</td>
              <td style="padding: 8px 0; color: #1f2937;">${booking.PIQ_Service_Master.service_title}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Customer:</td>
              <td style="padding: 8px 0; color: #1f2937;">${booking.PIQ_User.user_full_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Pet:</td>
              <td style="padding: 8px 0; color: #1f2937;">${booking.PIQ_Pets.pet_name} (${booking.PIQ_Pets.pet_type})</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Date & Time:</td>
              <td style="padding: 8px 0; color: #1f2937;">${bookingDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Contact:</td>
              <td style="padding: 8px 0; color: #1f2937;">${booking.PIQ_User.user_phone_number}</td>
            </tr>
          </table>
        </div>
        
        ${booking.booking_comments ? `
        <div style="margin: 20px 0;">
          <p style="color: #6b7280; font-weight: 600; margin-bottom: 8px;">Customer Notes:</p>
          <p style="color: #4b5563; line-height: 1.6;">${booking.booking_comments}</p>
        </div>
        ` : ''}
        
        <div style="margin-top: 30px; text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/provider/bookings" 
             style="display: inline-block; 
                    background-color: #4F46E5; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 6px; 
                    font-weight: 600;">
            View Booking
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          PawsIQ Provider Dashboard<br>
          Questions? Contact support@pawsiq.com
        </p>
      </div>
    </div>
  `;

  try {
    await sendEmail(booking.PIQ_Service_Provider.serv_provider_email, subject, html);
    console.log(`Booking notification sent to provider: ${booking.PIQ_Service_Provider.serv_provider_email}`);
  } catch (error) {
    console.error('Failed to send booking notification to provider:', error);
  }
};

/**
 * Send payment success email
 */
const sendPaymentSuccessEmail = async (paymentId: number) => {
  const payment = await prisma.pIQ_Payments.findUnique({
    where: { payment_id: paymentId },
    include: {
      PIQ_User: true,
      PIQ_Bookings: {
        include: {
          PIQ_Service_Master: true,
          PIQ_Pets: true,
        },
      },
    },
  });

  if (!payment || !payment.PIQ_User.user_email_id) {
    console.warn('Payment or user email not found');
    return;
  }

  const subject = `Payment Successful - Booking #${payment.booking_id}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin-bottom: 20px;">✅ Payment Successful</h2>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          Hi ${payment.PIQ_User.user_full_name},
        </p>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          Your payment has been processed successfully!
        </p>
        
        <div style="background-color: #dcfce7; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #16a34a;">
          <h3 style="color: #166534; margin-top: 0;">Payment Receipt</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #15803d; font-weight: 600;">Payment ID:</td>
              <td style="padding: 8px 0; color: #166534;">#${payment.payment_id}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #15803d; font-weight: 600;">Amount Paid:</td>
              <td style="padding: 8px 0; color: #166534; font-size: 18px; font-weight: 700;">₹${Number(payment.amount).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #15803d; font-weight: 600;">Payment Method:</td>
              <td style="padding: 8px 0; color: #166534;">${payment.payment_method || 'Online'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #15803d; font-weight: 600;">Transaction ID:</td>
              <td style="padding: 8px 0; color: #166534; font-size: 12px;">${payment.razorpay_payment_id || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #15803d; font-weight: 600;">Date:</td>
              <td style="padding: 8px 0; color: #166534;">${new Date(payment.transaction_date || payment.created_at).toLocaleString()}</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Booking Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Booking ID:</td>
              <td style="padding: 8px 0; color: #1f2937;">#${payment.booking_id}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Service:</td>
              <td style="padding: 8px 0; color: #1f2937;">${payment.PIQ_Bookings.PIQ_Service_Master.service_title}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Pet:</td>
              <td style="padding: 8px 0; color: #1f2937;">${payment.PIQ_Bookings.PIQ_Pets.pet_name}</td>
            </tr>
          </table>
        </div>
        
        <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin-top: 20px;">
          A copy of this receipt has been saved to your account. You can view it anytime in your payment history.
        </p>
        
        <div style="margin-top: 30px; text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/payments" 
             style="display: inline-block; 
                    background-color: #4F46E5; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 6px; 
                    font-weight: 600;">
            View Payment History
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          Thank you for your payment! 🐾<br>
          For any queries, contact support@pawsiq.com
        </p>
      </div>
    </div>
  `;

  try {
    await sendEmail(payment.PIQ_User.user_email_id, subject, html);
    console.log(`Payment success email sent to: ${payment.PIQ_User.user_email_id}`);
  } catch (error) {
    console.error('Failed to send payment success email:', error);
  }
};

/**
 * Send booking cancellation email
 */
const sendBookingCancellationEmail = async (bookingId: number) => {
  const booking = await prisma.pIQ_Bookings.findUnique({
    where: { booking_id: bookingId },
    include: {
      PIQ_User: true,
      PIQ_Pets: true,
      PIQ_Service_Master: true,
    },
  });

  if (!booking || !booking.PIQ_User.user_email_id) {
    console.warn('Booking or user email not found');
    return;
  }

  const subject = `Booking Cancelled - #${booking.booking_id}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin-bottom: 20px;">❌ Booking Cancelled</h2>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          Hi ${booking.PIQ_User.user_full_name},
        </p>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          Your booking for <strong>${booking.PIQ_Pets.pet_name}</strong> has been cancelled.
        </p>
        
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="color: #991b1b; margin-top: 0;">Cancelled Booking</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #b91c1c; font-weight: 600;">Booking ID:</td>
              <td style="padding: 8px 0; color: #991b1b;">#${booking.booking_id}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #b91c1c; font-weight: 600;">Service:</td>
              <td style="padding: 8px 0; color: #991b1b;">${booking.PIQ_Service_Master.service_title}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #b91c1c; font-weight: 600;">Pet:</td>
              <td style="padding: 8px 0; color: #991b1b;">${booking.PIQ_Pets.pet_name}</td>
            </tr>
            ${booking.cancellation_reason ? `
            <tr>
              <td style="padding: 8px 0; color: #b91c1c; font-weight: 600;">Reason:</td>
              <td style="padding: 8px 0; color: #991b1b;">${booking.cancellation_reason}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
          If you paid for this booking, a refund will be processed to your original payment method within 5-7 business days.
        </p>
        
        <div style="margin-top: 30px; text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/providers" 
             style="display: inline-block; 
                    background-color: #4F46E5; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 6px; 
                    font-weight: 600;">
            Book Again
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          We're sorry to see you go. For support, contact us at support@pawsiq.com
        </p>
      </div>
    </div>
  `;

  try {
    await sendEmail(booking.PIQ_User.user_email_id, subject, html);
    console.log(`Cancellation email sent to: ${booking.PIQ_User.user_email_id}`);
  } catch (error) {
    console.error('Failed to send cancellation email:', error);
  }
};

/**
 * Send booking approval email to user
 */
const sendBookingApprovalEmail = async (bookingId: number) => {
  const booking = await prisma.pIQ_Bookings.findUnique({
    where: { booking_id: bookingId },
    include: {
      PIQ_User: true,
      PIQ_Pets: true,
      PIQ_Service_Master: true,
      PIQ_Service_Provider: true,
    },
  });

  if (!booking || !booking.PIQ_User.user_email_id) {
    console.warn('Booking or user email not found');
    return;
  }

  const bookingDate = new Date(booking.booked_dtm).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const subject = `Booking Approved - ${booking.PIQ_Service_Master.service_title}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin-bottom: 20px;">✅ Booking Approved!</h2>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          Hi ${booking.PIQ_User.user_full_name},
        </p>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          Great news! Your booking for <strong>${booking.PIQ_Pets.pet_name}</strong> has been approved by the service provider.
        </p>
        
        <div style="background-color: #dcfce7; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #16a34a;">
          <h3 style="color: #166534; margin-top: 0;">Booking Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #15803d; font-weight: 600;">Booking ID:</td>
              <td style="padding: 8px 0; color: #166534;">#${booking.booking_id}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #15803d; font-weight: 600;">Service:</td>
              <td style="padding: 8px 0; color: #166534;">${booking.PIQ_Service_Master.service_title}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #15803d; font-weight: 600;">Pet:</td>
              <td style="padding: 8px 0; color: #166534;">${booking.PIQ_Pets.pet_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #15803d; font-weight: 600;">Date & Time:</td>
              <td style="padding: 8px 0; color: #166534;">${bookingDate}</td>
            </tr>
            ${booking.PIQ_Service_Provider ? `
            <tr>
              <td style="padding: 8px 0; color: #15803d; font-weight: 600;">Provider:</td>
              <td style="padding: 8px 0; color: #166534;">${booking.PIQ_Service_Provider.serv_provider_name}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; color: #15803d; font-weight: 600;">Status:</td>
              <td style="padding: 8px 0;">
                <span style="background-color: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 12px; font-weight: 600; font-size: 14px;">
                  Confirmed
                </span>
              </td>
            </tr>
          </table>
        </div>
        
        <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin-top: 20px;">
          Please arrive 5-10 minutes early for your appointment. Looking forward to seeing you!
        </p>
        
        <div style="margin-top: 30px; text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/bookings" 
             style="display: inline-block; 
                    background-color: #4F46E5; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 6px; 
                    font-weight: 600;">
            View Booking
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          Thank you for choosing PawsIQ! 🐾
        </p>
      </div>
    </div>
  `;

  try {
    await sendEmail(booking.PIQ_User.user_email_id, subject, html);
    console.log(`Booking approval email sent to: ${booking.PIQ_User.user_email_id}`);
  } catch (error) {
    console.error('Failed to send booking approval email:', error);
  }
};

/**
 * Send booking decline email to user
 */
const sendBookingDeclineEmail = async (bookingId: number) => {
  const booking = await prisma.pIQ_Bookings.findUnique({
    where: { booking_id: bookingId },
    include: {
      PIQ_User: true,
      PIQ_Pets: true,
      PIQ_Service_Master: true,
    },
  });

  if (!booking || !booking.PIQ_User.user_email_id) {
    console.warn('Booking or user email not found');
    return;
  }

  const bookingDate = new Date(booking.booked_dtm).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const subject = `Booking Declined - ${booking.PIQ_Service_Master.service_title}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin-bottom: 20px;">Booking Update</h2>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          Hi ${booking.PIQ_User.user_full_name},
        </p>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          Unfortunately, your booking for <strong>${booking.PIQ_Pets.pet_name}</strong> could not be confirmed at this time.
        </p>
        
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="color: #991b1b; margin-top: 0;">Booking Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #b91c1c; font-weight: 600;">Booking ID:</td>
              <td style="padding: 8px 0; color: #991b1b;">#${booking.booking_id}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #b91c1c; font-weight: 600;">Service:</td>
              <td style="padding: 8px 0; color: #991b1b;">${booking.PIQ_Service_Master.service_title}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #b91c1c; font-weight: 600;">Pet:</td>
              <td style="padding: 8px 0; color: #991b1b;">${booking.PIQ_Pets.pet_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #b91c1c; font-weight: 600;">Requested Date:</td>
              <td style="padding: 8px 0; color: #991b1b;">${bookingDate}</td>
            </tr>
          </table>
        </div>
        
        <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
          This may be due to unavailability at the requested time. We recommend:
        </p>
        <ul style="color: #4b5563; font-size: 14px; line-height: 1.6;">
          <li>Trying a different date or time</li>
          <li>Selecting an alternative service provider</li>
          <li>Contacting us for assistance</li>
        </ul>
        
        <div style="margin-top: 30px; text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/providers" 
             style="display: inline-block; 
                    background-color: #4F46E5; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 6px; 
                    font-weight: 600;">
            Book Again
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          For assistance, contact support@pawsiq.com
        </p>
      </div>
    </div>
  `;

  try {
    await sendEmail(booking.PIQ_User.user_email_id, subject, html);
    console.log(`Booking decline email sent to: ${booking.PIQ_User.user_email_id}`);
  } catch (error) {
    console.error('Failed to send booking decline email:', error);
  }
};

export const notificationService = {
  sendBookingConfirmationToUser,
  sendBookingNotificationToProvider,
  sendPaymentSuccessEmail,
  sendBookingCancellationEmail,
  sendBookingApprovalEmail,
  sendBookingDeclineEmail,
};
