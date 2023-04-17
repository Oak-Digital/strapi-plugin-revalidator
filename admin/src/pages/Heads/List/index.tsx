import React from "react";
import { Main, HeaderLayout, ContentLayout, LinkButton } from "@strapi/design-system";
import { useIntl } from "react-intl";
import pluginId from "../../../pluginId";
import HeadsTable from "../../../components/Tables/Heads";
import { Plus } from "@strapi/icons";

const ListHeadsPage = () => {
  const { formatMessage } = useIntl();

  return (
    <Main>
      <HeaderLayout
        title={formatMessage({
          id: `${pluginId}.settings.page.heads.title`,
          defaultMessage: "Reavalidator heads",
        })}
        primaryAction={
          <>
            <LinkButton
              startIcon={<Plus />}
              to={`/settings/${pluginId}/heads/new`}
            >
              {formatMessage({
                id: `global.add-an-entry`,
                defaultMessage: `Add an entry`,
              })}
            </LinkButton>
          </>
        }
      />
      <ContentLayout>
        <HeadsTable />
      </ContentLayout>
    </Main>
  );
};

export default ListHeadsPage;
