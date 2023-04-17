import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "react-query";
import { request } from "@strapi/helper-plugin";
import pluginId from "../../pluginId";

const getHeadKey = (id: number) => {
  return ["heads", "head", id];
};
const getHeadsPageKey = (page: number) => {
  return ["heads", "page", page];
};

export const invalidateHeadPages = (queryClient: any) => {
  queryClient.invalidateQueries(["heads", "page"]);
};

export const useHead = <Data = any>(
  id: number,
  options?: UseQueryOptions<any, any, Data>
) => {
  return useQuery<any, any, Data>(
    getHeadKey(id),
    async () => {
      const response = await request(`/${pluginId}/heads/${id}`, {
        method: "GET",
      });

      return response;
    },
    options
  );
};

export const useHeads = (page: number) => {
  return useQuery(getHeadsPageKey(page), async () => {
    const response = await request(`/${pluginId}/heads`, {
      method: "GET",
    });

    return response;
  });
};

export const useCreateHead = () => {
  const queryClient = useQueryClient();
  return useMutation<any, any, any>(
    (data: any) => {
      return request(`/${pluginId}/heads`, {
        method: "POST",
        body: data,
      });
    },
    {
      onSuccess: (data, variables) => {
        invalidateHeadPages(queryClient);
      },
    }
  );
};

export const useUpdateHead = () => {
  const queryClient = useQueryClient();
  return useMutation<any, any, { id: string | number; data: any }>(
    ({ id, data }) => {
      return request(`/${pluginId}/heads/${id}`, {
        method: "PUT",
        body: data,
      });
    },
    {
      onSuccess: (data, variables) => {
        // TODO: Make sure the API returns the correct data to set the query data
        /* queryClient.setQueryData(getHeadKey(variables.id), data); */
        const id = typeof variables.id === "string" ? parseInt(variables.id) : variables.id;
        queryClient.invalidateQueries(getHeadKey(id));
        invalidateHeadPages(queryClient);
      },
    }
  );
};
