import type { inferProcedureOutput, inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { router } from './trpc';
import { buxferRouter } from './routers/buxfer';
import { exampleRouter } from './routers/example';
import { userRouter } from './routers/user';
import { usersRouter } from './routers/users';
import { loggerRouter } from './routers/logger';

export const appRouter = router({
	example: exampleRouter,
	buxfer: buxferRouter,
	user: userRouter,
	users: usersRouter,
	logger: loggerRouter,
});

export type AppRouter = typeof appRouter;

// 👇 type helpers 💡
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

export type Accounts = inferProcedureOutput<AppRouter['buxfer']['accounts']>;
export type Transactions = inferProcedureOutput<AppRouter['buxfer']['transactions']>['transactions'];
