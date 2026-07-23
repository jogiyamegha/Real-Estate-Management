const {GeneralMessages} = require("../utils/constants");
const path = require("path");
const fs = require("fs");
const customViewsDirPath = path.join(__dirname, "../templates");
const nodemailer = require("nodemailer");

exports.sendForgotPasswordEmail = async (emailId, code) => {
    const resetPasswordTemplate = fs
    .readFileSync(path.join(customViewsDirPath, "admin", "forgot_password.hbs"))
    .toString();
    let data = {
        code: code,
    };
    const template = Handlebars.compile(resetPasswordTemplate);
    try {
        await sendEmail(emailId, GeneralMessages.forgotPasswordEmailSubject, template(data));
    } catch (e) {
        console.log(e);
    }
};



function createHyperLinkTag(title, url) {
    return `<a href="${url}">${title}</a>`;
}

async function sendEmail(receiverEmail, subject, htmlBodyContents, fromAddress = "Onward") {
    let transporter = getTransportInfo();
    let mailOptions = {
        from: fromAddress,
        to: receiverEmail,
        subject: subject,
        html: htmlBodyContents,
    };
    if (process.env.disableEmail == true || process.env.disableEmail == "true") {
        return;
    }
    await transporter.sendMail(mailOptions);
}
function getTransportInfo() {
    return nodemailer.createTransport({
        host: process.env.SMTP_SERVER,
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER, //smtpUsername
            pass: process.env.SMTP_PASS, //smtpPassword
        },
    });
}
