import { defineConfig } from "orval";

export default defineConfig({
  gbfoods: {
    input: "../api/openapi/openapi.json",
    output: {
      mode: "tags-split",
      target: "./src/lib/api/generated",
      schemas: "./src/lib/api/generated/model",
      client: "react-query",
      httpClient: "axios",
      override: {
        mutator: {
          path: "./src/lib/api/custom-fetch.ts",
          name: "customFetch",
        },
      },
    },
  },
});
