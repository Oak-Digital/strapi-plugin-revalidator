import { StrapiRoute } from "strapi-typed";

const base = "/default-heads";

const routes: StrapiRoute[] = [
  {
    method: "GET",
    path: `${base}`,
    handler: "default-head.findMany",
    config: {
      policies: [],
    },
  },
  {
    method: "GET",
    path: `${base}/:id`,
    handler: "default-head.findOne",
    config: {
      policies: [],
    },
  },
];

export default routes;
