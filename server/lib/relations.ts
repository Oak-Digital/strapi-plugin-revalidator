import { Strapi } from "@strapi/strapi";
import { memoize } from "lodash";

const componentHasRelationFunction = (
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

export const componentHasRelation = memoize(
  componentHasRelationFunction,
  (strapi, componentName, relationContentTypeName) => {
    return `${componentName} ${relationContentTypeName}`;
  }
);

const componentRelationPathsFunction = (
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

export const componentRelationPaths = memoize(
  componentRelationPathsFunction,
  (strapi, componentName, relationContentTypeName) => {
    return `${componentName} ${relationContentTypeName}`;
  }
);

const contentTypeHasRelationFunction = (
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

export const contentTypeHasRelation = memoize(
  contentTypeHasRelationFunction,
  (strapi, contentTypeName, relationContentTypeName) => {
    return `${contentTypeName} ${relationContentTypeName}`;
  }
);

const contentTypeDynamicZoneWithRelationPathsFunction = (
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

export const contentTypeDynamicZoneWithRelationPaths = memoize(
  contentTypeDynamicZoneWithRelationPathsFunction,
  (strapi, contentTypeName, relationContentTypeName) => {
    return `${contentTypeName} ${relationContentTypeName}`;
  }
);

const contentTypeRelationPathsFunction = (
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

export const contentTypeRelationPaths = memoize(
  contentTypeRelationPathsFunction,
  (strapi, contentTypeName, relationContentTypeName) => {
    return `${contentTypeName} ${relationContentTypeName}`;
  }
);
