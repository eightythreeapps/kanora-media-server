module.exports = {
  schema: './apps/api/src/db/schema/*',
  out: './apps/api/src/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'file:./data/kanora.db',
  },
};
