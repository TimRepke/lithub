/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $AnnotatedDocument = {
  properties: {
    doc_id: {
      type: 'number',
      isRequired: true,
    },
    nacsos_id: {
      type: 'string',
    },
    doi: {
      type: 'string',
    },
    title: {
      type: 'string',
      isRequired: true,
    },
    abstract: {
      type: 'string',
    },
    year: {
      type: 'number',
    },
    authors: {
      type: 'array',
      contains: {
        type: 'string',
      },
    },
    'x': {
      type: 'number',
      isRequired: true,
    },
    'y': {
      type: 'number',
      isRequired: true,
    },
    RowNum: {
      type: 'number',
    },
    annotations: {
      type: 'dictionary',
      contains: {
        type: 'array',
        contains: {
          type: 'string',
        },
      },
    },
  },
} as const;
