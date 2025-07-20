export const okResponse = <Data>(data: Data) => ({
  meta: {
    ok: true,
  },
  data,
});
