import type { App } from "vue";
import { BackendClient } from "./api-backend";

const API = new BackendClient({
  BASE: import.meta.env.VITE_LANDSCAPE_API,
});

export default {
  install(app: App) {
    // eslint-disable-next-line no-param-reassign
    app.config.globalProperties.$API = API;
  },
};
export { API };
export type { ApiResponse, ApiResponseReject, ErrorDetails, ErrorLevel } from "@/plugins/api/core/CancelablePromise";
export { ignore, logReject } from "@/plugins/api/core/CancelablePromise";
