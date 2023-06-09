import { z } from "zod";
import { headTypeConfig } from "./head-type-config";

export const headTypesConfig = z.record(headTypeConfig).optional().default({});
export const defaultHeadsConfig = z
  .record(
    z.array(
      /* fields record */ z.object({
      name: z.string().optional(),
      fields: z.record(z.string()).optional().default({}),
    })
    )
  )
  .optional()
  .default({});

export const loggingConfig = z
  .object({
    level: z.enum(["none", "info", "debug"]).optional().default("info"),
  })
  .optional()
  .default({});

export const configType = z.object({
  logging: loggingConfig,
  headTypes: headTypesConfig,
  defaultHeads: defaultHeadsConfig,
});

export type Config = z.infer<typeof configType>;
