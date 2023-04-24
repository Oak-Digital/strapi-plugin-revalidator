import { useQuery } from "react-query"
import { request } from "@strapi/helper-plugin"
import pluginId from "../../pluginId";
import { DefaultHead } from "../../../../types/default-head";

export const useDefaultHeads = () => {
  return useQuery<DefaultHead[], any>(['defaultHeads'], async () => {
    const response = await request(`/${pluginId}/default-heads`, {
      method: "GET",
    });

    return response;
  });
}
