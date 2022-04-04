<h1 align="center">🔥 Type safe pojo error will help you to easily create typed and serializable error.</h1>

<table align="center">
  <tr>
    <td>
      <a href="https://github.com/skarab42/ts-pojo-error/actions/workflows/CI.yaml">
        <img src="https://github.com/skarab42/ts-pojo-error/actions/workflows/CI.yaml/badge.svg">
      </a>
    </td>
    <td>
      <a href="https://codecov.io/gh/skarab42/ts-pojo-error">
        <img src="https://codecov.io/gh/skarab42/ts-pojo-error/branch/main/graph/badge.svg?token=4PSFJBVAFB">
      </a>
    </td>
    <td>
      <img src="https://img.shields.io/github/languages/code-size/skarab42/ts-pojo-error?color=success&style=flat">
    </td>
    <td>
      <img src="https://img.shields.io/github/license/skarab42/ts-pojo-error?color=success">
    </td>
    <td>
      <a href="https://github.com/sponsors/skarab42">
        <img src="https://img.shields.io/github/sponsors/skarab42?color=ff69b4&label=%E2%9D%A4%20sponsors%20">
      </a>
    </td>
    <td>
      <a href="https://www.twitch.tv/skarab42">
        <img src="https://img.shields.io/twitch/status/skarab42?style=social">
      </a>
    </td>
  </tr>
</table>

<p align="center">
  <img src="images/ts-pojo-error.gif">
</p>

# Intro

**The problem with exceptions is that once caught you don't know what type they are.** You can of course create a bunch of custom error classes and use `instanceof` to overcome this. The advantage of `ts-pojo-error` is that you have a single error type `PojoError` which can be easily typed and serialized.

# Features

- Type safe & autocompletion
- Serializable output
- Node or Browser
- ESM or CJS
- Well tested

# Usage

## Installation

```bash
pnpm add @skarab/ts-pojo-error # yarn and npm also works
```

## Defining an error factory

- **factory(** errors: `PojoErrorTypes` **)** : `PojoFactory`

An error factory is constructed from a `Record` where the key is the type of the error and the value is a `callback` that defines the `PojoError`.
The `callback` parameters define the parameters passed at the creation of the error and the return value defines the data of the error.

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

## Instantiating & Throwing errors

- **new(** type: `infered`, ...args: `infered[]` **)** : `PojoError`
- **throw(** type: `infered`, ...args: `infered[]` **)** : `never`

The first parameter is always the type of error, the following parameters are the ones you set in the factory.

> All parameters have support for autocompletion.

```ts
// action.ts

import { errors } from "./errors";

export function action() {
  // Do your awsome stuff...

  // ...something go wrong, throw an typed error
  throw errors.new("FATAL");

  // or with a custom error message
  throw errors.new("FATAL", "Oupsy!");

  // or by using the .throw helper
  errors.throw("FATAL");

  // or by using the fake enum
  errors.throw(errors.type.FATAL);
}
```

## Catching & Typing errors

- **is(** type: `infered`, error: `unknown` **)** : boolean
- **has(** error: `unknown` **)** : boolean

This is where it gets really interesting, the problem with exceptions is that once caught you don't know what type they are. You can of course create a bunch of custom error classes and use `instanceof` to overcome this. The advantage of `ts-pojo-error` is that you have a single error type `PojoError` which can be easily typed and serialized.

The `is` method is a [type guard](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates) that will narrow the error to the specific type if the original type is compatible.

> In the if block all properties are typed and have support for autocompletion.

```ts
// index.ts

import { action } from "./action";
import { errors } from "./errors";

try {
  action();
} catch (error) {
  error; // <- unknown type

  if (errors.is("FATAL", error)) {
    error; // <- PojoError instance with type "FATAL"

    error.message; // "Oupsy!": string

    error.type; // "FATAL": "FATAL"
    error.args; // ["Oupsy!"] : [message?: string | undefined]
    error.data; // { message: "Oupsy!" }: { message: string }

    error.toObject(); // { type, args, data, stack?: string | undefined }
    error.toJSON(); // string
  }

  if (errors.has(error)) {
    error.type; // "UNKNOWN" | "WARNING" | "FATAL" | ...
  }

  if (error instanceof PojoError) {
    error.type; // any (Bad!)
  }
}
```

# Contributing 💜

See [CONTRIBUTING.md](https://github.com/skarab42/ts-pojo-error/blob/main/CONTRIBUTING.md)
