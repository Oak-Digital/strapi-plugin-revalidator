import { z } from "zod";
import { headTypeConfig } from "./head-type-config";

export const headTypesConfig = z.record(headTypeConfig).optional().default({});

export const configType = z.object({
  headTypes: headTypesConfig,
  defaultHeads: z
    .record(z.array(z.record(z.string())))
    .optional()
    .default({}),
});

export type Config = z.infer<typeof configType>;
