import { useQuery } from "react-query";
import { request, useNotification } from "@strapi/helper-plugin";
import pluginId from "../../pluginId";

export const useHeadTypes = () => {
  return useQuery(
    ["headTypes"],
    async () => {
      const response = await request(`/${pluginId}/head-types/`, {
        method: "GET",
      });

      return response;
    },
    {}
  );
};
