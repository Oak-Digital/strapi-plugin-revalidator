import pluginPkg from '../package.json';

/* const pluginId = pluginPkg.name.replace(/^(@[^-,.][\w,-]+\/|strapi-)plugin-/i, ''); */
// TODO: typescript doesn't import json as literals 
const pluginId = pluginPkg.strapi.name as 'revalidator';

export default pluginId;
