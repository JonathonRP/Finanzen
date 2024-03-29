import nodemailer from 'nodemailer';
import { logger } from '$lib/server/logger';
import { json } from '@sveltejs/kit';
import { appRouter } from '$lib/server/api';
import { createContext } from '$lib/server/api/trpc';
import { BUXFER_EMAIL as SERVER_USER, EMAIL_FROM, SERVER_PASS, VERCEL_DOMAIN } from '$env/static/private';
import type { RequestHandler } from './$types';

// TODO - evaluate Upstash and Vercel cronjobs alternatives.
const handle = (async ({ url, ...event }) => {
	const transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: SERVER_USER,
			pass: SERVER_PASS,
		},
		secure: true,
	});

	const mailOptions = {
		from: EMAIL_FROM.replace('Finanzen', 'Finanseer'),
		to: (await appRouter.createCaller(await createContext({ ...event, url })).users.retrieve())
			.filter((user) => user.emailVerified)
			.map((user) => user.email ?? ''),
		subject: 'Reminder to check CashFlow',
		text: `Go check your finances!`,
		// eslint-disable-next-line @typescript-eslint/no-use-before-define
		html: html(new URL(`https://${VERCEL_DOMAIN}`) || url),
	};

	await new Promise((resolve, reject) => {
		transporter.sendMail(mailOptions, (error, info) => {
			// TODO - replace with logging collection data service (ex. Sentry).
			if (error) {
				logger.error(error);
				reject(error);
			} else {
				logger.info(info);
				resolve(`Email sent: ${info.response}`);
			}
		});
	});

	return json({ success: true });

	function html(site: URL) {
		const escapedHost = site.host.replace(/\./g, '&#8203;.');

		const brandColor = '#ff3e00';
		const buttonText = '#fff';

		const color = {
			background: '#f9f9f9',
			text: '#444',
			mainBackground: '#fff',
		};
		return `
<body style="background: ${color.background};">
  <table width="100%" border="0" cellspacing="20" cellpadding="0"
    style="background: ${color.mainBackground}; max-width: 600px; margin: auto; border-radius: 10px;">
    <tr>
      <td align="center"
        style="padding: 10px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        Review finances at <strong>${escapedHost}</strong>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="border-radius: 5px;" bgcolor="${brandColor}"><a href="${site.origin}"
                target="_blank"
                style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${buttonText}; text-decoration: none; border-radius: 5px; padding: 10px 20px; border: 1px solid ${brandColor}; display: inline-block; font-weight: bold;">View Finances</a></td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>`;
	}
}) satisfies RequestHandler;

export const GET = handle;
export const POST = handle;
