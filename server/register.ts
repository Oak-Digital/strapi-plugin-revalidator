import { Strapi } from "@strapi/strapi";
import axios from "axios";
import pluginId from "./pluginId";
import { headTypesConfig } from "../types/config";
import { getService } from "./lib/service";
import { Id, IStrapi } from "strapi-typed";
import { STATE_KEY } from "./lib/constants";
import { RevalidateOn } from "../types/head-type-config";
import { get, set } from "lodash";
import { contentTypeDynamicZoneWithRelationPaths, contentTypeRelationPaths } from "./lib/relations";

// TODO: refactor this file

const fallbackRevalidateFn = async (preparedState: any) => {
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
    });
  } catch (e) {
    console.error(e);
  }
};


const pathToObjectWithId = (path: string, id: Id) => {
  const obj = set({}, `${path}.id`, id);
  return obj;
};

type RevalidateOther = Record<string, Record<string, Array<RevalidateOn>>>;
type RevalidateObject = Record<
  string,
  {
    revalidate: Set<Id>;
    softRevalidate: Set<Id>;
  }
>;

type RevalidatieOnlyObject = Record<string, Set<Id>>;

const revalidateObjectToRevalidateOnlyObject = (
  revalidateObject: RevalidateObject
): RevalidatieOnlyObject => {
  const revalidateOnlyObject: RevalidatieOnlyObject = {};
  Object.keys(revalidateObject).forEach((key) => {
    revalidateOnlyObject[key] = new Set();
    revalidateObject[key].revalidate.forEach((id) => {
      revalidateOnlyObject[key].add(id);
    });
    revalidateObject[key].softRevalidate.forEach((id) => {
      revalidateOnlyObject[key].add(id);
    });
  });
  return revalidateOnlyObject;
};

const mergeRevalidationObjects = (objects: RevalidateObject[]) => {
  const merged: RevalidateObject = {};
  objects.forEach((object) => {
    Object.keys(object).forEach((key) => {
      if (!merged[key]) {
        merged[key] = {
          revalidate: new Set(),
          softRevalidate: new Set(),
        };
      }
      object[key].softRevalidate.forEach((id) => {
        merged[key].softRevalidate.add(id);
      });
      object[key].revalidate.forEach((id) => {
        merged[key].revalidate.add(id);
        merged[key].softRevalidate.delete(id);
      });
    });
  });
  return merged;
};

// the point of this function is to signal that the content type needs to revalidate
// This should return an array or an object with other entries or content types that needs to revalidate
const findEntriesToRevalidate = async (
  strapi: Strapi,
  contentTypeName: string,
  entryId: Id, // entry beign revalidated
  revalidateOther: RevalidateOther
) => {
  const rules = revalidateOther[contentTypeName];
  const revalidationObject: RevalidateObject = {};
  await Promise.all(
    Object.keys(rules).map(async (otherContentTypeName) => {
      const rulesForContentType = rules[otherContentTypeName];
      const idsToRevalidate = new Set<Id>();
      const idsToSoftRevalidate = new Set<Id>();
      await Promise.all(
        rulesForContentType.map(async (rule) => {
          const { ifReferenced, predicate, revalidationType } = rule;
          const idsToRevalidateForRule =
            revalidationType === "soft" ? idsToSoftRevalidate : idsToRevalidate;
          let entries: { id: Id }[];
          if (ifReferenced) {
            // find all entries that reference this entry
            const paths = contentTypeRelationPaths(
              strapi,
              contentTypeName,
              otherContentTypeName
            );
            const pathsWithId = paths.map((path) => {
              return pathToObjectWithId(path, entryId);
            });
            const stringPathsWithId = paths.map((path) => `${path}.id`);

            /* console.log(paths, pathsWithId); */

            entries = await strapi.entityService.findMany(
              otherContentTypeName,
              {
                fields: ["id"],
                filters: {
                  /* $and: [ */
                  /*   { */
                  $or: [
                    // we need this rule, else it is trying to find ALL entries, if there is no paths
                    {
                      id: {
                        $in: [],
                      },
                    },
                    ...pathsWithId,
                  ],
                  /* }, */
                  // TODO: test if this works, to get fewer query results
                  /* { */
                  /*   id: { */
                  /*     $notIn: Array.from(idsToRevalidate), */
                  /*   } */
                  /* } */
                  /* ], */
                },
              }
            );

            const dynamiczonePaths = contentTypeDynamicZoneWithRelationPaths(strapi, contentTypeName, otherContentTypeName);
            const dynamiczonePopulatePaths = dynamiczonePaths.map((path) => {
              const [attributeName, componentAndPath] = path.split("::");
              const [componentCategory, componentName, ...restPath] = componentAndPath.split(".");
              return [attributeName, ...restPath].join(".");
            });
            const dynamiczoneEntries = await strapi.entityService.findMany(
              otherContentTypeName,
              {
                fields: ["id"],
                populate: dynamiczonePopulatePaths,
              }
            );
            const filteredDynamiczoneEntries = dynamiczoneEntries.filter((entry) => {
              // filter for each attribute
              // filter for each component

              return dynamiczonePaths.some((path) => {
                const [attributeName, componentAndPath] = path.split("::");
                const [componentCategory, componentName, ...restPath] = componentAndPath.split(".");
                const componentPath = restPath.join(".");
                const attribute = entry[attributeName];
                return attribute.some((component: any) => {
                  const id = get(component, `${componentPath}.id`);
                  return component.__component === `${componentCategory}.${componentName}` && id === entryId;
                });
              });
            })
            entries.push(...filteredDynamiczoneEntries);
          } else {
            entries = await strapi.entityService.findMany(
              otherContentTypeName,
              {
                fields: ["id"],
              }
            );
          }
          entries.forEach((entry) => {
            idsToRevalidateForRule.add(entry.id);
          });
        })
      );

      idsToRevalidate.forEach((id) => {
        idsToSoftRevalidate.delete(id);
      });

      revalidationObject[otherContentTypeName] = {
        revalidate: idsToRevalidate,
        softRevalidate: idsToSoftRevalidate,
      };
    })
  );

  return revalidationObject;
};

const findAllEntriesToRevalidate = async (
  strapi: Strapi,
  contentTypeName: string,
  entryId: string,
  revalidateOther: RevalidateOther
) => {
  const checked: RevalidateObject = {};
  let allEntriesToRevalidate: RevalidateObject = {
    [contentTypeName]: {
      revalidate: new Set([entryId]),
      softRevalidate: new Set(),
    },
  };

  // check all entries in allEntriesToRevalidate and add them to checked
  // keep track of which entries need to be checked
  // if there are no more entries to check, return checked

  const queue: [string, Id][] = [[contentTypeName, entryId]];

  while (queue.length > 0) {
    const [contentTypeName, entryId] = queue.pop()!; // at this point we know that the queue is not empty since we just checked
    if (!checked[contentTypeName]) {
      checked[contentTypeName] = {
        revalidate: new Set(),
        softRevalidate: new Set(),
      };
    }
    if (checked[contentTypeName].revalidate.has(entryId)) {
      continue;
    }
    const entries = await findEntriesToRevalidate(
      strapi,
      contentTypeName,
      entryId,
      revalidateOther
    );
    Object.keys(entries).forEach((contentTypeName) => {
      entries[contentTypeName].revalidate.forEach((id) => {
        if (checked[contentTypeName].revalidate.has(id)) {
          return;
        }
        queue.push([contentTypeName, id]);
      });
    });
    const merged = mergeRevalidationObjects([allEntriesToRevalidate, entries]);
    allEntriesToRevalidate = merged;
  }

  return revalidateObjectToRevalidateOnlyObject(allEntriesToRevalidate);
};

export default ({ strapi }: { strapi: IStrapi & { entityService: any } }) => {
  // registeration phase
  // Register configuration hooks in the lifecycles of content types
  const headTypesConfigData = strapi.plugin(pluginId).config("headTypes");
  const headTypes = headTypesConfig.parse(headTypesConfigData);
  Object.keys(headTypes).forEach((headTypeName) => {
    const revalidateOtherObject: RevalidateOther = {};
    const headType = headTypes[headTypeName];
    const { contentTypes } = headType;

    const revalidate = async (fields, contentTypeName: string, entryId: Id) => {
      const configContentType = contentTypes[contentTypeName];
      const revalidationFunction =
        configContentType.revalidateFn ?? fallbackRevalidateFn;
      const prepareFunction = configContentType.prepareFn;

      if (!prepareFunction) {
        return;
      }

      const entry = await strapi.entityService.findOne(
        contentTypeName,
        entryId
      );

      const preparedState = await prepareFunction(strapi, fields, entry);
      await revalidationFunction(preparedState);
    };

    Object.keys(contentTypes).forEach((contentTypeName) => {
      const configContentType = contentTypes[contentTypeName];
      const contentType = strapi.contentType(contentTypeName);

      const revalidateOn = configContentType.revalidateOn;

      Object.keys(revalidateOn).forEach((revalidateOnContentTypeName) => {
        const revalidateOnContentType =
          revalidateOn[revalidateOnContentTypeName];
        const revalidateOnContentTypeArray = Array.isArray(
          revalidateOnContentType
        )
          ? revalidateOnContentType
          : [revalidateOnContentType];

        revalidateOtherObject[revalidateOnContentTypeName] = {
          ...revalidateOtherObject[revalidateOnContentTypeName],
          [contentTypeName]: revalidateOnContentTypeArray,
        };
      });
    });

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
          const revalidationObject = await findAllEntriesToRevalidate(
            strapi as any,
            contentTypeName,
            entry.id,
            revalidateOtherObject
          );

          if (prepareFunction) {
            await Promise.all(
              heads.map(async (head) => {
                const fields = await getService(strapi, "head").getFieldsObject(
                  head.id
                );
                await Promise.all(
                  Object.keys(revalidationObject).map((contentTypeName) => {
                    const contentTypeRevalidationObject =
                      revalidationObject[contentTypeName];
                    return Promise.all(
                      Array.from(contentTypeRevalidationObject).map((id) => {
                        return revalidate(fields, contentTypeName, id);
                      })
                    );
                  })
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

          const revalidationObject = await findAllEntriesToRevalidate(
            strapi as any,
            contentTypeName,
            entry.id,
            revalidateOtherObject
          );

          console.log("revalidating", revalidationObject);

          // TODO: use state heads
          if (prepareFunction) {
            const revalidatingPromise = Promise.all(
              heads.map(async (head) => {
                const fields = await getService(strapi, "head").getFieldsObject(
                  head.id
                );

                await Promise.all(
                  Object.keys(revalidationObject).map((contentTypeName) => {
                    const contentTypeRevalidationObject =
                      revalidationObject[contentTypeName];
                    return Promise.all(
                      Array.from(contentTypeRevalidationObject).map((id) => {
                        return revalidate(fields, contentTypeName, id);
                      })
                    );
                  })
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
