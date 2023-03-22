import { appRouter } from '$lib/utils';
import { createContext } from '$lib/server/api/trpc';
import { createTransport } from 'nodemailer';
import db from '$lib/server/db';
import Email from '@auth/core/providers/email';
import { SvelteKitAuth, type SvelteKitAuthConfig } from '@auth/sveltekit';
import { redirect, type Handle, type HandleServerError, type RequestEvent } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { createTRPCHandle } from 'trpc-sveltekit';
import PrismaAdapter from '$lib/prisma/adapter';
import { logger } from '$lib/server/logger';
import { BUXFER_EMAIL as SERVER_USER, BUXFER_PASS, EMAIL_FROM, SERVER_PASS } from '$env/static/private';

const authorization = () =>
	(async ({ event, resolve }) => {
		await event.locals.getSession();

		if (!event.locals.session && !event.route.id?.includes('anonymous')) {
			throw redirect(302, '/auth/signin');
		}

		return resolve(event);
	}) satisfies Handle;

const getBuxferToken = async (event: RequestEvent) =>
	appRouter.createCaller(await createContext(event)).buxfer.login({
		email: SERVER_USER,
		password: BUXFER_PASS,
	});

const authentication = () =>
	(async (...args) => {
		const [{ event }] = args;
		const authOptions: SvelteKitAuthConfig = {
			adapter: PrismaAdapter(db),
			// the session override fixes a weird bug in the adapter
			// src: https://github.com/nextauthjs/next-auth/issues/6076#issuecomment-1354087465
			session: {
				strategy: 'database',
				generateSessionToken: () => crypto.randomUUID(),
			},
			providers: [
				Email({
					type: 'email',
					id: 'email',
					name: 'Email',
					server: {
						service: 'gmail',
						auth: {
							user: SERVER_USER,
							pass: SERVER_PASS,
						},
					},
					from: EMAIL_FROM,
					async sendVerificationRequest(params) {
						const { identifier, url, provider, theme } = params;
						const { host } = new URL(url);
						const transport = createTransport(provider.server);
						const result = await transport.sendMail({
							to: identifier,
							from: provider.from,
							subject: `Sign in to ${host}`,
							text: text({ url, host }),
							html: html({ url, host, theme }),
						});
						const failed = result.rejected.concat(result.pending).filter(Boolean);

						if (failed.length) {
							throw new Error(`Email (${failed.join(', ')}) could not be sent`);
						}
					},
				}),
			],
			callbacks: {
				async session({ session, user }) {
					if (session.user) {
						session.user = {
							...session.user,
							...user,
							buxferToken: user.account.access_token,
						};
					}
					event.locals.session = session;
					return session;
				},
				async signIn({ user, account }) {
					return Boolean((user.emailVerified || user.isInvited) && account);
				},
			},
			events: {
				async signIn(message) {
					const user = {
						...message.user,
					};
					const account = {
						...user.account,
						...message.account,
					};
					if (!account.access_token) {
						const token = await getBuxferToken(event);

						if (user.isInvited) {
							await db.user.update({
								where: {
									id: user.id,
								},
								data: {
									isInvited: user.isInvited,
								},
							});
						}
						if (account.providerAccountId) {
							db.account.upsert({
								where: {
									provider_providerAccountId: {
										provider: 'buxfer',
										providerAccountId: account.providerAccountId,
									},
								},
								update: {
									access_token: token,
								},
								create: {
									type: 'email',
									provider: 'buxfer',
									providerAccountId: account.providerAccountId,
									access_token: token,
									user: {
										connect: {
											id: user.id,
										},
									},
								},
							});
						}
					}
				},
			},
		};

		return SvelteKitAuth(authOptions)(...args);
	}) satisfies Handle;

export const handle = sequence(
	authentication(),
	authorization(),
	createTRPCHandle({
		router: appRouter,
		createContext,
		onError: ({ type, path, error }) => {
			// TODO - replace with logging collection data service (ex. Sentry).
			logger.error(`Encountered error while trying to process ${type} @ ${path}:`, error);
		},
	})
);

// import * as Sentry from '@sentry/node';

// Sentry.init({
/* ... */
// });

export const handleError = (async ({ error, event }) => {
	const errorId = crypto.randomUUID();
	// example integration with https://sentry.io/
	// Sentry.captureException(error, { event });

	// TODO - replace with logging collection data service (ex. Sentry).
	logger.error((error as Error).message, error, { event, errorId });

	return {
		message: (error as Error).message ?? 'Whoops!',
		code: errorId ?? 'UNKNOWN',
	};
}) satisfies HandleServerError;

/**
 * Email HTML body
 * Insert invisible space into domains from being turned into a hyperlink by email
 * clients like Outlook and Apple mail, as this is confusing because it seems
 * like they are supposed to click on it to sign in.
 *
 * @note We don't add the email address to avoid needing to escape it, if you do, remember to sanitize it!
 */
function html(params: {
	url: string;
	host: string;
	theme: {
		colorScheme?: 'auto' | 'dark' | 'light';
		logo?: string;
		brandColor?: string;
		buttonText?: string;
	};
}) {
	const { url, host, theme } = params;

	const escapedHost = host.replace(/\./g, '&#8203;.');

	// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
	const brandColor = theme.brandColor || '#346df1';
	// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
	const buttonText = theme.buttonText || '#fff';

	const color = {
		background: '#f9f9f9',
		text: '#444',
		mainBackground: '#fff',
		buttonBackground: brandColor,
		buttonBorder: brandColor,
		buttonText,
	};

	return `
<body style="background: ${color.background};">
  <table width="100%" border="0" cellspacing="20" cellpadding="0"
    style="background: ${color.mainBackground}; max-width: 600px; margin: auto; border-radius: 10px;">
    <tr>
      <td align="center"
        style="padding: 10px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        Sign in to <strong>${escapedHost}</strong>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="border-radius: 5px;" bgcolor="${color.buttonBackground}"><a href="${url}"
                target="_blank"
                style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${color.buttonText}; text-decoration: none; border-radius: 5px; padding: 10px 20px; border: 1px solid ${color.buttonBorder}; display: inline-block; font-weight: bold;">Sign
                in</a></td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center"
        style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        If you did not request this email you can safely ignore it.
      </td>
    </tr>
  </table>
</body>
`;
}

/** Email Text body (fallback for email clients that don't render HTML, e.g. feature phones) */
function text({ url, host }: { url: string; host: string }) {
	return `Sign in to ${host}\n${url}\n\n`;
}
