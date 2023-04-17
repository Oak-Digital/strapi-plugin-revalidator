import React from "react";

import { ContentLayout, HeaderLayout } from "@strapi/design-system";

import { useIntl } from "react-intl";
import pluginId from "../../pluginId";
import { Switch as WrongSwitch, Route as WrongRoute } from "react-router-dom";
import CreateHeadsPage from "./Create";
import EditHeadsPage from "./Edit";
import ListHeadsPage from "./List";
const Switch = WrongSwitch as any;
const Route = WrongRoute as any;

const HeadsPage = () => {
  return (
    <>
      <Switch>
        <Route
          path={`/settings/${pluginId}/heads/new`}
          component={EditHeadsPage}
          exact
        />
        <Route
          path={`/settings/${pluginId}/heads/edit/:id`}
          component={EditHeadsPage}
          exact
        />
        <Route
          path={`/settings/${pluginId}/heads`}
          component={ListHeadsPage}
          exact
        />
      </Switch>
    </>
  );
};

export default HeadsPage;
