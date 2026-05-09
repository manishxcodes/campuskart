import nodemailer from 'nodemailer';
import { NextRequest, NextResponse } from 'next/server';

// Create transporter for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { userEmail, ownerEmail, productId, productTitle, offer } =
      await request.json();

    // Validate required fields
    if (!userEmail || !ownerEmail || !productId || !productTitle || !offer) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Email to owner
    const ownerEmailContent = `
      <h2>New Offer Received!</h2>
      <p>You have received a new offer for your product:</p>
      <hr>
      <h3>${productTitle}</h3>
      <p><strong>Offer Message:</strong></p>
      <p>${offer.replace(/\n/g, '<br>')}</p>
      <hr>
      <p><strong>Buyer Email:</strong> ${userEmail}</p>
      <p>Please reach out to the buyer to discuss further.</p>
      <hr>
      <p>Best regards,<br>MarketPlace Team</p>
    `;

    // Email to buyer
    const buyerEmailContent = `
      <h2>Your Offer Has Been Sent!</h2>
      <p>Your offer for the following product has been successfully sent to the owner:</p>
      <hr>
      <h3>${productTitle}</h3>
      <p><strong>Your Offer:</strong></p>
      <p>${offer.replace(/\n/g, '<br>')}</p>
      <hr>
      <p><strong>Owner Email:</strong> ${ownerEmail}</p>
      <p>The owner will reach out to you soon if they are interested.</p>
      <hr>
      <p>Best regards,<br>MarketPlace Team</p>
    `;

    // Send email to owner
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: ownerEmail,
      subject: `New Offer on "${productTitle}"`,
      html: ownerEmailContent,
    });

    // Send confirmation email to buyer
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: userEmail,
      subject: `Your Offer for "${productTitle}"`,
      html: buyerEmailContent,
    });

    return NextResponse.json(
      { message: 'Offer sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending offer email:', error);
    return NextResponse.json(
      { error: 'Failed to send offer' },
      { status: 500 }
    );
  }
}
