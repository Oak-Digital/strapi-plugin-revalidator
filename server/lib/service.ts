import { Strapi } from '@strapi/strapi';
import { IStrapi } from 'strapi-typed';
import pluginId from '../pluginId';

export const getService = (strapi: IStrapi | Strapi, name: string) => {
  return strapi.plugin(pluginId).services[name];
}
