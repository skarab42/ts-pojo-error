export class PojoError<TType, TData> extends Error {
  readonly type: TType;
  readonly data: TData;

  constructor(type: TType, data: TData) {
    super();

    this.type = type;
    this.data = data;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ---

export function required<TType>(defaultValue?: TType): TType {
  return defaultValue as TType;
}

export function optional<TType>(defaultValue?: TType): TType | undefined {
  return defaultValue;
}

export function unknown(defaultValue?: unknown): unknown {
  return defaultValue;
}

// ---

type UnknownRecord = { [x: string]: unknown }; // Record<string, unknown>;

type Unwrap<TType> = TType extends UnknownRecord
  ? { [TKey in keyof TType]: TType[TKey] }
  : TType;

type isHelper<TErrors> = <TType extends keyof TErrors>(
  type: TType,
  input: unknown,
) => input is PojoError<TType, TErrors[TType]>;

type newHelper<TErrors> = <TType extends keyof TErrors>(
  type: TType,
  data: TErrors[TType],
) => PojoError<TType, TErrors[TType]>;

type Factory<TErrors extends UnknownRecord> = {
  type: { [TKey in keyof TErrors]: TKey };
  errors: TErrors;
  is: isHelper<TErrors>;
  new: newHelper<TErrors>;
};

export function factory<TErrors extends UnknownRecord>(
  errors: TErrors,
): Unwrap<Factory<TErrors>> {
  const type = Object.create(null) as Factory<TErrors>["type"];
  const keys = Object.keys(errors) as [keyof TErrors];

  keys.forEach((key) => (type[key] = key));

  return {
    type,
    errors,
    is<TType extends keyof TErrors>(
      type: TType,
      input: unknown,
    ): input is PojoError<TType, TErrors[TType]> {
      return input instanceof PojoError && input.type === type;
    },
    new<TType extends keyof TErrors>(type: TType, data: TErrors[TType]) {
      data = {
        ...(errors[type] as object),
        ...(data as object),
      } as TErrors[TType];
      return new PojoError<TType, TErrors[TType]>(type, data);
    },
  };
}

// ---------------------------------------------------------------------------

const MyError = factory({
  NONE: undefined,
  FATAL: { message: "Fatal Error!" },
  WARNING: {
    message: "Warning: {description} {location}",
    data: {
      description: required<string>(),
      location: optional<string>(),
    },
  },
  TOO_SHORT: {
    message: "Too short, expected {expected}, received {received}",
    data: {
      expected: optional<string | number>(),
      received: unknown(),
    },
  },
  TOO_LONG: {
    message: "Too long, expected {expected}, received {received}",
    data: optional({
      expected: optional<string | number>(),
      received: unknown(),
    }),
  },
});

const myNoneError = MyError.new("NONE", undefined);
const myFatalError = MyError.new("FATAL", { message: "prout" });
const myTooShortError = MyError.new("TOO_SHORT", {
  message: "prout",
  data: { expected: 42, received: 24 },
});
const myTooLongError = MyError.new("TOO_LONG", {
  message: "prout",
  data: undefined,
});

console.log(">>>", {
  MyError,
  myNoneError,
  myFatalError,
  myTooShortError,
  myTooLongError,
});

try {
  throw myFatalError;
} catch (error) {
  if (MyError.is(MyError.type.FATAL, error)) {
    console.log(">>> 1:", error.message);
  } else if (MyError.is("TOO_LONG", error)) {
    console.log(">>> 2:", error.message);
  }
}
