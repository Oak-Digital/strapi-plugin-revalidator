import { z } from "zod";

const revalidateOn = z.record(
  z.object({
    ifReferenced: z.boolean().optional(),
    revalidationType: z.enum(["hard", "soft"]).default("hard"),
    predicate: z.function().optional(),
  })
);

const fieldTypeType = z.enum(["string"]);

const fieldType = z.object({
  type: fieldTypeType.optional(),
});

export const headTypeConfig = z.object({
  fields: z.record(fieldType).optional(),

  contentTypes: z
    .record(
      z.object({
        revalidateOn: z
          .record(z.union([revalidateOn, z.array(revalidateOn)]))
          .optional(),
      })
    )
    .optional(),
});

export type HeadTypeConfig = z.infer<typeof headTypeConfig>;
