# Strapi plugin revalidator

This plugin is meant to create webhooks, but specifically for cache invalidations or page revalidations of your frontend applications.

In this plugin the word head is the head of your application. Of course Strapi is headless, but the frontends (heads) should still be updated when you update the data in strapi.
By relying on caching in the heads, it can take a lot of workload off of your strapi instance.

This plugin let's you set up different types of heads and define rules for each of them for when a page or some content needs to be revalidated.

## Features

- [x] Define multiple head types
- [x] Define rules for each head on how strapi should revalidate each content type
- [ ] dynamic url builder
- [ ] Use GET parameters
- [ ] Use POST parameters
- [ ] Manual revalidate button on content types
- [ ] Heads defined from environment variables

* Integrations with preview deployments: (Make sure strapi revalidates those too)
  - [ ] Vercel
  - [ ] Coolify

## Plugin support / integrations

- [ ] [UI Navigation](https://github.com/VirtusLab-Open-Source/strapi-plugin-navigation)
- [ ] [url-alias](https://github.com/strapi-community/strapi-plugin-url-alias)

## Getting started

Install the plugin

```
npm i @oak-digital/strapi-plugin-revalidator
```

## Configuration

The configuration has multiple parts.

The first thing to notice is `headTypes`. `headTypes` are used to describe the different types of heads for the application.
One might be a nextjs frontend and another could be a mobile app cache or github pages.

`headTypes` should be a record, where the keys are the names of the head types used.

example:

```typescript
{
  headTypes: {
    nextjs: {
      // ...
    },
    githubPages: {
      // ...
    },
  },
}
```

`headTypes` should define customizable fields which are used to configure your heads with specific fields. These fields can be used to prepare a url or headers for a revalidation request.

example:

```typescript
{
  nextjs: {
    fields: {
      endpoint: {},
      secret: {},
    },
  },
}
```

each `headTypes` should also define which content types makes them revalidate. For example you might have a `page` content type that should revalidate when changed.
You may also have designated pages for quotes or testimonials that needs to be revalidated in some other way.

example:

```typescript
{
  nextjs: {
    // ...
    'api::page.page': {
      prepareFn: async (strapi, fields, page) => {
        // ...
        return {
          url
        };
      },
      // state is what is returned from prepareFn
      revalidateFn: async (state) => {
        // ...
        fetch(state.url);
      }
    },
  }
}
```

Here we have also defined a prepare function, which should prepare the revalidations.
We have also defined a revalidate function which should trigger the actual revalidation.
This function is run after the changes in strapi has persisted. This makes it possible for the heads to fetch the newest available data.

Full example:

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
            'api::page.page': {
              prepareFn: async (strapi, fields, page) => {
                const { endpoint, secret } = fields;
                try {
                  const finalParams = {
                    url: page.url,
                    secret,
                  };
                  const finalUrl = `${endpoint}?${qs.stringify(finalParams)}`;
                  return {
                    finalUrl,
                  };
                } catch (e) {
                  console.error(e);
                }
              },
              revalidateFn: async (state) => {
                try {
                  const data = await fetch(state.finalUrl);
                } catch (e) {
                  console.error(e);
                }
              },
              // revalidateOn: {
              //   page: {
              //     ifReferenced: true,
              //     revalidationType: 'soft',
              //   },

              //   article: [
              //     {
              //       ifReferenced: true,
              //     },
              //     {
              //       // This should probably be changed in later versions, so it doesn't run on ALL pages
              //       predicate(page, article) {
              //         return page.attributes.content.some((block) => block.__component === 'LatestArticles');
              //       },
              //     },
              //   ],

              //   quote: {
              //     ifReferenced: true,
              //     revalidationType: 'soft',
              //   },
              // },
            },
            'api::quote.quote': {
              prepareFn: async (strapi, fields, quote) => {
                const { endpoint, secret } = fields;
                const finalUrl = `${endpoint}/quotes/${quote.id}?${qs.stringify({ secret })}`
                return {
                  finalUrl,
                },
              },
              revalidateFn: async (state) => {
                try {
                  await fetch(state.finalUrl)
                } catch (e) {

                }
              },
            },
          },
        },
      },

      // Hard coded heads - this may be good for monorepos
      // Not implemented
      //defaultHeads: {
      //  myFrontend: [
      //    {
      //      // myFrontend's fields
      //      endpoint: env("FRONTEND_ENDPOINT"),
      //      secret: env("REVALIDATION_SECRET"),
      //    },
      //  ],
      //},
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
