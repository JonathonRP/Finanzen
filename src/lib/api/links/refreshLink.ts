import type { TRPCLink } from '@trpc/client';
import type { AnyRouter } from '@trpc/server';
import type { Unsubscribable } from '@trpc/server/observable';
import { observable } from '@trpc/server/observable';
import type { RefreshTokenLinkOptions } from './models';

export const refreshTokenLink = (opts: RefreshTokenLinkOptions): TRPCLink<AnyRouter> => {
	const { getRefreshToken, fetchJwtPairByRefreshToken, onJwtPairFetched, onRefreshFailed, onUnauthorized } = opts;

	return () => {
		// app-level state of the refresh flow
		const refreshState: { promise: Promise<void> | null } = {
			promise: null,
		};

		return ({ next, op }) =>
			// on each request
			observable((observer) => {
				let next$: Unsubscribable | null = null;

				function attempt() {
					next$?.unsubscribe();
					next$ = next(op).subscribe({
						async error(err) {
							if (err.data?.code === 'UNAUTHORIZED') {
								// Do something, e.g. remove invalid access token if it's stored
								onUnauthorized?.();

								// Try to get a new jwt pair if the refresh token is stored
								const refreshed = await getRefreshToken(op.context);
								if (refreshed) {
									refreshState.promise = (async () => {
										try {
											// Fetch and store a new jwt pair
											const jwtPair = await fetchJwtPairByRefreshToken(refreshed);
											await onJwtPairFetched?.(op.context, jwtPair, op.context?.user?.email as string | undefined);
										} catch (e) {
											onRefreshFailed?.(e);
											throw e;
										} finally {
											refreshState.promise = null;
										}
									})();

									try {
										await refreshState.promise;
										// Retry original request
										attempt();
									} catch (e) {
										// Don't throw under-the-hood refresh flow's errors
									}
								}
							}

							// Resolve with the original error if...
							// - that wasn't an Unauthorized error
							// - or there was no refresh token stored
							// - or refresh failed
							observer.error(err);
						},
						next(value) {
							observer.next(value);
						},
						complete() {
							observer.complete();
						},
					});
				}

				// Await for the refresh flow to end before firing the next request
				const refreshPromise = refreshState.promise ?? Promise.resolve();
				refreshPromise.finally(() => {
					attempt();
				});

				return () => {
					next$?.unsubscribe();
				};
			});
	};
};
