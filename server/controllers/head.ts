export default {
  findMany: async (ctx) => {
    try {
      /* const pathEntities = await getPluginService("pathService").findMany(true); */
      /* ctx.send(pathEntities); */
    } catch (err) {
      ctx.status = err.status || 500;
      ctx.body = err.message;
      ctx.app.emit("error", err, ctx);
    }
  },
};
