import { redirect, fail, error } from '@sveltejs/kit';
import { validateData } from '$/server';
import { object, string } from 'zod';
import { decrypt } from '$lib/utils/cryption';
import { TRPCError } from '@trpc/server';
import { getHTTPStatusCodeFromError } from '@trpc/server/http';
import { appRouter, createCallerFactory } from '$/server/api/root.js';
import { createContext } from '$/server/api/context.js';
import { catchError, delayWhen, tap, throwError } from 'rxjs';

export const actions = {
	default: async (event) => {
		const { url, request } = event;
		const redirectTo = url.searchParams.get('redirectTo');
		const formData = await request.formData();

		const expectLogin = object({
			email: string().email().min(1),
			password: string().transform((val) => decrypt(val)),
		});

		const { data, errors } = await validateData(formData, expectLogin);

		if (errors) {
			return fail(400, { formData: data, errors });
		}
		const { email, password } = data;

		const api = createCallerFactory(appRouter)(createContext(event));
		const login = (await api.buxfer.login({ email, password })).pipe(
			catchError((err) => throwError(() => err)),
			delayWhen((token) => api.user.addBuxferAccount({ accessToken: token })),
			tap((token) =>
				event.cookies.set('x-account_accessToken', token, {
					path: '/',
					httpOnly: true,
					sameSite: true,
					secure: true,
				})
			)
		);
		try {
			const loginResult = await new Promise((resolve, reject) => {
				login.subscribe({
					next: (token) => {
						resolve(token);
					},
					error: (err) => resolve(new Error(err.message, { cause: err })),
				});
			});

			if (loginResult instanceof Error) {
				const errors = { user: [loginResult.message] };
				return fail(400, { errors });
			}
		} catch (err) {
			if (err instanceof TRPCError) {
				const errors = { user: [err.message] };
				return fail(getHTTPStatusCodeFromError(err), { errors });
			}
			return error(500, err);
		}

		return redirect(302, `/${redirectTo?.slice(1)}`);

		// event.setHeaders(AuthorizationHeadersBearerTokenFrom(token));

		// return {
		// 	status: 302,
		// 	headers: {
		// 		Location: location,
		// 		...AuthorizationHeadersBearerTokenFrom(token),
		// 	},
		// };
		// switchMap((token) => {
		// 	setHeaders({ Authorization: `Bearer: ${token}` });
		// 	return api.user.addBuxferAccount({
		// 		access_token: token,
		// 	});
		// })
		// 	)
		// );
		// return Response.json(
		// 	{ url: Location },
		// 	{
		// 		status: 302,
		// 		headers: {
		// 			Location,
		// 		},
		// 	}
		// );
		// const token = apiServer.buxfer.login.ssr(
		// 	{
		// 		email,
		// 		password,
		// 	},
		// 	event
		// );
		// setHeaders({Authorization: `Bearer: ${access}`});
		// event.cookies.set('refresh', refresh, {
		// 	path: '/api/trpc/',
		// 	httpOnly: true,
		// 	maxAge: 60 * 60 * 24 * 120,
		// 	sameSite: 'strict',
		// 	secure: !dev,
		// });
		// setHeaders({ Authorization: `Bearer: ${token}` });
	},
};
