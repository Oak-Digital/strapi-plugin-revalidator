import { prefixPluginTranslations } from "@strapi/helper-plugin";

import pluginPkg from "../../package.json";
import pluginId from "./pluginId";
import Initializer from "./components/Initializer";
import PluginIcon from "./components/PluginIcon";

const name = pluginPkg.strapi.name;

export default {
  register(app: any) {
    //app.addMenuLink({
    //  to: `/plugins/${pluginId}`,
    //  icon: PluginIcon,
    //  intlLabel: {
    //    id: `${pluginId}.plugin.name`,
    //    defaultMessage: name,
    //  },
    //  Component: async () => {
    //    const component = await import(/* webpackChunkName: "[request]" */ './pages/App');

    //    return component;
    //  },
    //  permissions: [
    //    // Uncomment to set the permissions of the plugin here
    //    // {
    //    //   action: '', // the action name should be plugin::plugin-name.actionType
    //    //   subject: null,
    //    // },
    //  ],
    //});

    app.createSettingSection(
      {
        id: `${pluginId}.plugin.name`,
        intlLabel: {
          id: `${pluginId}.plugin.name`,
          defaultMessage: name,
        },
      },
      [
        {
          id: `${pluginId}.plugin.heads`,
          intlLabel: {
            id: `${pluginId}.titles.heads`,
            defaultMessage: "Heads",
          },
          to: `/settings/${pluginId}/heads`,
          Component: async () => {
            const component = await import(
              /* webpackChunkName: "revalidator-heads" */ "./pages/Heads"
            );

            return component;
          },
        },
        {
          id: `${pluginId}.plugin.default-heads`,
          intlLabel: {
            id: `${pluginId}.titles.default-heads`,
            defaultMessage: "Default Heads",
          },
          to: `/settings/${pluginId}/default-heads`,
          Component: async () => {
            const component = await import(
              /* webpackChunkName: "revalidator-default-heads" */ "./pages/DefaultHeads"
            );

            return component;
          },
        }
      ]
    );

    const plugin = {
      id: pluginId,
      initializer: Initializer,
      isReady: false,
      name,
    };

    app.registerPlugin(plugin);
  },

  bootstrap(app: any) {},

  async registerTrads(app: any) {
    const { locales } = app;

    const importedTrads = await Promise.all(
      (locales as any[]).map((locale) => {
        return import(`./translations/${locale}.json`)
          .then(({ default: data }) => {
            return {
              data: prefixPluginTranslations(data, pluginId),
              locale,
            };
          })
          .catch(() => {
            return {
              data: {},
              locale,
            };
          });
      })
    );

    return Promise.resolve(importedTrads);
  },
};
