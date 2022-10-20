/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $SchemeInfo = {
  properties: {
    scheme_id: {
      type: 'number',
      isRequired: true,
    },
    label: {
      type: 'string',
      isRequired: true,
    },
    description: {
      type: 'string',
    },
    choices: {
      type: 'dictionary',
      contains: {
        type: 'number',
      },
      isRequired: true,
    },
    s2i: {
      type: 'dictionary',
      contains: {
        type: 'number',
      },
      isRequired: true,
    },
    i2s: {
      type: 'array',
      contains: {
        type: 'string',
      },
      isRequired: true,
    },
  },
} as const;
