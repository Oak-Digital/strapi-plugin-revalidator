import { Id, IStrapi } from "strapi-typed";
import { getService } from "../lib/service";

export default ({ strapi }: { strapi: IStrapi & { entityService: any } }) => ({
  getField: async (headId: Id, key: string) => {
    const field = await strapi.entityService.findMany("plugin::revalidator.head-field", {
      filters: {
        head: headId,
        key,
      },
      limit: 1,
    });

    return field[0];
  },

  update: async (headId: Id, key: string, data: { value: string }) => {
    const field = await getService(strapi, "head-field").getField(headId, key);
    const newField = await strapi.entityService.update("plugin::revalidator.head-field", {
      id: field.id,
      data: {
        key,
        value: data.value,
      },
    });

    return newField;
  }
});
