const Strapi = require("@strapi/strapi");
const fs = require("fs");
const path = require("path");

let instance;

const playgroundDir = path.join(__dirname, '..', 'playground');
const distDir = path.join(playgroundDir, 'dist');

/**
 * Setups strapi for futher testing
 */
async function setupStrapi() {
  if (!instance) {
    /** the follwing code in copied from `./node_modules/strapi/lib/Strapi.js` */
    await Strapi({
      appDir: playgroundDir,
      distDir,
    }).load();

    instance = strapi; // strapi is global now

    await instance.server.mount();
  }
  return instance;
}

/**
 * Closes strapi after testing
 */
async function stopStrapi() {
  if (instance) {
    await instance.server.httpServer.close();
    await instance.db.connection.destroy();
    instance.destroy();
    const tmpDbFile = strapi.config.get(
      "database.connection.connection.filename"
    );

    if (fs.existsSync(tmpDbFile)) {
      fs.unlinkSync(tmpDbFile);
    }

  }
  return instance;
}

module.exports = {
  setupStrapi,
  stopStrapi,
}
