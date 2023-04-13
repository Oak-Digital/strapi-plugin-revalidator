export default {
  kind: 'collectionType',
  collectionName: 'head',
  info: {
    singularName: 'head', // kebab-case mandatory
    pluralName: 'heads', // kebab-case mandatory
    displayName: 'Head',
    description: 'The heads of the application',
  },
  options: {
    draftAndPublish: false,
  },
  pluginOptions: {
    'content-manager': {
      visible: false,
    },
    'content-type-builder': {
      visible: false,
    }
  },
  attributes: {
    title: {
      type: 'string',
      min: 1,
      max: 100,
      configurable: false,
    },
    headType: {
      type: 'string',
      min: 1,
      max: 50,
      configurable: false,
    },
  }
};
