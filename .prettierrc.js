module.exports = {
  singleQuote: true,
  trailingComma: 'all',
  overrides: [
    {
      files: ['*.ts'],
      parser: 'typescript',
    },
    {
      files: ['*.json'],
      options: {
        parser: 'json',
        trailingComma: 'none',
      },
    },
    {
      files: ['tsconfig.json'],
      options: {
        parser: 'json5',
      },
    },
  ],
};
