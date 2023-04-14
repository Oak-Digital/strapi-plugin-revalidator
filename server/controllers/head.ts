import { IStrapi, StrapiRequestContext } from "strapi-typed";
import { getService } from "../lib/service";
import { z } from "zod";

export default ({ strapi }: { strapi: IStrapi & { entityService: any } }) => ({
  findMany: async (ctx) => {
    try {
      const heads = await getService(strapi, "head").findMany();
      ctx.send(heads);
    } catch (err) {
      ctx.status = err.status || 500;
      ctx.body = err.message;
      ctx.app.emit("error", err, ctx);
    }
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
      fields: z.object(
        fieldKeys.reduce((acc, key) => {
          acc[key] = z.string();
          return acc;
        }, {})
      ),
    });

    const parsedWithFields = schemaWithFields.parse(body);

    // create the head
    const head = await getService(strapi, "head").create(parsedWithFields);
  },

  update: async (ctx: StrapiRequestContext) => {
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
      fields: z.object(
        fieldKeys.reduce((acc, key) => {
          acc[key] = z.string();
          return acc;
        }, {})
      ),
    });

    const parsedWithFields = schemaWithFields.parse(body);

    // create the head
    const head = await getService(strapi, "head").update(parsedWithFields);
  },

  delete: async (ctx: StrapiRequestContext) => {},
});
