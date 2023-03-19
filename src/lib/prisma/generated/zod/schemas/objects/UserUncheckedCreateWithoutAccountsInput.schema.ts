import { z } from 'zod';
import { RoleSchema } from '../enums/Role.schema';
import { SessionUncheckedCreateNestedManyWithoutUserInputObjectSchema } from './SessionUncheckedCreateNestedManyWithoutUserInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.UserUncheckedCreateWithoutAccountsInput> = z
	.object({
		id: z.string().optional(),
		name: z.string().optional().nullable(),
		email: z.string().optional().nullable(),
		emailVerified: z.date().optional().nullable(),
		isInvited: z.boolean().optional(),
		image: z.string().optional().nullable(),
		role: z.lazy(() => RoleSchema).optional(),
		sessions: z.lazy(() => SessionUncheckedCreateNestedManyWithoutUserInputObjectSchema).optional(),
	})
	.strict();

export const UserUncheckedCreateWithoutAccountsInputObjectSchema = Schema;