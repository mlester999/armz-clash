import nodeConfig from '@armz-clash/eslint-config/node';

export default [
  ...nodeConfig,
  {
    rules: {
      'no-console': 'off',
    },
  },
];
