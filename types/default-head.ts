import { z } from "zod";

export const defaultHead = z.object({
  headType: z.string(),
  name: z.string().optional(),
  fields: z.record(z.string()),
})

export type DefaultHead = z.infer<typeof defaultHead>;
