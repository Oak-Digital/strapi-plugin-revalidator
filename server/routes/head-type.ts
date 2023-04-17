import { StrapiRoute } from "strapi-typed";

const headTypeRoutes: StrapiRoute[] = [
  {
    method: "GET",
    path: "/head-types/",
    handler: "head-type.index",
    config: {
      policies: [],
    },
  }
];

export default headTypeRoutes;
