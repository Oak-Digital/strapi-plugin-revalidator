import { IStrapi, StrapiRequestContext } from "strapi-typed";
import { getService } from "../lib/service";

export default ({ strapi }: { strapi: IStrapi & { entityService: any } }) => ({
  index: async (ctx: StrapiRequestContext) => {
    const headTypes = await getService(strapi, "head-type").getHeadTypesWithFieldKeys();
    ctx.send(headTypes);
  }
});
