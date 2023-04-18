import { Strapi } from "@strapi/strapi";
import pluginId from "./pluginId";
import { headTypesConfig } from "../types/config";
import { getService } from "./lib/service";
import { IStrapi } from "strapi-typed";

export default ({ strapi }: { strapi: IStrapi & { entityService: any } }) => {
  // registeration phase
  // Register configuration hooks in the lifecycles of content types
  const headTypesConfigData = strapi.plugin(pluginId).config("headTypes");
  const headTypes = headTypesConfig.parse(headTypesConfigData);
  Object.keys(headTypes).forEach((headTypeName) => {
    const headType = headTypes[headTypeName];
    const { contentTypes } = headType;
    Object.keys(contentTypes).forEach((contentTypeName) => {
      const configContentType = contentTypes[contentTypeName];
      const contentType = strapi.contentType(contentTypeName);
      const revalidationFunction =
        configContentType.revalidateFn ?? (async () => {});

      // register hooks on before create, before update, after update and before delete
      ["beforeCreate", "beforeUpdate", "afterUpdate", "beforeDelete"].forEach(
        (lifecycleName) => {
          const oldFunction =
            contentType.lifecycles[lifecycleName] ?? (() => {});
          contentType.lifecycles[lifecycleName] = async (
            event: {
              action: string;
              model: any;
              params: any;
              result: any;
              state: any;
            },
            ...rest: any[]
          ) => {
            // call the old function
            const result = await oldFunction(event, ...rest);
            // call the revalidation function
            const heads = await getService(strapi, "head").findAllOfType(
              headTypeName
            );
            const entries = event.result ? [event.result] : await strapi.entityService.findMany(contentTypeName, {
              filters: {
                id: event.params.where.id
              },
            });
            await Promise.all(
              heads.map(async (head) => {
                const fields = await getService(strapi, "head").getFieldsObject(
                  head.id
                );
                revalidationFunction(strapi, fields, entries).catch((error) => {
                  console.error(`Error revalidating ${contentTypeName}`, error);
                });
              })
            );
            return result;
          };
        }
      );
    });
  });
};
