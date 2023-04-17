import { useQuery, UseQueryOptions } from "react-query";
import { request } from "@strapi/helper-plugin";
import pluginId from "../../pluginId";

const getHeadKey = (id: number) => {
  return ["heads", "head", id];
};
const getHeadsPageKey = (page: number) => {
  return ["heads", page];
};

export const useHead = <Data = any>(id: number, options?: UseQueryOptions<any, any, Data>) => {
  return useQuery<any, any, Data>(getHeadKey(id), async () => {
    const response = await request(`/${pluginId}/heads/${id}`, {
      method: "GET",
    });

    return response;
  }, options);
};

export const useHeads = (page: number) => {
  return useQuery(getHeadsPageKey(page), async () => {
    const response = await request(`/${pluginId}/heads`, {
      method: "GET",
    });

    return response;
  });
};
