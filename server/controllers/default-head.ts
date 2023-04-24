import { IStrapi, StrapiRequestContext } from "strapi-typed";
import { getService } from "../lib/service";

export default ({ strapi }: { strapi: IStrapi & { entityService: any } }) => ({
  findMany: async (ctx: StrapiRequestContext) => {
    const service = getService(strapi, "default-head");

    const heads = await service.findMany();

    return heads;
  },

  findOne: async (ctx: StrapiRequestContext) => {
    const service = getService(strapi, "default-head");
  }
});
