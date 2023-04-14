/* import { HeadTypeConfig } from "../../../types/head-type-config"; */
/* import { configType } from "../../../types/config"; */
/* import { Strapi } from "@strapi/strapi"; */
/**/
/* const getHeadTypeKey = (key) => { */
/*   return `head-type-${key}`; */
/* }; */
/**/
/**/
/* const createSchema = (headTypeKey: string, config: HeadTypeConfig) => { */
/*   const fields = config.fields ?? {}; */
/*   const attributes = Object.keys(fields).reduce((acc, key) => { */
/*     const field = fields[key] ?? {}; */
/*     acc[`field_${key}`] = { */
/*       type: field.type ?? "string", */
/*       configurable: false, */
/*     }; */
/*     return acc; */
/*   }, {}); */
/**/
/*   const schema = { */
/*     kind: "collectionType", */
/*     collectionName: getHeadTypeKey(headTypeKey), */
/*     info: { */
/*       singularName: headTypeKey, */
/*       pluralName: headTypeKey, */
/*       displayName: `Head type - ${headTypeKey}`, */
/*       description: */
/*         "This collection type is generated dynamically and describes the config for a head type", */
/*     }, */
/*     options: { */
/*       draftAndPublish: false, */
/*     }, */
/*     pluginOptions: { */
/*       "content-manager": { */
/*         visible: false, */
/*       }, */
/*       "content-type-builder": { */
/*         visible: false, */
/*       }, */
/*     }, */
/*     attributes: { */
/*       head: { */
/*         required: true, */
/*         type: "relation", */
/*         relation: "manyToOne", */
/*         target: "plugin::revalidator.head", */
/*         configurable: false, */
/*       }, */
/*       ...attributes, */
/*     }, */
/*   }; */
/**/
/*   return schema; */
/* }; */
/**/
/* export const createSchemas = (strapi: Strapi) => { */
/*   const config = strapi.plugin("revalidator").config("head-types"); */
/*   const parsed = configType.parse(config); */
/**/
/*   const headTypes = parsed.headTypes ?? {}; */
/*   const schemas = Object.keys(headTypes).reduce((acc, key) => { */
/*     const headTypeConfig = headTypes[key]; */
/*     acc[getHeadTypeKey(key)] = { */
/*       schema: createSchema(key, headTypeConfig), */
/*     }; */
/*     return acc; */
/*   }, {}); */
/**/
/*   return schemas; */
/* }; */
/**/
