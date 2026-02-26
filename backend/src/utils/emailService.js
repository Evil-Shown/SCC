import nodemailer from "nodemailer";

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

export const sendKuppiNotificationEmail = async (to, kuppiDetails) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Smart Campus Companion" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: `Kuppi Scheduled: ${kuppiDetails.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Kuppi Session Scheduled!</h2>
          <p>Great news! The Kuppi session you applied for has been scheduled.</p>
          
          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1F2937;">${kuppiDetails.title}</h3>
            <p style="margin: 10px 0;"><strong>Description:</strong> ${kuppiDetails.description}</p>
            <p style="margin: 10px 0;"><strong>Date & Time:</strong> ${new Date(kuppiDetails.eventDate).toLocaleString()}</p>
            ${kuppiDetails.meetingLink ? `
              <p style="margin: 10px 0;"><strong>Meeting Link:</strong></p>
              <a href="${kuppiDetails.meetingLink}" 
                 style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; 
                        text-decoration: none; border-radius: 5px; margin-top: 10px;">
                Join Meeting
              </a>
            ` : ''}
          </div>
          
          <p style="color: #6B7280; font-size: 14px;">
            Please make sure to attend on time. If you have any questions, feel free to reach out.
          </p>
          
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
          <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
            Smart Campus Companion - Making campus life easier
          </p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
};

export const sendNoteCommentEmail = async (to, noteDetails, commentDetails) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Smart Campus Companion" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: `New comment on your note: ${noteDetails.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">New Comment on Your Note</h2>
          <p><strong>${commentDetails.userName}</strong> commented on your note:</p>
          
          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1F2937;">${noteDetails.title}</h3>
            <p style="font-style: italic; color: #6B7280;">"${commentDetails.commentText}"</p>
          </div>
          
          <p style="color: #6B7280; font-size: 14px;">
            Check out the full discussion on your note!
          </p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Error sending comment email:", error);
    return { success: false, error: error.message };
  }
};

export default {
  sendKuppiNotificationEmail,
  sendNoteCommentEmail
};
