import { Id, IStrapi } from "strapi-typed";
import { getService } from "../lib/service";

export default ({ strapi }: { strapi: IStrapi & { entityService: any } }) => ({
  findOne: async (id: Id) => {
    const head = await strapi.entityService.findOne(
      "plugin::revalidator.head",
      id,
      {
        populate: {
          fields: true,
        },
      }
    );

    return head;
  },

  findMany: async (query: any) => {
    const heads = strapi.entityService.findPage(
      "plugin::revalidator.head",
      query
    );
    return heads;
  },

  findAllOfType: async (headType: string) => {
    const defaultHeads = await getService(strapi, "default-head").findManyOfType(headType);
    const heads = await strapi.entityService.findMany(
      "plugin::revalidator.head",
      {
        filter: {
          headType,
        },
      }
    );

    return heads;
  },

  // Get the fields of a head from the db
  getFields: async (headId: Id) => {
    // find the head
    const head = await getService(strapi, "head").findOne(headId);

    // check the type of the head
    const headType = head.headType;

    // TODO: If the headtype is invalid, throw an error or return an empty array

    // get the fields from the config
    const fieldKeys: string[] = getService(strapi, "head-type").getFieldKeys(
      headType
    );

    // get the fields
    const fields = await Promise.all(
      fieldKeys.map(async (key) => {
        const field = await getService(strapi, "head-field").getField(
          headId,
          key
        );
        return field;
      })
    );

    return fields;
  },

  getFieldsObject: async (headId: Id) => {
    const service = getService(strapi, "head");
    const fields = await service.getFields(headId);

    return fields.reduce((acc, field) => {
      acc[field.key] = field.value;
      return acc;
    }, {});
  },

  create: async (data: {
    headType: string;
    title?: string;
    fields: Record<string, string>;
  }) => {
    const head = await strapi.entityService.create("plugin::revalidator.head", {
      data: {
        title: data.title,
        headType: data.headType,
      },
    });

    // create the fields
    const fields = await Promise.all(
      Object.keys(data.fields).map(async (key) => {
        const field = await getService(strapi, "head-field").create(
          head.id,
          key,
          data.fields[key]
        );
        return field;
      })
    );

    console.log(fields);

    return head;
  },

  update: async (
    id: Id,
    data: {
      title?: string;
      fields: Record<string, string>;
    }
  ) => {
    const head = await strapi.entityService.update(
      "plugin::revalidator.head",
      id,
      {
        data: {
          title: data.title,
        },
      }
    );

    // update or create the fields
    const fields = await Promise.all(
      Object.keys(data.fields).map(async (key) => {
        const field = await getService(strapi, "head-field").upsertOrDelete(
          id,
          key,
          data.fields[key]
        );
        return field;
      })
    );

    return head;
  },

  delete: async (id: Id) => {
    const service = getService(strapi, "head");
    const fieldService = getService(strapi, "head-field");
    // delete the head
    const head = await strapi.entityService.delete(
      "plugin::revalidator.head",
      id,
      {
        populate: {
          fields: true,
        },
      }
    );
    /* const head = await service.findOne(id); */

    // const delete the head's fields
    await Promise.all(head.fields?.map(async (field: any) => {
      /* console.log(`deleting field ${field.id}`) */
      await fieldService.deleteById(field.id);
    }));

    return head;
  },
});
