const nodemailer = require("nodemailer");
const auth = require("./mailgun.json");

const smtpTransport = nodemailer.createTransport({
	service: "Mailgun",
	auth
})

module.exports = {
	send: (to, subject, text, html) => {
		const mailOptions = {
			from: auth.user,
			to,
			subject,
			text,
			html
		}
		return new Promise((resolve, reject) => {
			smtpTransport.sendMail(mailOptions, (error, response) => {
console.log("MAILGUNNED?", error, response)
				if (error) {
					reject(error);
				}
				else {
					resolve("Email sent.");
				}
			})
		})
	}
}
