import { Id, IStrapi } from "strapi-typed";
import { getService } from "../lib/service";

export default ({ strapi }: { strapi: IStrapi & { entityService: any } }) => ({
  getField: async (headId: Id, key: string) => {
    const field = await strapi.entityService.findMany(
      "plugin::revalidator.head-field",
      {
        filters: {
          head: headId,
          key,
        },
        limit: 1,
      }
    );

    return field?.[0];
  },

  create: async (headId: Id, key: string, value: string) => {
    const field = await strapi.entityService.create(
      "plugin::revalidator.head-field",
      {
        data: {
          head: headId,
          key,
          value,
        },
      }
    );

    return field;
  },

  update: async (headId: Id, key: string, value: string) => {
    const field = await getService(strapi, "head-field").getField(headId, key);
    const newField = await strapi.entityService.update(
      "plugin::revalidator.head-field",
      field.id,
      {
        data: {
          key,
          value,
        },
      }
    );

    return newField;
  },

  deleteById: async (id: Id) => {
    await strapi.entityService.delete("plugin::revalidator.head-field", id);
  },

  delete: async (headId: Id, key: string) => {
    const field = await getService(strapi, "head-field").getField(headId, key);
    await strapi.entityService.delete("plugin::revalidator.head-field", {
      id: field.id,
    });
  },

  upsert: async (headId: Id, key: string, value: string) => {
    const service = getService(strapi, "head-field");
    const field = await service.getField(headId, key);
    if (field) {
      const newField = await service.update(headId, key, value);
      return newField;
    } else {
      const newField = await service.create(headId, key, value);
      return newField;
    }
  },

  upsertOrDelete: async (headId: Id, key: string, value: string | null) => {
    const service = getService(strapi, "head-field");
    if (value === null) {
      const field = await service.getField(headId, key);
      if (field) {
        await service.delete(headId, key);
      }

      return null;
    }
    const newField = await service.upsert(headId, key, value);
    return newField;
  },
});
