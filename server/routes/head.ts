import { StrapiRoute } from "strapi-typed";

const routes: StrapiRoute[] = [
  {
    method: "GET",
    path: "/heads",
    handler: "head.findMany",
    config: {
      policies: [],
    },
  },
  {
    method: "POST",
    path: "/heads",
    handler: "head.create",
    config: {
      policies: [],
    },
  },
  {
    method: "GET",
    path: "/heads/:id",
    handler: "head.findOne",
    config: {
      policies: [],
    },
  },
  {
    method: "PUT",
    path: "/heads/:id",
    handler: "head.update",
    config: {
      policies: [],
    },
  },
  {
    method: "DELETE",
    path: "/heads/:id",
    handler: "head.delete",
    config: {
      policies: [],
    },
  },
];

export default routes;
