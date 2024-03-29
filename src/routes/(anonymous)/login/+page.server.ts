import { signIn } from '@auth/sveltekit/client';
import { redirect } from '@sveltejs/kit';

export const actions = {
	default: async ({ url, request }) => {
		const redirectTo = url.searchParams.get('redirectTo');
		const data = Object.entries(await request.formData());

		signIn('email', { ...data });

		if (redirectTo) {
			throw redirect(302, `/${redirectTo.slice(1)}`);
		}
		throw redirect(302, '/');
	},
};
