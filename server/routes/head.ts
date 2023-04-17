import { StrapiRoute } from "strapi-typed";

const routes: StrapiRoute[] = [
  {
    method: "GET",
    path: "/heads/",
    handler: "head.findMany",
    config: {
      policies: [],
    },
  },
];

export default routes;
