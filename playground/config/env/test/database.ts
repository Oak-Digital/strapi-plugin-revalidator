import path from 'path';

export default ({ env }) => {
  return {
    connection: {
      client: 'sqlite',
      useNullAsDefault: true,
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 10000),
      connection: {
        filename: path.join(
          __dirname,
          '..',
          '..',
          env('DATABASE_FILENAME', '.tmp/test.db')
        ),
      }
    }
  };
}
