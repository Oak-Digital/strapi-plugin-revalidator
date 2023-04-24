import { Strapi } from '@strapi/strapi';
import {getService} from "../lib/service";

export default ({ strapi }: { strapi: Strapi }) => ({
  /* componentHasRelation( */
  /*   strapi: Strapi, */
  /*   componentName: string, */
  /*   relationContentTypeName: string */
  /* ) { */
  /*   const service = getService(strapi, "relations"); */
  /*   return Object.keys(strapi.components[componentName].attributes).some( */
  /*     (attributeName) => { */
  /*       const attribute = */
  /*         strapi.components[componentName].attributes[attributeName]; */
  /*       if (attribute.type === "relation") { */
  /*         if (attribute.relation === relationContentTypeName) { */
  /*           return true; */
  /*         } */
  /*       } */
  /**/
  /*       if (attribute.type === "component") { */
  /*         return service.componentHasRelation( */
  /*           strapi, */
  /*           attribute.component, */
  /*           relationContentTypeName */
  /*         ); */
  /*       } */
  /**/
  /*       return false; */
  /*     } */
  /*   ); */
  /* }, */
  /**/
  /* componentRelationPaths( */
  /*   strapi: Strapi, */
  /*   componentName: string, */
  /*   relationContentTypeName: string */
  /* ) { */
  /*   const service = getService(strapi, "relations"); */
  /*   const paths: string[] = []; */
  /*   Object.keys(strapi.components[componentName].attributes).forEach( */
  /*     (attributeName) => { */
  /*       const attribute = */
  /*         strapi.components[componentName].attributes[attributeName]; */
  /*       if (attribute.type === "relation") { */
  /*         if (attribute.target === relationContentTypeName) { */
  /*           paths.push(attributeName); */
  /*         } */
  /*       } */
  /**/
  /*       if (attribute.type === "component") { */
  /*         const componentPaths = service.componentRelationPaths( */
  /*           strapi, */
  /*           attribute.component, */
  /*           relationContentTypeName */
  /*         ); */
  /*         componentPaths.forEach((componentPath) => { */
  /*           paths.push(`${attributeName}.${componentPath}`); */
  /*         }); */
  /*       } */
  /*     } */
  /*   ); */
  /*   return paths; */
  /* }, */
  /**/
  /* contentTypeHasRelation( */
  /*   strapi: Strapi, */
  /*   contentTypeName: string, */
  /*   relationContentTypeName: string */
  /* ) { */
  /*   const service = getService(strapi, "relations"); */
  /*   const contentType = strapi.contentType(contentTypeName); */
  /*   return Object.keys(contentType.attributes).some((attributeName) => { */
  /*     const attribute = contentType.attributes[attributeName]; */
  /*     if (attribute.type === "relation") { */
  /*       if (attribute.target === relationContentTypeName) { */
  /*         return true; */
  /*       } */
  /*     } */
  /**/
  /*     if (attribute.type === "component") { */
  /*       return service.componentHasRelation( */
  /*         strapi, */
  /*         attribute.component, */
  /*         relationContentTypeName */
  /*       ); */
  /*     } */
  /**/
  /*     if (attribute.type === "dynamiczone") { */
  /*       return attribute.components.some((componentName) => { */
  /*         return service.componentHasRelation( */
  /*           strapi, */
  /*           componentName, */
  /*           relationContentTypeName */
  /*         ); */
  /*       }); */
  /*     } */
  /**/
  /*     return false; */
  /*   }); */
  /* }, */
  /**/
  /* contentTypeDynamicZoneWithRelationPaths( */
  /*   strapi: Strapi, */
  /*   contentTypeName: string, */
  /*   relationContentTypeName: string */
  /* ) { */
  /*   const service = getService(strapi, "relations"); */
  /*   const paths: string[] = []; */
  /*   const contentType = strapi.contentType(contentTypeName); */
  /*   Object.keys(contentType.attributes).forEach((attributeName) => { */
  /*     const attribute = contentType.attributes[attributeName]; */
  /*     if (attribute.type === "dynamiczone") { */
  /*       attribute.components.forEach((componentName) => { */
  /*         const componentPaths = service.componentRelationPaths( */
  /*           strapi, */
  /*           componentName, */
  /*           relationContentTypeName */
  /*         ); */
  /*         componentPaths.forEach((componentPath) => { */
  /*           paths.push(`${attributeName}::${componentName}.${componentPath}`); */
  /*         }); */
  /*       }); */
  /*     } */
  /*   }); */
  /*   return paths; */
  /* }, */
  /**/
  /* contentTypeRelationPaths( */
  /*   strapi: Strapi, */
  /*   contentTypeName: string, */
  /*   relationContentTypeName: string */
  /* ) { */
  /*   const service = getService(strapi, "relations"); */
  /*   const paths: string[] = []; */
  /*   const contentType = strapi.contentType(contentTypeName); */
  /*   Object.keys(contentType.attributes).forEach((attributeName) => { */
  /*     const attribute = contentType.attributes[attributeName]; */
  /*     if (attribute.type === "relation") { */
  /*       if (attribute.relation === relationContentTypeName) { */
  /*         paths.push(attributeName); */
  /*       } */
  /*     } */
  /**/
  /*     if (attribute.type === "component") { */
  /*       const componentPaths = service.componentRelationPaths( */
  /*         strapi, */
  /*         attribute.component, */
  /*         relationContentTypeName */
  /*       ); */
  /*       componentPaths.forEach((componentPath) => { */
  /*         paths.push(`${attributeName}.${componentPath}`); */
  /*       }); */
  /*     } */
  /*   }); */
  /*   return paths; */
  /* }, */
});
