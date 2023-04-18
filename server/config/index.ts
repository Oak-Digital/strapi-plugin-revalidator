import { configType } from "../../types/config";

export default {
  default: {
  },
  validator(config: any) {
    // validate config from schema
    configType.parse(config);
  },
};
