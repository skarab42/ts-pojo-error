[![Test and Lint](https://github.com/skarab42/ts-pojo-error/actions/workflows/CI.yaml/badge.svg)](https://github.com/skarab42/ts-pojo-error/actions/workflows/CI.yaml) [![codecov](https://codecov.io/gh/skarab42/ts-pojo-error/branch/main/graph/badge.svg?token=4PSFJBVAFB)](https://codecov.io/gh/skarab42/ts-pojo-error) ![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/skarab42/ts-pojo-error?color=success&style=flat) ![GitHub](https://img.shields.io/github/license/skarab42/ts-pojo-error?color=success) [![GitHub Sponsors](https://img.shields.io/github/sponsors/skarab42?color=ff69b4&label=%E2%9D%A4%20sponsors%20)](https://github.com/sponsors/skarab42) [![Twitch Status](https://img.shields.io/twitch/status/skarab42?style=social)](https://www.twitch.tv/skarab42)

> 🔥 Type safe pojo error will help you to easily create a typed and serializable error collection.

# Features

- Type safe & autocompletion
- Serializable output
- Node or Browser
- ESM or CJS
- Well tested

# Install

```bash
pnpm add @skarab/ts-pojo-error # yarn and npm also works
```

# Example

```ts
// errors.ts

import { factory } from "@skarab/ts-pojo-error";

export const errors = factory({
  UNKNOWN: () => ({ message: "Unknown error..." }),
  WARNING: (message: string) => ({ message, time: Date.now() }),
  FATAL: (message?: string) => ({ message: message ?? "Fatal error" }),
  EXIT: (message: string, code: number) => ({ message, code }),
});
```

```ts
// action.ts

import { errors } from "./errors";

export function action() {
  // ... something go wrong, throw an error
  throw errors.new("FATAL", "Oupsy!");
}
```

```ts
// index.ts

import { action } from "./action";

try {
  action();
} catch (error) {
  error; // <- unknown type

  if (errors.is("FATAL", error)) {
    error; // <- PojoErrorIntsance with FATAL type
    error.type; // "FATAL": "FATAL"
    error.args; // ["Oupsy!"] : [message?: string | undefined]
    error.data; // { message: "Oupsy!" }: { message: string }
    error.message; // "Oupsy!": string
  }
}
```

# Contributing 💜

See [CONTRIBUTING.md](https://github.com/skarab42/ts-pojo-error/blob/main/CONTRIBUTING.md)
