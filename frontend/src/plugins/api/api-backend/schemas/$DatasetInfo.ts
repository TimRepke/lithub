/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $DatasetInfo = {
  properties: {
    name: {
      type: 'string',
      isRequired: true,
    },
    description: {
      type: 'string',
      isRequired: true,
    },
    type: {
      type: 'Enum',
      isRequired: true,
    },
  },
} as const;
