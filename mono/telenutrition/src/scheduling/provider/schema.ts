import { z } from 'zod';

export const TaskPriority = z.enum(['low', 'medium', 'high']);
