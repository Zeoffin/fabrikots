declare module 'js-cookie' {
  interface CookieAttributes {
    expires?: number | Date;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  }

  interface CookiesStatic {
    get(): { [key: string]: string };
    get(name: string): string | undefined;
    set(name: string, value: string | object, options?: CookieAttributes): string | undefined;
    remove(name: string, options?: CookieAttributes): void;
    withAttributes(attributes: CookieAttributes): CookiesStatic;
    withConverter(converter: { read?(value: string, name: string): string; write?(value: string, name: string): string }): CookiesStatic;
  }

  const Cookies: CookiesStatic;
  export = Cookies;
}