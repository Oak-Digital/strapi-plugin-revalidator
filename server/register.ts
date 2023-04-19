import { Strapi } from "@strapi/strapi";
import axios from "axios";
import pluginId from "./pluginId";
import { headTypesConfig } from "../types/config";
import { getService } from "./lib/service";
import { IStrapi } from "strapi-typed";
import { STATE_KEY } from "./lib/constants";

const fallbackRevalidateFn = async (preparedState) => {
  try {
    if (typeof preparedState !== "object") {
      return;
    }
    const { url, method = "POST", body, params } = preparedState;
    if (!url) {
      return;
    }
    await axios({
      url,
      method,
      params,
      data: body,
    })
  } catch (e) {
    console.error(e);
  }
};

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
        configContentType.revalidateFn ?? fallbackRevalidateFn;
      const prepareFunction = configContentType.prepareFn;

      ["beforeUpdate", "beforeDelete"].forEach((lifecycleName) => {
        const oldFunction = contentType.lifecycles[lifecycleName] ?? (() => {});
        contentType.lifecycles[lifecycleName] = async (event) => {
          // find the content type entry
          event.state = { [STATE_KEY]: [] };
          const oldFunctionPromise = oldFunction(event);
          const entryPromise = strapi.entityService.findOne(
            contentTypeName,
            event.params.where.id
          );

          const heads = await getService(strapi, "head").findAllOfType(
            headTypeName
          );
          const entry = await entryPromise;
          if (prepareFunction) {
            await Promise.all(
              heads.map(async (head) => {
                const fields = await getService(strapi, "head").getFieldsObject(
                  head.id
                );
                const entries = await entryPromise;
                const preparedState = await prepareFunction(
                  strapi,
                  fields,
                  entry
                );
                event.state[STATE_KEY].push({
                  head,
                  fields,
                  preparedState,
                });
                /* return { head, preparedState }; */
              })
            );
          }
          await oldFunctionPromise;
        };
      });

      ["afterCreate"].forEach((lifecycleName) => {
        const oldFunction = contentType.lifecycles[lifecycleName] ?? (() => {});
        contentType.lifecycles[lifecycleName] = async (event) => {
          // call the old function
          const result = await oldFunction(event);

          /* const heads = event.state[STATE_KEY].map((state) => state.head); */

          const entry = event.result;
          const heads = await getService(strapi, "head").findAllOfType(
            headTypeName
          );
          if (prepareFunction) {
            await Promise.all(
              heads.map(async (head) => {
                const fields = await getService(strapi, "head").getFieldsObject(
                  head.id
                );
                const preparedState = await prepareFunction(
                  strapi,
                  fields,
                  entry
                );
                await revalidationFunction(preparedState);
              })
            );
          }
          return result;
        };
      });

      ["afterUpdate"].forEach((lifecycleName) => {
        const oldFunction = contentType.lifecycles[lifecycleName] ?? (() => {});
        contentType.lifecycles[lifecycleName] = async (event) => {
          // call the old function
          const result = await oldFunction(event);

          const entry = event.result;
          const heads = await getService(strapi, "head").findAllOfType(
            headTypeName
          );
          // TODO: use state heads
          if (prepareFunction) {
            const revalidatingPromise = Promise.all(
              heads.map(async (head) => {
                const fields = await getService(strapi, "head").getFieldsObject(
                  head.id
                );
                const preparedState = await prepareFunction(
                  strapi,
                  fields,
                  entry
                );
                await revalidationFunction(preparedState);
              })
            );

            const revalidatingBeforePromise = event.state[STATE_KEY].map(
              async (state) => {
                const { head, fields, preparedState } = state;
                await revalidationFunction(preparedState);
              }
            );

            await Promise.all([revalidatingPromise, revalidatingBeforePromise]);
          }

          return result;
        };
      });

      ["afterDelete"].forEach((lifecycleName) => {
        const oldFunction = contentType.lifecycles[lifecycleName] ?? (() => {});
        contentType.lifecycles[lifecycleName] = async (event) => {
          // call the old function
          const result = await oldFunction(event);

          if (prepareFunction) {
            const revalidatingBeforePromise = Promise.all(
              event.state[STATE_KEY].map(async (state) => {
                const { head, fields, preparedState } = state;
                await revalidationFunction(preparedState);
              })
            );

            await revalidatingBeforePromise;
          }
          return result;
        };
      });
    });
  });
};
