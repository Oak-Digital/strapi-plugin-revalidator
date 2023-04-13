import React from "react";

import { ContentLayout, HeaderLayout } from "@strapi/design-system";

import { useIntl } from "react-intl";
import pluginId from "../../pluginId";

const HeadsPage = () => {
  const { formatMessage } = useIntl();
  return (
    <div>
      <HeaderLayout
        title={formatMessage({
          id: `${pluginId}.settings.page.heads.title`,
          defaultMessage: "Reavalidator heads",
        })}
        subtitle={formatMessage({
          id: `${pluginId}.settings.page.heads.subtitle`,
          defaultMessage:
            "Define endpoints and settings for the heads of this application",
        })}
      />

      <ContentLayout>
        Hello world
      </ContentLayout>
    </div>
  );
};

export default HeadsPage;
