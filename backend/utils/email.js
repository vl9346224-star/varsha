const nodemailer = require("nodemailer");

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT || "587", 10),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // Development fallback: simulated transporter
    transporter = {
      sendMail: async (options) => {
        console.log("-----------------------------------------");
        console.log("📧 [SIMULATED EMAIL NOTIFICATION SENT]");
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Body: ${options.text || options.html}`);
        console.log("-----------------------------------------");
        return { messageId: "simulated-" + Date.now() };
      },
    };
  }
  return transporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const t = await getTransporter();
    const info = await t.sendMail({
      from: `"Campus Lost & Found Portal" <${process.env.EMAIL_FROM || "lostfound@college.edu"}>`,
      to,
      subject,
      text: text || html,
      html: html || `<p>${text}</p>`,
    });
    return info;
  } catch (err) {
    console.error("Email send failed:", err.message);
    return null;
  }
};

exports.sendEmail = sendEmail;

exports.sendClaimAlertEmail = async (owner, claimant, item, claim) => {
  return sendEmail({
    to: owner.email,
    subject: `[Campus Lost&Found] New Ownership Claim on "${item.title}"`,
    text: `Hello ${owner.name},\n\nA student (${claimant.name}, Roll: ${claimant.rollNumber || "N/A"}) has submitted an ownership claim for the item "${item.title}".\n\nProof Provided:\n${claim.proofDescription}\n\nPlease log in to review the claim.\n\nCampus Lost & Found Team`,
  });
};

exports.sendClaimDecisionEmail = async (claimant, item, isApproved, remarks) => {
  return sendEmail({
    to: claimant.email,
    subject: `[Campus Lost&Found] Claim ${isApproved ? "Approved" : "Rejected"} for "${item.title}"`,
    text: `Hello ${claimant.name},\n\nYour claim on "${item.title}" has been ${isApproved ? "APPROVED" : "REJECTED"}.\n\nRemarks from reporter:\n${remarks || (isApproved ? "Verification successful." : "Insufficient proof.")}\n\nCampus Lost & Found Team`,
  });
};

exports.sendMatchAlertEmail = async (user, item) => {
  return sendEmail({
    to: user.email,
    subject: `[Campus Lost&Found] Possible Match Reported: "${item.title}"`,
    text: `Hello ${user.name},\n\nA new ${item.type} item "${item.title}" in category "${item.category}" was recently reported near ${item.location}. It may match your existing report.\n\nCheck the portal for details.\n\nCampus Lost & Found Team`,
  });
};
