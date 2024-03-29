import { error, type HttpError } from '@sveltejs/kit';
import { format } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import path from 'path';
import { array, number, object, string, union, z, never, coerce, date } from 'zod';
import { logger } from './logger';

const DateFormat = 'yyyy-MM-dd';

type BuxferResponse = {
	response: BuxferData;
	error?: BuxferError;
};

type BuxferData = z.infer<typeof buxferResponse>;

type BuxferError = {
	type: string;
	message: string;
};

export const buxferToken = string();

export const buxferAccounts = array(
	object({
		id: number(),
		name: string(),
		bank: string(),
		balance: number(),
	})
);

export const buxferTransactions = object({
	totalTransactionsCount: coerce
		.number()
		.default(0)
		.optional()
		.transform((count) => count ?? 0),
	transactions: array(
		object({
			id: number(),
			description: string(),
			date: string()
				.or(date())
				.transform((arg) => utcToZonedTime(arg, '+18:00')),
			type: string(),
			amount: number(),
			accountId: number(),
			tags: string(),
		})
	),
});

const tokenResponse = object({
	token: string(),
	accounts: never().optional(),
	numTransactions: never().optional(),
	transactions: never().optional(),
});

const accountsResponse = object({
	token: never().optional(),
	accounts: array(
		object({
			id: number(),
			description: string(),
			date: string(),
			type: string(),
			amount: number(),
			accountId: number(),
			tags: string(),
		})
	),
	numTransactions: never().optional(),
	transactions: never().optional(),
});

const transactionsResponse = object({
	token: never().optional(),
	accounts: never().optional(),
	numTransactions: string(),
	transactions: array(
		object({
			id: number(),
			description: string(),
			date: string(),
			type: string(),
			amount: number(),
			accountId: number(),
			tags: string(),
		})
	),
});

const buxferResponse = union([tokenResponse, accountsResponse, transactionsResponse]);

export const buxferLoginAccount = object({
	email: string(),
	password: string(),
});

export const buxferTransactionsQuery = object({
	startDate: date(),
	endDate: date(),
	cursor: number().nullish().default(1),
});

const buxferTransactionsQueryInternal = object({
	token: buxferToken,
	startDate: date().transform((arg) => format(arg, DateFormat)),
	endDate: date().transform((arg) => format(arg, DateFormat)),
	page: coerce.string(),
});

const prefix = 'api';

const apis = {
	login: 'login',
	accounts: 'accounts',
	transactions: 'transactions',
} as const;

const routes = new Map<string, string>([
	[apis.login, path.join(prefix, apis.login)],
	[apis.accounts, path.join(prefix, apis.accounts)],
	[apis.transactions, path.join(prefix, apis.transactions)],
]);

const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

const BuxferDomain = 'https://www.buxfer.com';

const buxferProxy = async (
	endpoint: keyof typeof apis,
	body:
		| z.infer<typeof buxferLoginAccount>
		| (z.infer<typeof buxferTransactionsQueryInternal> & { token: z.infer<typeof buxferToken> })
		| { token: z.infer<typeof buxferToken> }
) => {
	const buxferConfig = {
		method: 'POST',
		headers: {
			...headers,
		},
		body: new URLSearchParams(body),
	} as RequestInit;

	const rerouteURL = new URL(routes.get(endpoint) ?? <never>null, BuxferDomain);
	const request = new Request(rerouteURL, buxferConfig);

	try {
		const resp = await fetch(request);

		if (!resp.ok)
			// eslint-disable-next-line @typescript-eslint/no-throw-literal
			throw error(resp.status, {
				code: crypto.randomUUID(),
				message: ((await resp.json()) as BuxferResponse).error?.message || '',
			});

		const { response } = <BuxferResponse>await resp.json();
		return response;
	} catch (e) {
		const err = e as HttpError;
		// TODO - replace with logging collection data service (ex. Sentry).
		logger.error('fetchError: ', err);
		// eslint-disable-next-line @typescript-eslint/no-throw-literal
		throw error(err.status || 500, err.body);
	}
};

export function BuxferClient(token: z.infer<typeof buxferToken> | null | undefined) {
	return {
		async login(input: z.infer<typeof buxferLoginAccount>) {
			if (token) {
				return token;
			}
			const { token: refreshedToken } = await buxferProxy('login', buxferLoginAccount.parse(input));
			return buxferToken.parse(refreshedToken);
		},

		async accounts() {
			const { accounts } = await buxferProxy('accounts', { token: buxferToken.parse(token) });
			return buxferAccounts.parse(accounts);
		},

		async transactions(input: z.infer<typeof buxferTransactionsQuery>) {
			const { startDate, endDate, cursor } = input;
			const { numTransactions: totalTransactionsCount, transactions } = await buxferProxy(
				'transactions',
				buxferTransactionsQueryInternal.parse({
					token,
					startDate,
					endDate,
					page: cursor,
				})
			);

			return buxferTransactions.parse({ transactions, totalTransactionsCount });
		},
	};
}
