const nodemailer = require("nodemailer");

const smtpTransport = nodemailer.createTransport({
	service: "Mailgun",
	auth: {
		user: "postmaster@availabs.org",
		pass: "6fc3e057cee5b067d6dfdfd7985290d7"
	}
})

module.exports = {
	send: (to, subject, text, html) => {
		const mailOptions = {
			from: "postmaster@availabs.org",
			to,
			subject,
			text,
			html
		}
		return new Promise((resolve, reject) => {
			smtpTransport.sendMail(mailOptions, (error, response) => {
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