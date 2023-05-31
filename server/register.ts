import { Strapi } from "@strapi/strapi";
import axios, { isAxiosError } from "axios";
import pluginId from "./pluginId";
import { headTypesConfig } from "../types/config";
import { getService } from "./lib/service";
import { Id, IStrapi } from "strapi-typed";
import { STATE_KEY } from "./lib/constants";
import {
  ContentTypeConfig,
  ContentTypesConfig,
  HeadTypeConfig,
  RevalidateOn,
} from "../types/head-type-config";
import { get, set } from "lodash";
import {
  contentTypeDynamicZoneWithRelationPaths,
  contentTypeRelationPaths,
} from "./lib/relations";
import { DefaultHead } from "../types/default-head";

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
    if (!isAxiosError(e)) {
      console.error(
        "Something went wrong while revalidating, state: ",
        preparedState,
        "error: ",
        e
      );
      return;
    }

    console.error("Could not revalidate, state:", preparedState);
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
              otherContentTypeName,
              contentTypeName
            );
            const pathsWithId = paths.map((path) => {
              return pathToObjectWithId(path, entryId);
            });
            const stringPathsWithId = paths.map((path) => `${path}.id`);

            /* console.log(paths, JSON.stringify(pathsWithId, null, 2)); */
            /* console.log(`finding entries for ${otherContentTypeName}`); */
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
            /* console.log("found entries"); */

            const dynamiczonePaths = contentTypeDynamicZoneWithRelationPaths(
              strapi,
              otherContentTypeName,
              contentTypeName
            );
            const dynamiczonePopulatePaths = dynamiczonePaths.map((path) => {
              const [attributeName, componentAndPath] = path.split("::");
              const [componentCategory, componentName, ...restPath] =
                componentAndPath.split(".");
              return [attributeName, ...restPath].join(".");
            });
            /* console.log(`populating the following fields for ${otherContentTypeName}`, dynamiczonePopulatePaths) */
            const dynamiczoneEntries = await strapi.entityService.findMany(
              otherContentTypeName,
              {
                fields: ["id"],
                populate: dynamiczonePopulatePaths,
              }
            );

            /* console.log("found entries for dynamic zones", dynamiczoneEntries); */
            const filteredDynamiczoneEntries = dynamiczoneEntries.filter(
              (entry) => {
                // filter for each attribute
                // filter for each component

                return dynamiczonePaths.some((path) => {
                  const [attributeName, componentAndPath] = path.split("::");
                  const [componentCategory, componentName, ...restPath] =
                    componentAndPath.split(".");
                  const componentPath = restPath.join(".");
                  const attribute = entry[attributeName];
                  return attribute.some((component: any) => {
                    const id = get(component, `${componentPath}.id`);
                    return (
                      component.__component ===
                        `${componentCategory}.${componentName}` &&
                      id === entryId
                    );
                  });
                });
              }
            );
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
    } else if (checked[contentTypeName].revalidate.has(entryId)) {
      continue;
    }
    /* console.log( */
    /*   `finding entries to revalidate based on ${contentTypeName} : ${entryId}` */
    /* ); */
    const entries = await findEntriesToRevalidate(
      strapi,
      contentTypeName,
      entryId,
      revalidateOther
    );
    /* console.log( */
    /*   `found entries to revalidate based on ${contentTypeName} : ${entryId}`, */
    /*   entries */
    /* ); */
    Object.keys(entries).forEach((contentTypeName) => {
      entries[contentTypeName].revalidate.forEach((id) => {
        if (contentTypeName in checked && checked[contentTypeName].revalidate.has(id)) {
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

const revalidate = async (
  configs: ContentTypesConfig,
  fields: Record<string, string>,
  contentTypeName: string,
  entryId: Id
) => {
  const config = configs[contentTypeName];
  const revalidationFunction = config.revalidateFn ?? fallbackRevalidateFn;
  const prepareFunction = config.prepareFn;

  if (!prepareFunction) {
    return;
  }

  const entry = await strapi.entityService.findOne(contentTypeName, entryId);

  const preparedState = await prepareFunction(strapi, fields, entry);
  await revalidationFunction(preparedState);
};

const registerHeadType = (
  strapi: Strapi | (IStrapi & { entityService: any }),
  headTypeName: string,
  headType: HeadTypeConfig
) => {
  const revalidateOtherObject: RevalidateOther = {};
  const { contentTypes } = headType;

  Object.keys(contentTypes).forEach((contentTypeName) => {
    const configContentType = contentTypes[contentTypeName];
    const contentType = strapi.contentType(contentTypeName);

    const revalidateOn = configContentType.revalidateOn;

    Object.keys(revalidateOn).forEach((revalidateOnContentTypeName) => {
      const revalidateOnContentType = revalidateOn[revalidateOnContentTypeName];
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
        /* console.log("finding entry"); */
        const entryPromise = strapi.entityService.findOne(
          contentTypeName,
          event.params.where.id
        );

        const headService = getService(strapi, "head");
        const defaultHeadService = getService(strapi, "default-head");
        const heads = await headService.findAllOfType(headTypeName);
        const defaultHeads: DefaultHead[] =
          await defaultHeadService.findManyOfType(headTypeName);
        /* console.log("awaiting entry"); */
        const entry = await entryPromise;
        /* console.log("found entry"); */
        if (prepareFunction) {
          await Promise.all(
            heads.map(async (head) => {
              const fields = await headService.getFieldsObject(head.id);
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
          await Promise.all(
            defaultHeads.map(async (defaultHead) => {
              const fields = defaultHead.fields;
              const preparedState = await prepareFunction(
                strapi,
                fields,
                entry
              );
              event.state[STATE_KEY].push({
                head: defaultHead,
                fields,
                preparedState,
              });
            })
          );
        }
        /* console.log("awaiting old function"); */
        await oldFunctionPromise;
        /* console.log("Prepared"); */
      };
    });

    ["afterCreate"].forEach((lifecycleName) => {
      const oldFunction = contentType.lifecycles[lifecycleName] ?? (() => {});
      contentType.lifecycles[lifecycleName] = async (event) => {
        // call the old function
        const result = await oldFunction(event);

        /* const heads = event.state[STATE_KEY].map((state) => state.head); */

        const entry = event.result;
        const headService = getService(strapi, "head");
        const defaultHeadService = getService(strapi, "default-head");
        const heads = await headService.findAllOfType(headTypeName);
        const defaultHeads: DefaultHead[] =
          await defaultHeadService.findManyOfType(headTypeName);
        const revalidationObject = await findAllEntriesToRevalidate(
          strapi as any,
          contentTypeName,
          entry.id,
          revalidateOtherObject
        );

        if (prepareFunction) {
          Promise.all(
            heads.map(async (head) => {
              const fields = await headService.getFieldsObject(head.id);
              await Promise.all(
                Object.keys(revalidationObject).map((contentTypeName) => {
                  const contentTypeRevalidationObject =
                    revalidationObject[contentTypeName];
                  return Promise.all(
                    Array.from(contentTypeRevalidationObject).map((id) => {
                      return revalidate(
                        contentTypes,
                        fields,
                        contentTypeName,
                        id
                      );
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
          Promise.all(
            defaultHeads.map(async (head) => {
              await Promise.all(
                Object.keys(revalidationObject).map((contentTypeName) => {
                  const contentTypeRevalidationObject =
                    revalidationObject[contentTypeName];
                  return Promise.all(
                    Array.from(contentTypeRevalidationObject).map((id) => {
                      return revalidate(
                        contentTypes,
                        head.fields,
                        contentTypeName,
                        id
                      );
                    })
                  );
                })
              );
              const preparedState = await prepareFunction(
                strapi,
                head.fields,
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
        const headService = getService(strapi, "head");
        const defaultHeadService = getService(strapi, "default-head");
        /* console.log("Finding all heads"); */
        const heads = await headService.findAllOfType(headTypeName);
        const defaultHeads: DefaultHead[] =
          await defaultHeadService.findManyOfType(headTypeName);
        /* console.log("Found all heads"); */

        /* console.log('finding entries to revalidate', contentTypeName, entry.id, revalidateOtherObject[contentTypeName]); */
        const revalidationObject = await findAllEntriesToRevalidate(
          strapi as any,
          contentTypeName,
          entry.id,
          revalidateOtherObject
        );

        /* console.log("revalidating", revalidationObject); */

        // TODO: use state heads
        if (prepareFunction) {
          const revalidatingPromise = Promise.all(
            heads.map(async (head) => {
              const fields = await headService.getFieldsObject(head.id);

              Promise.all(
                Object.keys(revalidationObject).map((contentTypeName) => {
                  const contentTypeRevalidationObject =
                    revalidationObject[contentTypeName];
                  return Promise.all(
                    Array.from(contentTypeRevalidationObject).map((id) => {
                      return revalidate(
                        contentTypes,
                        fields,
                        contentTypeName,
                        id
                      );
                    })
                  );
                })
              );

              const preparedState = await prepareFunction(
                strapi,
                fields,
                entry
              );
              revalidationFunction(preparedState);
            })
          );

          const revalidatingDefaultHeadsPromise = Promise.all(
            defaultHeads.map(async (defaultHead) => {
              Promise.all(
                Object.keys(revalidationObject).map((contentTypeName) => {
                  const contentTypeRevalidationObject =
                    revalidationObject[contentTypeName];
                  return Promise.all(
                    Array.from(contentTypeRevalidationObject).map((id) => {
                      return revalidate(
                        contentTypes,
                        defaultHead.fields,
                        contentTypeName,
                        id
                      );
                    })
                  );
                })
              );

              const preparedState = await prepareFunction(
                strapi,
                defaultHead.fields,
                entry
              );
              revalidationFunction(preparedState);
            })
          );

          const revalidatingBeforePromise = Promise.all(
            event.state[STATE_KEY].map(async (state) => {
              const { head, fields, preparedState } = state;
              await revalidationFunction(preparedState);
            })
          );

          /* await Promise.all([ */
          /*   revalidatingPromise, */
          /*   revalidatingBeforePromise, */
          /*   revalidatingDefaultHeadsPromise, */
          /* ]); */
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

          /* await revalidatingBeforePromise; */
        }
        return result;
      };
    });
  });
};

export default ({ strapi }: { strapi: IStrapi & { entityService: any } }) => {
  // registeration phase
  // Register configuration hooks in the lifecycles of content types
  const headTypesConfigData = strapi.plugin(pluginId).config("headTypes");
  const headTypes = headTypesConfig.parse(headTypesConfigData);
  Object.keys(headTypes).forEach((headTypeName) => {
    const headType = headTypes[headTypeName];
    registerHeadType(strapi, headTypeName, headType);
  });
};
