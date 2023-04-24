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
import pluginId from "../../pluginId";
import { Pencil } from "@strapi/icons";
import { useRouteMatch } from "react-router-dom";
import { Trash } from "@strapi/icons";
import { useDefaultHeads } from "../../lib/queries/default-head";

const DefaultHeadsTable = () => {
  /* const match = useRouteMatch<{ page: string }>( */
  /*   `/settings/${pluginId}/heads/page/:page` */
  /* ); */
  /* const pageNumber = parseInt(match?.params.page ?? "1"); */
  const { data: heads } = useDefaultHeads();

  return (
    <>
      <Table rowCount={heads?.length ?? 0} colCount={3}>
        <Thead>
          <Tr>
            <Th>
              <Typography variant="sigma">Index</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Name</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Head type</Typography>
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {heads?.map((head, i) => (
            <Tr key={i}>
              <Td>{i}</Td>
              <Td>{head.name}</Td>
              <Td>{head.headType}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      {/* <> */}
      {/* {heads && heads.pagination.pageCount > 1 && ( */}
      {/*   <Pagination */}
      {/*     activePage={pageNumber} */}
      {/*     pageCount={heads.pagination.pageCount} */}
      {/*   > */}
      {/*     <PreviousLink */}
      {/*       to={`/settings/${pluginId}/heads/page/${pageNumber - 1}`} */}
      {/*     > */}
      {/*       Previous */}
      {/*     </PreviousLink> */}
      {/*     <NextLink to={`/settings/${pluginId}/heads/page/${pageNumber + 1}`}> */}
      {/*       Next */}
      {/*     </NextLink> */}
      {/*   </Pagination> */}
      {/* )} */}
      {/* </> */}
    </>
  );
};

export default DefaultHeadsTable;
