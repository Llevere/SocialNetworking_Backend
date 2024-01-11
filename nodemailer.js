import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: true, // STARTTLS is used, so set secure to true
    auth: {
      user: 'MattsSocialProject@hotmail.com',
      pass: 'Levere94!!',
    },
  });

export default transporter;