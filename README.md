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
