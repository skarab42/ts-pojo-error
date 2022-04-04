import { expect, test } from "vitest";
import { factory, PojoError } from "../src";
import { errors, ErrorsEnum, errorsEnum } from "./fixtures";

function assertType<TExpected>(input: TExpected): TExpected {
  return input;
}

test("factory", () => {
  const myErrors = factory(errors);

  assertType<ErrorsEnum>(myErrors.type);
  assertType<typeof errors>(myErrors.errors);

  expect(myErrors.type).toEqual(errorsEnum);
  expect(myErrors.errors).toBe(errors);
});

test("factory.new", () => {
  const myErrors = factory(errors);

  myErrors.new("FATAL", "Oupsy!");
  myErrors.new(myErrors.type.FATAL);

  // @ts-expect-error Expected 2-3 arguments, but got 1.
  myErrors.new(myErrors.type.PAGE_NOT_FOUND);
  // @ts-expect-error Expected 1-2 arguments, but got 3.
  myErrors.new(myErrors.type.FATAL, "Oupsy!", 42);

  // @ts-expect-error Argument of type '"PROUT"' is not assignable ...
  expect(() => myErrors.new("PROUT")).toThrow();
});

test("factory.throw", () => {
  const myErrors = factory(errors);
  expect(() => myErrors.throw("FATAL")).toThrow("Fatal error");
});

test("error without parameter", () => {
  const myErrors = factory(errors);
  const myError = myErrors.new(myErrors.type.FATAL);

  assertType<"FATAL">(myError.type);
  assertType<Parameters<typeof errors.FATAL>>(myError.args);
  assertType<ReturnType<typeof errors.FATAL>>(myError.data);

  try {
    throw myError;
  } catch (error) {
    expect(error).instanceOf(PojoError);

    if (myErrors.is("FATAL", error)) {
      assertType<"FATAL">(error.type);
      assertType<Parameters<typeof errors.FATAL>>(error.args);
      assertType<ReturnType<typeof errors.FATAL>>(error.data);

      expect(error.type).toBe("FATAL");
      expect(error.args).toEqual([]);
      expect(error.data).toEqual({ message: "Fatal error" });
      expect(error.message).toBe("Fatal error");
    }
  }
});

test("error with one parameter", () => {
  const myErrors = factory(errors);
  const myError = myErrors.new(myErrors.type.FATAL, "My custom fatal error");

  try {
    throw myError;
  } catch (error) {
    expect(error).instanceOf(PojoError);

    if (myErrors.is("FATAL", error)) {
      expect(error.type).toBe("FATAL");
      expect(error.args).toEqual(["My custom fatal error"]);
      expect(error.data).toEqual({ message: "My custom fatal error" });
      expect(error.message).toBe("My custom fatal error");
    }
  }
});

test("error with two parameter (url, undefined)", () => {
  const myErrors = factory(errors);
  const myError = myErrors.new(
    myErrors.type.PAGE_NOT_FOUND,
    "http://www.skarab42.dev",
  );

  try {
    throw myError;
  } catch (error) {
    expect(error).instanceOf(PojoError);

    if (myErrors.is("PAGE_NOT_FOUND", error)) {
      expect(error.data).toMatchSnapshot();
      expect(error.type).toBe("PAGE_NOT_FOUND");
      expect(error.args).toEqual(["http://www.skarab42.dev"]);
      expect(error.message).toBe("Page Not Found: http://www.skarab42.dev");
    }
  }
});

test("error with two parameters (url, user)", () => {
  const user = { name: "skarab42", isAdmin: true };
  const myErrors = factory(errors);
  const myError = myErrors.new(
    myErrors.type.PAGE_NOT_FOUND,
    "http://www.skarab42.dev",
    user,
  );

  try {
    throw myError;
  } catch (error) {
    expect(error).instanceOf(PojoError);

    if (myErrors.is("PAGE_NOT_FOUND", error)) {
      expect(error.data).toMatchSnapshot();
      expect(error.type).toBe("PAGE_NOT_FOUND");
      expect(error.args).toEqual(["http://www.skarab42.dev", user]);
      expect(error.message).toBe("Page Not Found: http://www.skarab42.dev");
    }
  }
});

test("error to object/json", () => {
  const user = { name: "skarab42", isAdmin: true };
  const myErrors = factory(errors);
  const myError = myErrors.new(
    myErrors.type.PAGE_NOT_FOUND,
    "http://www.skarab42.dev",
    user,
  );

  const myErrorObject = myError.toObject();

  expect(myErrorObject).toMatchSnapshot({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    stack: expect.stringMatching(
      /^Error: Page Not Found: http:\/\/www\.skarab42\.dev/,
    ),
  });

  expect(JSON.parse(myError.toJSON())).toEqual(myErrorObject);
});
