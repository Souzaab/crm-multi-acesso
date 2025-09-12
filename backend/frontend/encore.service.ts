
import { api } from "encore.dev/api";
import { Service } from "encore.dev/service";

export default new Service("frontend", {
  devUI: false,
  disableAPIExplorer: true,
  middlewares: []
});

export const assets = api.static({
  path: "/*path",
  expose: true,
  dir: "./dist",
  notFound: "./dist/index.html",
  notFoundStatus: 200,
});
