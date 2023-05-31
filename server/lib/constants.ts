import pluginId from "../pluginId";

export const STATE_KEY: `__${Uppercase<typeof pluginId>}` = `__${pluginId.toUpperCase()}` as any;
