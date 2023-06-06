import { Strapi } from "@strapi/strapi";
import axios, { isAxiosError } from "axios";
import pluginId from "./pluginId";
import { headTypesConfig, loggingConfig } from "../types/config";
import { getService } from "./lib/service";
import { getMulti } from "./lib/paths";
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

type MyStrapi = Strapi | (IStrapi & { entityService: any });

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

const logger = {
  info: (...messages: any[]) => {
    console.log("Revalidator - INFO: ", ...messages);
  },
  debug: (...messages: any[]) => {
    console.log("Revalidator - DEBUG: ", ...messages);
  },
};

const logLevel = ["none", "info", "debug"] as const;

type RevalidateOther = Record<string, Record<string, Array<RevalidateOn>>>;
type RevalidateObject = Record<
  string,
  {
    revalidate: Set<Id>;
    softRevalidate: Set<Id>;
  }
>;

type RevalidateOnlyObject = Record<string, Set<Id>>;

const revalidateObjectToRevalidateOnlyObject = (
  revalidateObject: RevalidateObject
): RevalidateOnlyObject => {
  const revalidateOnlyObject: RevalidateOnlyObject = {};
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
            logger.debug(`finding entries for ${otherContentTypeName}`);
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
            logger.debug(`found entries for ${otherContentTypeName}`, entries);

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
            logger.debug(
              `populating the following fields for ${otherContentTypeName}`,
              dynamiczonePopulatePaths
            );
            const dynamiczoneEntries = await strapi.entityService.findMany(
              otherContentTypeName,
              {
                fields: ["id"],
                populate: dynamiczonePopulatePaths,
              }
            );

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
                  const filteredComponents = attribute.filter(
                    (component: any) => {
                      return (
                        component.__component ===
                        `${componentCategory}.${componentName}`
                      );
                    }
                  );
                  return filteredComponents.some((component: any) => {
                    /* const id = get(component, `${componentPath}.id`); */
                    const ids = getMulti(component, [...restPath, "id"]);
                    return ids.includes(entryId);
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
    logger.debug(
      `finding entries to revalidate based on ${contentTypeName} id: ${entryId}`
    );
    const entries = await findEntriesToRevalidate(
      strapi,
      contentTypeName,
      entryId,
      revalidateOther
    );
    logger.debug(
      `found entries to revalidate based on ${contentTypeName} id: ${entryId}`,
      entries
    );
    // Check the entries that need to be revalidated, if they are already checked, we skip them.
    // If they are not checked, we add them to the queue
    Object.keys(entries).forEach((contentTypeName) => {
      entries[contentTypeName].revalidate.forEach((id) => {
        if (checked[contentTypeName]?.revalidate.has(id) ?? false) {
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

const revalidateRevalidationOnlyObject = async (
  configs: ContentTypesConfig,
  fields: Record<string, string>,
  revalidationObject: RevalidateOnlyObject
) => {
  await Promise.all(
    Object.keys(revalidationObject).map((contentTypeName) => {
      const contentTypeRevalidationObject = revalidationObject[contentTypeName];
      return Promise.all(
        Array.from(contentTypeRevalidationObject).map((id) => {
          return revalidate(configs, fields, contentTypeName, id);
        })
      );
    })
  );
};

const getAllHeadTypesFields = async (
  strapi: MyStrapi,
  headTypeName: string
) => {
  const headService = getService(strapi, "head");
  const defaultHeadService = getService(strapi, "default-head");
  const heads = await headService.findAllOfType(headTypeName);
  const defaultHeads: DefaultHead[] = await defaultHeadService.findManyOfType(
    headTypeName
  );

  const headFields: { head: any; fields: Record<string, any> }[] =
    await Promise.all(
      heads.map(async (head) => {
        const fields = await headService.getFieldsObject(head.id);
        return { head, fields };
      })
    );
  const defaultHeadFields = defaultHeads.map((head) => ({
    head,
    fields: head.fields,
  }));

  return [...headFields, ...defaultHeadFields];
};

type EventStateArray = {
  head: any;
  fields: Record<string, string>;
  preparedState: any;
}[];

const registerHeadType = (
  strapi: Strapi | (IStrapi & { entityService: any }),
  headTypeName: string,
  headType: HeadTypeConfig
) => {
  const revalidateOtherObject: RevalidateOther = {};
  const { contentTypes } = headType;
  // extend this with keys from revalidate on, since we need to create lifecycle hooks for those as well
  const contentTypesExtended = {
    ...contentTypes,
  };

  Object.keys(contentTypes).forEach((contentTypeName) => {
    const configContentType = contentTypes[contentTypeName];
    const contentType = strapi.contentType(contentTypeName);

    const revalidateOn = configContentType.revalidateOn;

    Object.keys(revalidateOn).forEach((revalidateOnContentTypeName) => {
      const revalidateOnContentType = revalidateOn[revalidateOnContentTypeName];

      if (!contentTypesExtended[revalidateOnContentTypeName]) {
        contentTypesExtended[revalidateOnContentTypeName] = {
          revalidateOn: {},
        };
      }

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

  Object.keys(contentTypesExtended).forEach((contentTypeName) => {
    const configContentType = contentTypesExtended[contentTypeName];
    const contentType = strapi.contentType(contentTypeName);
    const revalidationFunction =
      configContentType.revalidateFn ?? fallbackRevalidateFn;
    const prepareFunction = configContentType.prepareFn;

    const lifecycles: Record<string, Function> = {};

    ["beforeUpdate", "beforeDelete"].forEach((lifecycleName) => {
      lifecycles[lifecycleName] = async (event) => {
        // find the content type entry
        const state: { [STATE_KEY]: EventStateArray } = { [STATE_KEY]: [] };
        event.state = state;
        logger.debug(
          `finding entry while ${lifecycleName} for ${contentTypeName}`
        );
        const entryPromise = strapi.entityService.findOne(
          contentTypeName,
          event.params.where.id
        );

        const headFields = await getAllHeadTypesFields(strapi, headTypeName);
        const entry = await entryPromise;
        logger.debug(
          `found entry while ${lifecycleName} for ${contentTypeName}`
        );
        if (prepareFunction) {
          await Promise.all(
            headFields.map(async ({ head, fields }) => {
              const preparedState = await prepareFunction(
                strapi,
                fields,
                entry
              );
              state[STATE_KEY].push({
                head,
                fields,
                preparedState,
              });
            })
          );
        }
      };
    });

    ["afterCreate"].forEach((lifecycleName) => {
      lifecycles[lifecycleName] = async (event) => {
        const entry = event.result;
        const revalidationObject = await findAllEntriesToRevalidate(
          strapi as any,
          contentTypeName,
          entry.id,
          revalidateOtherObject
        );

        logger.info(
          `revalidating ${contentTypeName} during lifecycle ${lifecycleName}`,
          revalidationObject
        );

        const headFields = await getAllHeadTypesFields(strapi, headTypeName);

        Promise.all(
          headFields.map(async ({ head, fields }) => {
            await revalidateRevalidationOnlyObject(
              contentTypesExtended,
              fields,
              revalidationObject
            );
          })
        );
      };
    });

    ["afterUpdate"].forEach((lifecycleName) => {
      lifecycles[lifecycleName] = async (event) => {
        const revalidatorState: EventStateArray = event.state[STATE_KEY];

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

        logger.info(
          `revalidating ${contentTypeName} during lifecycle ${lifecycleName}`,
          revalidationObject
        );

        const headFields = await getAllHeadTypesFields(strapi, headTypeName);

        Promise.all(
          headFields.map(async ({ head, fields }) => {
            await revalidateRevalidationOnlyObject(
              contentTypesExtended,
              fields,
              revalidationObject
            );
          })
        );

        if (prepareFunction) {
          const revalidatingBeforePromise = Promise.all(
            revalidatorState.map(async (state) => {
              const { head, fields, preparedState } = state;
              await revalidationFunction(preparedState);
            })
          );
        }
      };
    });

    ["afterDelete"].forEach((lifecycleName) => {
      lifecycles[lifecycleName] = async (event) => {
        // call the old function
        const revalidatorState: EventStateArray = event.state[STATE_KEY];

          if (prepareFunction) {
          logger.info(
            `revalidating ${contentTypeName} during lifecycle ${lifecycleName}`,
          );
          const revalidatingBeforePromise = Promise.all(
            revalidatorState.map(async (state) => {
              const { head, fields, preparedState } = state;
              await revalidationFunction(preparedState);
            })
          );

          /* await revalidatingBeforePromise; */
        }
      };
    });

    // @ts-ignore - incorrect type defs
    strapi.db.lifecycles.subscribe({
      models: [contentTypeName],
      ...lifecycles,
    });
  });
};

export default ({ strapi }: { strapi: IStrapi & { entityService: any } }) => {
  // bootstrap phase
  // Register configuration hooks in the lifecycles of content types
  const headTypesConfigData = strapi.plugin(pluginId).config("headTypes");
  const headTypes = headTypesConfig.parse(headTypesConfigData);
  const loggingConfigData = strapi.plugin(pluginId).config("logging");
  const logging = loggingConfig.parse(loggingConfigData);
  const level = logLevel.indexOf(logging.level);
  for (let i = logLevel.length - 1; i > level; i--) {
    const levelName = logLevel[i];
    logger[levelName] = () => { };
  }
  Object.keys(headTypes).forEach((headTypeName) => {
    const headType = headTypes[headTypeName];
    registerHeadType(strapi, headTypeName, headType);
  });
};
