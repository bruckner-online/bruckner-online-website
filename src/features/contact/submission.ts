import { getFormDataValues } from "@acdh-oeaw/lib";
import * as v from "valibot";

export interface ContactEmail {
	from: string;
	subject: string;
	text: string;
}

export type ContactSubmissionStatus = "success" | "invalid-input" | "unknown-error";

const schema = v.object({
	name: v.pipe(v.string(), v.nonEmpty()),
	email: v.pipe(v.string(), v.email()),
	message: v.pipe(v.string(), v.nonEmpty()),
	subject: v.pipe(v.string(), v.nonEmpty()),
});

/** Owns parsing, validation, message construction, and delivery outcomes. */
export async function submitContact(
	request: Pick<Request, "formData">,
	options: {
		sendEmail: (message: ContactEmail) => Promise<unknown>;
		logger?: Pick<Console, "error">;
	},
): Promise<ContactSubmissionStatus> {
	try {
		const data = getFormDataValues(await request.formData());
		const result = v.safeParse(schema, data);
		if (!result.success) {
			return "invalid-input";
		}
		const { name, email, message, subject } = result.output;
		await options.sendEmail({ from: `${name} <${email}>`, subject, text: message });
		return "success";
	} catch (error) {
		if (error instanceof Error) {
			(options.logger ?? console).error(error.message);
		}
		return "unknown-error";
	}
}
