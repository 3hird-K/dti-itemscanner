import nodemailer from "nodemailer";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { subject, message, category, userEmail, userName } = await request.json();

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      );
    }

    // Create email transporter (using Gmail or your email service)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SUPPORT_EMAIL,
        pass: process.env.SUPPORT_EMAIL_PASSWORD,
      },
    });

    // Email to admin/support
    const adminEmailContent = `
      <h2>New Support Ticket Received</h2>
      <p><strong>Category:</strong> ${category}</p>
      <p><strong>From:</strong> ${userName} (${userEmail})</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <hr />
      <h3>Message:</h3>
      <p>${message.replace(/\n/g, "<br />")}</p>
    `;

    // Send to admin
    await transporter.sendMail({
      from: process.env.SUPPORT_EMAIL,
      to: process.env.SUPPORT_EMAIL, // Your support email
      subject: `[${category.toUpperCase()}] ${subject}`,
      html: adminEmailContent,
      replyTo: userEmail,
    });

    // Confirmation email to user
    const userEmailContent = `
      <h2>Support Ticket Received</h2>
      <p>Hi ${userName},</p>
      <p>Thank you for reaching out! We've received your support ticket and will get back to you within 24 hours.</p>
      <hr />
      <p><strong>Your Ticket Details:</strong></p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Category:</strong> ${category}</p>
      <p>Ticket Reference: DTI-${Date.now()}</p>
      <hr />
      <p>Best regards,<br/>DTI Support Team</p>
    `;

    await transporter.sendMail({
      from: process.env.SUPPORT_EMAIL,
      to: userEmail,
      subject: "Support Ticket Confirmation - DTI QR Scanner",
      html: userEmailContent,
    });

    return NextResponse.json(
      { message: "Support ticket sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending support email:", error);
    return NextResponse.json(
      { error: "Failed to send support ticket" },
      { status: 500 }
    );
  }
}
