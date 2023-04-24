import { IStrapi, StrapiRequestContext } from "strapi-typed";
import { getService } from "../lib/service";
import { z } from "zod";

export default ({ strapi }: { strapi: IStrapi & { entityService: any } }) => ({
  findOne: async (ctx: StrapiRequestContext) => {
    const head = await getService(strapi, "head").findOne(ctx.params.id);
    ctx.send(head);
  },

  findMany: async (ctx: StrapiRequestContext) => {
    // TODO: use try catch here
    const { query = {} } = ctx;
    console.log("query", query);
    const heads = await getService(strapi, "head").findMany(query);
    ctx.send(heads);
  },

  create: async (ctx: StrapiRequestContext) => {
    const { body = {} } = ctx.request;

    const initialValidHeadTypes: string[] = getService(
      strapi,
      "head-type"
    ).getHeadTypesKeys();

    if (initialValidHeadTypes.length === 0) {
      ctx.badRequest("No head types are configured");
      return;
    }

    const validHeadTypes = initialValidHeadTypes as [string, ...string[]];

    const schema = z.object({
      title: z.string().optional(),
      headType: z.enum(validHeadTypes),
    });
    // check that the headType exists
    const parsed = schema.parse(body);

    // check that the field keys are given
    const fieldKeys: string[] = getService(strapi, "head-type").getFieldKeys(
      parsed.headType
    );
    const schemaWithFields = schema.extend({
      fields: z
        .object(
          fieldKeys.reduce((acc, key) => {
            acc[key] = z.string().optional();
            return acc;
          }, {})
        )
        .default({}),
    });

    const parsedWithFields = schemaWithFields.parse(body);

    // create the head
    const head = await getService(strapi, "head").create(parsedWithFields);

    ctx.send(head);
  },

  update: async (ctx: StrapiRequestContext) => {
    const { body = {} } = ctx.request;
    const { id } = ctx.params;

    const initialValidHeadTypes: string[] = getService(
      strapi,
      "head-type"
    ).getHeadTypesKeys();

    if (initialValidHeadTypes.length === 0) {
      ctx.badRequest("No head types are configured");
      return;
    }

    const validHeadTypes = initialValidHeadTypes as [string, ...string[]];

    const schema = z.object({
      title: z.string().optional(),
      headType: z.enum(validHeadTypes),
    });
    // check that the headType exists
    const parsed = schema.parse(body);

    // check that the field keys are given
    const fieldKeys: string[] = getService(strapi, "head-type").getFieldKeys(
      parsed.headType
    );
    const schemaWithFields = schema.extend({
      fields: z
        .object(
          fieldKeys.reduce((acc, key) => {
            acc[key] = z.union([z.null(), z.string()]).optional();
            return acc;
          }, {})
        )
        .default({}),
    });

    let parsedWithFields: z.infer<typeof schemaWithFields>;
    try {
      parsedWithFields = schemaWithFields.parse(body);
    } catch (e) {
      return ctx.badRequest(e?.message ?? "Some data is invalid");
    }

    // update the head
    const head = await getService(strapi, "head").update(id, parsedWithFields);

    ctx.send(head);
  },

  delete: async (ctx: StrapiRequestContext) => {
    const { id } = ctx.params;
    await getService(strapi, "head").delete(id);
    ctx.send({ id });
  },
});
