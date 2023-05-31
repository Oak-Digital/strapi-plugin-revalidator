export const getMulti = (object: any, path: string[]) => {
  let currentObjects = [object];
  for (const key of path) {
    currentObjects = currentObjects.flatMap((obj) => {
      const objs = Array.isArray(obj) ? obj : [obj];
      return objs.map((o) => {
        if (o[key] === undefined || o[key] === null) {
          return [];
        }
        return o[key];
      });
    });
  }

  return currentObjects;
};
