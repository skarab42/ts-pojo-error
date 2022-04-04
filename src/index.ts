// ---------------------------------------------------------------------------
// Pojo Types
// ---------------------------------------------------------------------------
type Unwrap<TType> = TType extends Record<string, unknown>
  ? { [TKey in keyof TType]: TType[TKey] }
  : TType;

type PojoErrorPayload = { message: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PojoErrorCallback = (...args: any) => PojoErrorPayload;

type PojoErrorTypes = Record<string, PojoErrorCallback>;

type PojoEnum<TErrorTypes> = { [TKey in keyof TErrorTypes]: TKey };

type PojoFakeEnum<TErrorTypes> = {
  enumObject: PojoEnum<TErrorTypes>;
  enumKeys: [keyof TErrorTypes];
};

type PojoErrorInstance<
  TErrorTypes extends PojoErrorTypes,
  TType extends keyof TErrorTypes,
> = PojoError<
  TType,
  Parameters<TErrorTypes[TType]>,
  ReturnType<TErrorTypes[TType]>
>;

type NewPojoError<TErrorTypes extends PojoErrorTypes> = <
  TType extends keyof TErrorTypes,
>(
  type: TType,
  ...args: [...Parameters<TErrorTypes[TType]>]
) => PojoErrorInstance<TErrorTypes, TType>;

type ThrowPojoError<TErrorTypes extends PojoErrorTypes> =
  NewPojoError<TErrorTypes>;

type PojoFactory<TErrorTypes extends PojoErrorTypes> = {
  type: Unwrap<PojoEnum<TErrorTypes>>;
  errors: TErrorTypes;
  new: NewPojoError<TErrorTypes>;
  throw: ThrowPojoError<TErrorTypes>;
  is: <TType extends keyof TErrorTypes>(
    type: TType,
    error: unknown,
  ) => error is PojoErrorInstance<TErrorTypes, TType>;
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

  constructor(type: TType, args: TArgs, data: TPojo) {
    super();

    this.type = type;
    this.args = args;
    this.data = data;

    this.message = data.message;

    Object.setPrototypeOf(this, new.target.prototype);
  }

  toObject(): { type: TType; args: TArgs; data: TPojo } {
    return {
      type: this.type,
      args: [...this.args],
      data: { ...this.data },
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

    return new PojoError(type, args, data);
  }

  function throwError<TType extends keyof TErrorTypes>(
    type: TType,
    ...args: [...Parameters<TErrorTypes[TType]>]
  ): PojoErrorInstance<TErrorTypes, TType> {
    throw newError(type, ...args);
  }

  function isError<TType extends keyof TErrorTypes>(
    type: TType,
    error: unknown,
  ): error is PojoErrorInstance<TErrorTypes, TType> {
    return error instanceof PojoError && error.type === type;
  }

  return {
    type: enumObject as Unwrap<typeof enumObject>,
    new: newError,
    throw: throwError,
    is: isError,
    errors,
  };
}
