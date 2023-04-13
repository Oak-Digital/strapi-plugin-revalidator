export default {
  kind: "collectionType",
  collectionName: "head-field",
  info: {
    singularName: "head-field", // kebab-case mandatory
    pluralName: "head-fields", // kebab-case mandatory
    displayName: "Head field",
    description: "A field for a head",
  },
  options: {
    draftAndPublish: true,
  },
  pluginOptions: {
    "content-manager": {
      visible: false,
    },
    "content-type-builder": {
      visible: false,
    },
  },
  attributes: {
    // Head and key should be a unique pair, but this doesn't seem to be possible in Strapi
    head: {
      required: true,
      type: "relation",
      relation: "manyToOne",
      target: "plugin::revalidator.head",
      configurable: false,
    },
    key: {
      type: "string",
      min: 1,
      max: 50,
      configurable: false,
    },
    value: {
      type: "string",
      configurable: false,
    }
  },
};
