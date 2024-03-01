import { IStrapi } from "strapi-typed";
import pluginId from "../pluginId";
import { Config, defaultHeadsConfig } from "../../types/config";
import { DefaultHead } from "../../types/default-head";
import { getService } from "../lib/service";

export default ({ strapi }: { strapi: IStrapi & { entityService: any } }) => ({
  findMany: async () => {
    let config: Config["defaultHeads"];
    try {
      config = strapi.plugin(pluginId).config("defaultHeads");
    } catch (e) {
      return [];
    }
    const result = defaultHeadsConfig.safeParse(config);
    if (!result.success) {
      return [];
    }

    const heads: DefaultHead[] = [];

    for (const [key, value] of Object.entries(result.data)) {
      value.forEach((head) => {
        heads.push({
          headType: key,
          name: head.name,
          fields: head.fields,
        });
      });
    }

    return heads;
  },

  findManyOfType: async (headType: string) => {
    const service = getService(strapi, "default-head");
    const heads = await service.findMany();
    const filtered = heads.filter((head) => head.headType === headType);
    return filtered;
  },

  findOne: async (headType: string, index: number) => {
    // TODO:
    return null;
  },
});
