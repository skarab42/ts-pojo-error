/* eslint-disable @typescript-eslint/explicit-function-return-type */

type User = { name: string; isAdmin: boolean };
type StringTooShort = { minLength: number; input: string };

export const errors = {
  UNKNOWN() {
    return { message: "Unknown error..." };
  },

  WARNING(message: string) {
    return { message, code: 42 };
  },

  FATAL(message?: string) {
    return { message: message ?? "Fatal error" };
  },

  PAGE_NOT_FOUND(url: string, user?: User) {
    return { message: `Page Not Found: ${url}`, request: { url, user } };
  },

  STRING_TOO_SHORT({ minLength, input }: StringTooShort) {
    const received = input.length;
    return {
      message: `String too short! Expected '${minLength}', received '${received}'`,
      collected: { input, minLength, received },
    };
  },
};

export const errorsArray = [
  "UNKNOWN",
  "WARNING",
  "FATAL",
  "PAGE_NOT_FOUND",
  "STRING_TOO_SHORT",
] as const;

export const errorsEnum = {
  UNKNOWN: "UNKNOWN",
  WARNING: "WARNING",
  FATAL: "FATAL",
  PAGE_NOT_FOUND: "PAGE_NOT_FOUND",
  STRING_TOO_SHORT: "STRING_TOO_SHORT",
} as const;

export type ErrorsArray = typeof errorsArray;
export type ErrorsUnion = ErrorsArray[number];
export type ErrorsEnum = { [Key in ErrorsUnion]: Key };
