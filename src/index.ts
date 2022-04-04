// ---------------------------------------------------------------------------
// Union to Tuple
// Taken from https://catchts.com/union-array and slightly modified
// ---------------------------------------------------------------------------
type UnionToFunction<U> = U extends unknown ? (k: U) => void : never;

type UnionToIntersection<U> = UnionToFunction<U> extends (k: infer I) => void
  ? I
  : never;

type UnionToOverloadedFunction<U> = UnionToIntersection<UnionToFunction<U>>;

type UnionPop<U> = UnionToOverloadedFunction<U> extends (a: infer A) => void
  ? A
  : never;

type UnionMerge<TUnion, TTuple extends unknown[]> = [TUnion, ...TTuple];

type UnionToSubArray<TUnion, TTuple extends unknown[]> = UnionToArray<
  Exclude<TUnion, UnionPop<TUnion>>,
  UnionMerge<UnionPop<TUnion>, TTuple>
>;

type IsUnion<T> = [T] extends [UnionToIntersection<T>] ? false : true;

type UnionToArray<
  TUnion,
  TTuple extends unknown[] = [],
> = IsUnion<TUnion> extends true
  ? UnionToSubArray<TUnion, TTuple>
  : UnionMerge<TUnion, TTuple>;

type ObjectKeys<TObject> = UnionToArray<keyof TObject>;

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

type PojoFactory<TErrorTypes extends PojoErrorTypes> = {
  type: keyof TErrorTypes;
  types: ObjectKeys<TErrorTypes>;
  enum: Unwrap<PojoEnum<TErrorTypes>>;
  new: <TType extends keyof TErrorTypes>(
    type: TType,
    ...args: [...Parameters<TErrorTypes[TType]>]
  ) => PojoErrorInstance<TErrorTypes, TType>;
  is: <TType extends keyof TErrorTypes>(
    type: TType,
    error: unknown,
  ) => error is PojoErrorInstance<TErrorTypes, TType>;
  errors: TErrorTypes;
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
  const { enumKeys, enumObject } = fakeEnum(errors);

  function newFactory<TType extends keyof TErrorTypes>(
    type: TType,
    ...args: [...Parameters<TErrorTypes[TType]>]
  ): PojoErrorInstance<TErrorTypes, TType> {
    const func = errors[type] as TErrorTypes[TType];
    const data = func(...args) as ReturnType<TErrorTypes[TType]>;

    return new PojoError(type, args, data);
  }

  function isFactory<TType extends keyof TErrorTypes>(
    type: TType,
    error: unknown,
  ): error is PojoErrorInstance<TErrorTypes, TType> {
    return error instanceof PojoError && error.type === type;
  }

  return {
    type: enumKeys as unknown as typeof enumKeys[number],
    types: enumKeys as ObjectKeys<TErrorTypes>,
    enum: enumObject as Unwrap<typeof enumObject>,
    new: newFactory,
    is: isFactory,
    errors,
  };
}
