import type { Prisma } from '../../generated/prisma/client.js';

/** Mandatory predicate for current actionable views; historical queries deliberately omit it. */
export const actionableWorkflowRunWhere = {
  workflow: { lifecycleState: { notIn: ['DISABLED', 'REMOVED'] } },
} satisfies Prisma.WorkflowRunWhereInput;
