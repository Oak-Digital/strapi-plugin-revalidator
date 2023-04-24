import React from "react";
import {
  Main,
  HeaderLayout,
  ContentLayout,
  LinkButton,
} from "@strapi/design-system";
import { useIntl } from "react-intl";
import pluginId from "../../../pluginId";
import DefaultHeadsTable from "../../../components/Tables/DefaultHeads";

const ListHeadsPage = () => {
  const { formatMessage } = useIntl();

  return (
    <Main>
      <HeaderLayout
        title={formatMessage({
          id: `${pluginId}.settings.page.heads.title`,
          defaultMessage: "Default Reavalidator heads",
        })}
        subtitle="defined in code or environment variables"
      />
      <ContentLayout>
        <DefaultHeadsTable />
      </ContentLayout>
    </Main>
  );
};

export default ListHeadsPage;
