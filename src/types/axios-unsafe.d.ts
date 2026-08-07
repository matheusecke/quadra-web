// axios does not ship types for its internal subpath exports, used only to test the
// paramsSerializer config against the real query-string builder axios runs at request time.
declare module 'axios/unsafe/helpers/buildURL.js' {
  export default function buildURL(url: string, params?: unknown, options?: unknown): string
}
