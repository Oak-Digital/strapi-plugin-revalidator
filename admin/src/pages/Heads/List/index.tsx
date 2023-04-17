import React from "react";
import {
  Main,
  HeaderLayout,
  ContentLayout,
  Table,
  Tr,
  Thead,
  Th,
} from "@strapi/design-system";
import { useIntl } from "react-intl";
import pluginId from "../../../pluginId";
import HeadsTable from "../../../components/Tables/Heads";

const ListHeadsPage = () => {
  const { formatMessage } = useIntl();

  return (
    <Main>
      <HeaderLayout
        title={formatMessage({
          id: `${pluginId}.settings.page.heads.title`,
          defaultMessage: "Reavalidator heads",
        })}
      />
      <ContentLayout>
        <HeadsTable />
      </ContentLayout>
    </Main>
  );
};

export default ListHeadsPage;
