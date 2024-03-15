/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $Dataset = {
  properties: {
    info: {
      type: 'DatasetInfo',
      isRequired: true,
    },
    db: {
      type: 'DatasetDatabase',
      isRequired: true,
    },
    key: {
      type: 'string',
      isRequired: true,
    },
    secret: {
      type: 'string',
    },
    has_tiles: {
      type: 'boolean',
      isRequired: true,
    },
  },
} as const;
