import * as zod from 'zod';

const environmentSchema = zod.object({
  PORT: zod.coerce.number().int().min(1).max(65535).default(3000),
  DB_PATH: zod.string().min(1).default('data/log-analyzer.db'),
});

export const loadEnvironment = () => {
  const { PORT, DB_PATH } = environmentSchema.parse(process.env);
  return { port: PORT, databasePath: DB_PATH };
};
