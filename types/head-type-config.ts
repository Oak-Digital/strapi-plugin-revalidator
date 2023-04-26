import { z } from "zod";

const revalidateOn = z
  .object({
    ifReferenced: z.boolean().optional().default(false),
    revalidationType: z.enum(["hard", "soft"]).default("hard"),
    predicate: z.function().returns(z.boolean()).optional(),
    /* .default(() => true), */
  })
  .default({});
export type RevalidateOn = z.infer<typeof revalidateOn>;

const fieldTypeType = z.enum(["string"]);

const fieldType = z.object({
  type: fieldTypeType.optional(),
});

export const contentTypeConfig = z.object({
  revalidateOn: z
    .record(z.union([revalidateOn, z.array(revalidateOn)]))
    .optional()
    .default({}),
  prepareFn: z
    .function()
    .args(/* Strapi */ z.any(), /* Fields */ z.any(), /* Model */ z.any())
    .returns(z.promise(/* Prepared state */ z.any()))
    .optional(),
  revalidateFn: z
    .function()
    .args(/* Prepared state */ z.any())
    .returns(z.promise(z.any()))
    .optional(),
});
export type ContentTypeConfig = z.infer<typeof contentTypeConfig>;

export const contentTypesConfig = z
  .record(contentTypeConfig)
  .optional()
  .default({});
export type ContentTypesConfig = z.infer<typeof contentTypesConfig>;

export const headTypeConfig = z.object({
  fields: z.record(fieldType).optional().default({}),

  contentTypes: contentTypesConfig,
});

export type HeadTypeConfig = z.infer<typeof headTypeConfig>;
