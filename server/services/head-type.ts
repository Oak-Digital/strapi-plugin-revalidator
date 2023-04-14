import { Strapi } from '@strapi/strapi';
import { IStrapi } from 'strapi-typed';
import { HeadTypeConfig } from '../../types/head-type-config';
import { Config } from '../../types/config';

export default ({ strapi }: { strapi: IStrapi }) => ({
  getHeadTypesKeys: () => {
    const headTypesConfig = strapi.plugin('revalidator').config('headTypes');
    const headTypesKeys = Object.keys(headTypesConfig);
    return headTypesKeys;
  },
  isValid: (headType: string) => {
    const headTypesConfig = strapi.plugin('revalidator').config('headTypes');
    const headTypesKeys = Object.keys(headTypesConfig);
    return headTypesKeys.includes(headType);
  },

  getFieldKeys: (headType: string) => {
    const headTypesConfig: Config['headTypes'] = strapi.plugin('revalidator').config('headTypes');
    const headTypes = headTypesConfig ?? {};

    // TODO: should we check if the headType is valid here?

    const fields = headTypes[headType].fields ?? {};
    const keys = Object.keys(fields);
    return keys;
  },
});
