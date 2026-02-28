import { api } from "../api.js";
import type { User } from "./user.api.type.js";

export const userApi = api.injectEndpoints({
  endpoints: build => ({
    getUser: build.query<Array<User>, void>({
      query: () => {
        return {
          url: "/users",
          method: "GET",
        };
      },
    }),
  }),
  overrideExisting: false,
});

export const { useLazyGetUserQuery } = userApi;
