import pluginId from "../pluginId";

export const STATE_KEY = `__${pluginId.toUpperCase()}` as `__${Uppercase<typeof pluginId>}`;
