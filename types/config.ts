import { z } from "zod";
import { headTypeConfig } from "./head-type-config";

export const configType = z.object({
  headTypes: z.record(headTypeConfig).optional(),
  defaultHeads: z.record(z.array(z.record(z.string()))).optional(),
});

export type Config = z.infer<typeof configType>;
