# Strapi plugin revalidator

WIP

This plugin is meant to create webhooks, but specifically for cache invalidations or page revalidations of your frontend applications.

In this plugin the word head is the head of your application. Of course Strapi is headless, but the frontends (heads) should still be updated when you update the data in strapi.
By relying on caching in the heads, it can take a lot of workload off of your strapi instance.

This plugin let's you set up different types of heads and define rules for each of them for when a page or some content needs to be revalidated.

## Features

- [ ] Define multiple head types
- [ ] Define rules for each head on how strapi should revalidate each content type
- [ ] dynamic url builder
- [ ] Use GET parameters
- [ ] Use POST parameters
- [ ] Manual revalidate button on content types

* Integrations with preview deployments: (Make sure strapi revalidates those too)
  - [ ] Vercel
  - [ ] Coolify

## Plugin support

- [ ] [UI Navigation](https://github.com/VirtusLab-Open-Source/strapi-plugin-navigation)
- [ ] [url-alias](https://github.com/strapi-community/strapi-plugin-url-alias)

## Getting started

Install the plugin

```
npm i strapi-plugin-revalidator
```

## Configuration

```typescript
export default ({ env }) => ({
  revalidator: {
    enable: true,
    config: {
      headTypes: {
        myFrontend: {
          // fields that can be configured
          fields: {
            endpoint: {
              type: "string",
            },
            secret: {
              type: "string",
            },
          },

          // Define the revalidation rules for each content type
          contentTypes: {
            page: {
              revalidateOn: {
                page: {
                  ifReferenced: true,
                  revalidationType: 'soft',
                },

                article: [
                  {
                    ifReferenced: true,
                  },
                  {
                    // This should probably be changed in later versions, so it doesn't run on ALL pages
                    predicate(page, article) {
                      return page.attributes.content.some((block) => block.__component === 'LatestArticles');
                    },
                  },
                ],

                quote: {
                  ifReferenced: true,
                  revalidationType: 'soft',
                },
              },
            },

            quote: {
            },
          },
        },
      },

      // Hard coded heads - this may be good for monorepos
      defaultHeads: {
        myFrontend: [
          {
            // myFrontend's fields
            endpoint: env("FRONTEND_ENDPOINT"),
            secret: env("REVALIDATION_SECRET"),
          },
        ],
      },
    },
  },
});
```

## Development

To develop on this plugin first open a strapi project and navigate to `src/plugins/` and clone this repo or your fork

```bash
cd src/plugins
git clone git@github.com:Oak-Digital/strapi-plugin-revalidator.git revalidator
cd revalidator
```

Install dependencies with the `--force` flag for some reason

```bash
npm install --force
```

Then to make sure the build is always up to date run

```bash
npm run develop
```

Add the following basic config to `config/plugins.ts`

```typescript
export default ({ env }) => ({
  // ...
  revalidator: {
    enabled: true,
    resolve: "./src/plugins/revalidator",
  },
  // ...
});
```

In another terminal go to the root of your project and run `strapi develop --watch-admin`. This can probably also be run like the following depending on your setup.

```bash
npm run develop -- --watch-admin
```
