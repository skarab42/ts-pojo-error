// ---------------------------------------------------------------------------
// Pojo Types
// ---------------------------------------------------------------------------
export type Unwrap<TType> = TType extends Record<string, unknown>
  ? { [TKey in keyof TType]: TType[TKey] }
  : TType;

export type PojoErrorPayload = { message: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PojoErrorCallback = (...args: any) => PojoErrorPayload;

export type PojoErrorTypes = Record<string, PojoErrorCallback>;

export type PojoEnum<TErrorTypes> = { [TKey in keyof TErrorTypes]: TKey };

export type PojoFakeEnum<TErrorTypes> = {
  enumObject: PojoEnum<TErrorTypes>;
  enumKeys: [keyof TErrorTypes];
};

export type PojoErrorInstance<
  TErrorTypes extends PojoErrorTypes,
  TType extends keyof TErrorTypes,
> = PojoError<
  TType,
  Parameters<TErrorTypes[TType]>,
  ReturnType<TErrorTypes[TType]>
>;

export type NewPojoError<TErrorTypes extends PojoErrorTypes> = <
  TType extends keyof TErrorTypes,
>(
  type: TType,
  ...args: [...Parameters<TErrorTypes[TType]>]
) => PojoErrorInstance<TErrorTypes, TType>;

export type ThrowPojoError<TErrorTypes extends PojoErrorTypes> = <
  TType extends keyof TErrorTypes,
>(
  type: TType,
  ...args: [...Parameters<TErrorTypes[TType]>]
) => never;

export type NewPojoErrorWithCause<TErrorTypes extends PojoErrorTypes> = <
  TType extends keyof TErrorTypes,
>(
  cause: Error,
  type: TType,
  ...args: [...Parameters<TErrorTypes[TType]>]
) => PojoErrorInstance<TErrorTypes, TType>;

export type ThrowPojoErrorWithCause<TErrorTypes extends PojoErrorTypes> = <
  TType extends keyof TErrorTypes,
>(
  cause: Error,
  type: TType,
  ...args: [...Parameters<TErrorTypes[TType]>]
) => never;

export type PojoFactory<TErrorTypes extends PojoErrorTypes> = {
  type: Unwrap<PojoEnum<TErrorTypes>>;
  errors: TErrorTypes;
  new: NewPojoError<TErrorTypes>;
  newFrom: NewPojoErrorWithCause<TErrorTypes>;
  throw: ThrowPojoError<TErrorTypes>;
  throwFrom: ThrowPojoErrorWithCause<TErrorTypes>;
  is: <TType extends keyof TErrorTypes>(
    type: TType,
    error: unknown,
  ) => error is PojoErrorInstance<TErrorTypes, TType>;
  has: <TType extends keyof TErrorTypes>(
    error: unknown,
  ) => error is PojoErrorInstance<TErrorTypes, TType>;
};

export type PojoObjectCause = PojoObject<
  string,
  [unknown, ...unknown[]],
  PojoErrorPayload
>;

export type PojoObject<
  TType,
  TArgs extends [unknown, ...unknown[]],
  TPojo extends PojoErrorPayload,
> = {
  type: TType;
  args: TArgs;
  data: TPojo;
  stack: string | undefined;
  cause: PojoObjectCause | undefined;
};

// ---------------------------------------------------------------------------
// PojoError Class
// ---------------------------------------------------------------------------
export class PojoError<
  TType,
  TArgs extends [unknown, ...unknown[]],
  TPojo extends PojoErrorPayload,
> extends Error {
  readonly type: TType;
  readonly args: TArgs;
  readonly data: TPojo;
  override readonly cause?: Error;

  constructor(
    type: TType,
    args: TArgs,
    data: TPojo,
    options: { cause?: Error; constructorOpt?: Function },
  ) {
    super();

    this.type = type;
    this.args = args;
    this.data = data;
    this.message = data.message;
    this.name = this.constructor.name;

    // @ts-expect-error error TS2412: Type 'Error | undefined' is not
    // assignable to type 'Error' with 'exactOptionalPropertyTypes: true'.
    this.cause = options.cause;

    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, options.constructorOpt);
    }

    Object.setPrototypeOf(this, new.target.prototype);
  }

  causeToObject(): PojoObjectCause | undefined {
    if (!this.cause) {
      return undefined;
    }

    if (this.cause instanceof PojoError) {
      return this.cause.toObject();
    }

    return {
      type: this.cause.name,
      args: [this.cause.message],
      data: { message: this.cause.message },
      stack: this.cause.stack,
      cause: undefined,
    };
  }

  toObject(): Unwrap<PojoObject<TType, TArgs, TPojo>> {
    return {
      type: this.type,
      args: [...this.args],
      data: { ...this.data },
      stack: this.stack,
      cause: this.causeToObject(),
    };
  }

  toJSON(): string {
    return JSON.stringify(this.toObject());
  }
}

// ---------------------------------------------------------------------------
// PojoError Factory
// ---------------------------------------------------------------------------
function fakeEnum<TErrorTypes extends PojoErrorTypes>(
  errors: TErrorTypes,
): PojoFakeEnum<TErrorTypes> {
  const enumKeys = Object.keys(errors) as [keyof TErrorTypes];
  const enumObject = Object.create(null) as PojoEnum<TErrorTypes>;

  enumKeys.forEach((key) => (enumObject[key] = key));

  return { enumObject, enumKeys };
}

export function factory<TErrorTypes extends PojoErrorTypes>(
  errors: TErrorTypes,
): Unwrap<PojoFactory<TErrorTypes>> {
  const { enumObject } = fakeEnum(errors);

  function newError<TType extends keyof TErrorTypes>(
    type: TType,
    ...args: [...Parameters<TErrorTypes[TType]>]
  ): PojoErrorInstance<TErrorTypes, TType> {
    const func = errors[type] as TErrorTypes[TType];
    const data = func(...args) as ReturnType<TErrorTypes[TType]>;

    return new PojoError(type, args, data, { constructorOpt: newError });
  }

  function newFromError<TType extends keyof TErrorTypes>(
    cause: Error,
    type: TType,
    ...args: [...Parameters<TErrorTypes[TType]>]
  ): PojoErrorInstance<TErrorTypes, TType> {
    const func = errors[type] as TErrorTypes[TType];
    const data = func(...args) as ReturnType<TErrorTypes[TType]>;

    return new PojoError(type, args, data, {
      cause,
      constructorOpt: newFromError,
    });
  }

  function throwError<TType extends keyof TErrorTypes>(
    type: TType,
    ...args: [...Parameters<TErrorTypes[TType]>]
  ): never {
    throw newError(type, ...args);
  }

  function throwFromError<TType extends keyof TErrorTypes>(
    cause: Error,
    type: TType,
    ...args: [...Parameters<TErrorTypes[TType]>]
  ): never {
    throw newFromError(cause, type, ...args);
  }

  function isError<TType extends keyof TErrorTypes>(
    type: TType,
    error: unknown,
  ): error is PojoErrorInstance<TErrorTypes, TType> {
    return error instanceof PojoError && error.type === type;
  }

  function hasError<TType extends keyof TErrorTypes>(
    error: unknown,
  ): error is PojoErrorInstance<TErrorTypes, TType> {
    return (
      error instanceof PojoError &&
      typeof enumObject[error.type as TType] !== "undefined"
    );
  }

  return {
    type: enumObject as Unwrap<typeof enumObject>,
    new: newError,
    newFrom: newFromError,
    throw: throwError,
    throwFrom: throwFromError,
    is: isError,
    has: hasError,
    errors,
  };
}
