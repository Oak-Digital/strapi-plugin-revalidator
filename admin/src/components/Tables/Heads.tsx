import React from "react";
1;
import {
  Link,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Typography,
  VisuallyHidden,
  IconButton,
  Flex,
  Pagination,
  PreviousLink,
  NextLink,
  PageLink,
  Dots,
} from "@strapi/design-system";
import { useHeads } from "../../lib/queries/head";
import pluginId from "../../pluginId";
import { Pencil } from "@strapi/icons";
import { useRouteMatch } from "react-router-dom";

const HeadsTable = () => {
  const match = useRouteMatch<{ page: string }>(
    `/settings/${pluginId}/heads/page/:page`
  );
  const pageNumber = parseInt(match?.params.page ?? "1");
  const { data: heads } = useHeads(pageNumber);

  return (
    <>
      <Table rowCount={heads?.length ?? 0} colCount={4}>
        <Thead>
          <Tr>
            <Th>
              <Typography variant="sigma">Id</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Name</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Head type</Typography>
            </Th>
            <Th>
              <VisuallyHidden>Actions</VisuallyHidden>
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {heads?.results?.map((head: any) => (
            <Tr key={head.id}>
              <Td>{head.id}</Td>
              <Td>{head.title}</Td>
              <Td>{head.headType}</Td>
              <Td>
                <Flex justifyContent="end">
                  <Link to={`/settings/${pluginId}/heads/edit/${head.id}`}>
                    <IconButton label="Edit" noBorder icon={<Pencil />} />
                  </Link>
                </Flex>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      {heads && heads.pagination.pageCount > 1 && (
        <Pagination
          activePage={pageNumber}
          pageCount={heads.pagination.pageCount}
        >
          <PreviousLink
            to={`/settings/${pluginId}/heads/page/${pageNumber - 1}`}
          >
            Previous
          </PreviousLink>
          <NextLink to={`/settings/${pluginId}/heads/page/${pageNumber + 1}`}>
            Next
          </NextLink>
        </Pagination>
      )}
    </>
  );
};

export default HeadsTable;
