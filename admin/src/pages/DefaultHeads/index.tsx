import React from "react";

import pluginId from "../../pluginId";
import { Switch as WrongSwitch, Route as WrongRoute } from "react-router-dom";
import ListHeadsPage from "./List";
const Switch = WrongSwitch as any;
const Route = WrongRoute as any;

const HeadsPage = () => {
  return (
    <>
      <Switch>
        <Route
          path={`/settings/${pluginId}/default-heads`}
          component={ListHeadsPage}
          exact
        />
        <Route
          path={`/settings/${pluginId}/default-heads/page/:page`}
          component={ListHeadsPage}
          exact
        />
      </Switch>
    </>
  );
};

export default HeadsPage;
