import { assert } from "@acdh-oeaw/lib";
import { createTransport } from "nodemailer";

import { env } from "@/config/env.config";
import type { ContactEmail } from "@/features/contact/submission";

export function sendContactEmail({ from, subject, text }: ContactEmail) {
	assert(env.EMAIL_SMTP_SERVER, "Invalid email configuration.");
	assert(env.EMAIL_SMTP_PORT, "Invalid email configuration.");
	assert(env.EMAIL_CONTACT_ADDRESS, "Invalid email configuration.");

	const transporter = createTransport({
		host: env.EMAIL_SMTP_SERVER,
		port: env.EMAIL_SMTP_PORT,
		secure: false,
		auth:
			env.EMAIL_SMTP_USERNAME && env.EMAIL_SMTP_PASSWORD
				? {
						user: env.EMAIL_SMTP_USERNAME,
						pass: env.EMAIL_SMTP_PASSWORD,
					}
				: undefined,
	});

	return transporter.sendMail({
		from,
		to: env.EMAIL_CONTACT_ADDRESS,
		subject,
		text,
	});
}
