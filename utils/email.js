const nodemailer = require('nodemailer');

const sendEmail = async options => {
  // 1) create a transporter (the service that will send the email like gmail)
  const trasporter = nodemailer.createTransport({
    // service: 'Gmail',
    // auth:{
    //   user:process.env.EMAIL_USERNAME,
    //   pass:process.env.EMAIL_PASSWORD
    // }
    // in the gmail account you will have to activate the "less secure app" option
    // BUT GMAIL IS NOT GOOD FOR THIS, YOU CAN ONLY SENT 500 EMAILS AND YOU WILL BE MARKED AS SPAMMER.

    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  })

  // 2) Define the email options
  const mailOptions = {
    from: 'Mahmood Kadhem <test@kadhem.io>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  }

  // 3) Send the email
  await trasporter.sendMail(mailOptions);

}

module.exports = sendEmail;