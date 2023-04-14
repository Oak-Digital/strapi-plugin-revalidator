import { IStrapi } from 'strapi-typed';
import pluginId from '../pluginId';

export const getService = (strapi: IStrapi, name: string) => {
  return strapi.plugin(pluginId).services[name];
}
