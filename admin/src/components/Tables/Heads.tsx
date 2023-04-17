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
} from "@strapi/design-system";
import { useHeads } from "../../lib/queries/head";
import pluginId from "../../pluginId";
import { Pencil } from "@strapi/icons";

const HeadsTable = () => {
  const { data: heads } = useHeads(1);

  return (
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
            <Td>{head.name}</Td>
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
  );
};

export default HeadsTable;
