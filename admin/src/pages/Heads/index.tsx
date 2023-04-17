import React from "react";

import { ContentLayout, HeaderLayout } from "@strapi/design-system";

import { useIntl } from "react-intl";
import pluginId from "../../pluginId";
import { Switch as WrongSwitch, Route as WrongRoute } from "react-router-dom";
import CreateHeadsPage from "./Create";
const Switch = WrongSwitch as any;
const Route = WrongRoute as any;

const HeadsPage = () => {
  const { formatMessage } = useIntl();
  return (
    <>
    {/* <div> */}
    {/*   <HeaderLayout */}
    {/*     title={formatMessage({ */}
    {/*       id: `${pluginId}.settings.page.heads.title`, */}
    {/*       defaultMessage: "Reavalidator heads", */}
    {/*     })} */}
    {/*     subtitle={formatMessage({ */}
    {/*       id: `${pluginId}.settings.page.heads.subtitle`, */}
    {/*       defaultMessage: */}
    {/*         "Define endpoints and settings for the heads of this application", */}
    {/*     })} */}
    {/*   /> */}
    {/**/}
    {/*   <ContentLayout> */}
    {/*     Hello world */}
    {/*   </ContentLayout> */}
    {/* </div> */}
    {/* <CheckPagePermissions permissions={pluginPermissions['settings.patterns']}> */}
      <Switch>
        <Route
          path={`/settings/${pluginId}/heads/new`}
          component={CreateHeadsPage}
          exact
        />
        {/* <Route path={`/settings/${pluginId}/heads/:id`} component={PatternsEditPage} exact /> */}
        {/* <Route path={`/settings/${pluginId}/heads`} component={PatternsListPage} exact /> */}
        {/* <Route path="" component={NotFound} /> */}
      </Switch>
    {/* </CheckPagePermissions> */}
    </>
  );
};

export default HeadsPage;
