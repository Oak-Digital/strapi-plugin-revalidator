import { Strapi } from "@strapi/strapi";

export const componentHasRelation = (
  strapi: Strapi,
  componentName: string,
  relationContentTypeName: string
) => {
  return Object.keys(strapi.components[componentName].attributes).some(
    (attributeName) => {
      const attribute =
        strapi.components[componentName].attributes[attributeName];
      if (attribute.type === "relation") {
        if (attribute.relation === relationContentTypeName) {
          return true;
        }
      }

      if (attribute.type === "component") {
        return componentHasRelation(
          strapi,
          attribute.component,
          relationContentTypeName
        );
      }

      return false;
    }
  );
};

export const componentRelationPaths = (
  strapi: Strapi,
  componentName: string,
  relationContentTypeName: string
) => {
  const paths: string[] = [];
  Object.keys(strapi.components[componentName].attributes).forEach(
    (attributeName) => {
      const attribute =
        strapi.components[componentName].attributes[attributeName];
      if (attribute.type === "relation") {
        if (attribute.target === relationContentTypeName) {
          paths.push(attributeName);
        }
      }

      if (attribute.type === "component") {
        const componentPaths = componentRelationPaths(
          strapi,
          attribute.component,
          relationContentTypeName
        );
        componentPaths.forEach((componentPath) => {
          paths.push(`${attributeName}.${componentPath}`);
        });
      }
    }
  );
  return paths;
};

export const contentTypeHasRelation = (
  strapi: Strapi,
  contentTypeName: string,
  relationContentTypeName: string
) => {
  const contentType = strapi.contentType(contentTypeName);
  return Object.keys(contentType.attributes).some((attributeName) => {
    const attribute = contentType.attributes[attributeName];
    if (attribute.type === "relation") {
      if (attribute.target === relationContentTypeName) {
        return true;
      }
    }

    if (attribute.type === "component") {
      return componentHasRelation(
        strapi,
        attribute.component,
        relationContentTypeName
      );
    }

    if (attribute.type === "dynamiczone") {
      return attribute.components.some((componentName) => {
        return componentHasRelation(
          strapi,
          componentName,
          relationContentTypeName
        );
      });
    }

    return false;
  });
};

export const contentTypeDynamicZoneWithRelationPaths = (
  strapi: Strapi,
  contentTypeName: string,
  relationContentTypeName: string
) => {
  const paths: string[] = [];
  const contentType = strapi.contentType(contentTypeName);
  Object.keys(contentType.attributes).forEach((attributeName) => {
    const attribute = contentType.attributes[attributeName];
    if (attribute.type === "dynamiczone") {
      attribute.components.forEach((componentName) => {
        const componentPaths = componentRelationPaths(
          strapi,
          componentName,
          relationContentTypeName
        );
        componentPaths.forEach((componentPath) => {
          paths.push(`${attributeName}::${componentName}.${componentPath}`);
        });
      });
    }
  });
  return paths;
};

export const contentTypeRelationPaths = (
  strapi: Strapi,
  contentTypeName: string,
  relationContentTypeName: string
) => {
  const paths: string[] = [];
  const contentType = strapi.contentType(contentTypeName);
  Object.keys(contentType.attributes).forEach((attributeName) => {
    const attribute = contentType.attributes[attributeName];
    if (attribute.type === "relation") {
      if (attribute.relation === relationContentTypeName) {
        paths.push(attributeName);
      }
    }

    if (attribute.type === "component") {
      const componentPaths = componentRelationPaths(
        strapi,
        attribute.component,
        relationContentTypeName
      );
      componentPaths.forEach((componentPath) => {
        paths.push(`${attributeName}.${componentPath}`);
      });
    }
  });
  return paths;
};
