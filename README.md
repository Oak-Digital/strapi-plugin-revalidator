# Strapi plugin revalidator

This plugin is meant to create webhooks, but specifically for cache invalidations or page revalidations of your frontend applications.

In this plugin the word head is the head of your application. Of course Strapi is headless, but the frontends (heads) should still be updated when you update the data in strapi.
By relying on caching in the heads, it can take a lot of workload off of your strapi instance.

This plugin let's you set up different types of heads and define rules for each of them for when a page or some content needs to be revalidated.

## Features

- [x] Define multiple head types
- [x] Define rules for each head on how strapi should revalidate each content type
- [x] Define rules for how each content type should be revalidated based on relations
  - [x] Revalidate based on relations in fields and components
  - [x] Revalidate based on relations in dynamic zones
- [x] dynamic url builder
- [x] Use GET parameters
- [ ] Use POST parameters
- [ ] Manual revalidate button on content types
- [x] Heads defined from environment variables

* Integrations with preview deployments: (Make sure strapi revalidates those too)
  - [ ] Vercel
  - [ ] Coolify

## Plugin support / integrations

- [x] [UI Navigation](https://github.com/VirtusLab-Open-Source/strapi-plugin-navigation) (see Integrations on this page)
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

### Fields

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

### `prepareFn: (strapi, fields, entry) => any`

each `headTypes` should also define which content types makes them revalidate. For example you might have a `page` content type that should revalidate when changed.
You may also have designated pages for quotes or testimonials that needs to be revalidated in some other way.

To revalidate, you first need to prepare urls or whatever you need in the `prepareFn`. The `prepareFn` should return a state to be used for the `revalidateFn`.
By default the `revalidateFn` will simply do a fetch based on the following fields from the returned state.

```typescript
{
  url,
  body,
  params,
  method,
}
```

`url` is the url to request.
`body` is the data that should be sent in the body.
`params` is an object of query parameters that will be added to the `url`.
`method` is the method that should be used to request, by default `"POST"` is used.

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
    },
  }
}
```

You may want to do something else than just making a request in the revalidation function. This can be customized by changing the `revalidateFn`.
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

### Logging

Different log levels are available (`none`, `info` and `debug`)

`none`: revalidator will never log anything

`info` (default): Will log whenever something is revalidated and other useful info.

`debug`: extra logs mostly used for debugging.

It can be configured in the following way

```typescript
{
  config: {
    logging: {
      level: "info",
    },
  },
}
```

### Full example

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
              revalidateOn: {
                page: {
                  ifReferenced: true,
                  revalidationType: 'soft',
                },

                article: [
                  {
                    ifReferenced: true,
                  },
                  // {
                  //   // This should probably be changed in later versions, so it doesn't run on ALL pages
                  //   predicate(page, article) {
                  //     return page.attributes.content.some((block) => block.__component === 'LatestArticles');
                  //   },
                  // },
                ],

                quote: {
                  ifReferenced: true,
                  revalidationType: 'soft',
                },
              },
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
      defaultHeads: {
        myFrontend: [
          {
            name: "My primary frontend",
            // myFrontend's fields
            fields: {
              endpoint: env("FRONTEND_ENDPOINT"),
              secret: env("REVALIDATION_SECRET"),
            },
          },
        ],
      },
    },
  },
});
```

## Integrations

### UI Navigation

It is simple to revalidate all entries of a content type when a navigation item is changed: add the following to your revalidateOn object for the content type you want to revalidate.

```typescript
{
  // your other revalidateOn contentTypes...
  "plugin::navigation.navigation-item": {
    revalidationType: "soft"
  }
}
```

example of revalidating page

```typescript
{
  // ...
  "api::page.page": {
    prepareFn: () => {},
    revalidateOn: {
      "plugin::navigation.navigation-item": {
        revalidationType: "soft",
      },
      // ... your other rules
    },
  },
  // ...
}
```

## Development

To develop on this plugin use the playground in this repo.

```bash
cd playground
```

Install dependencies with the

```bash
npm install
```

Then to make sure the build is always up to date run

```bash
npm run develop
```

In another terminal go to the playground folder and run `strapi develop --watch-admin`. This can probably also be run like the following depending on your setup.

```bash
npm run develop -- --watch-admin
```
