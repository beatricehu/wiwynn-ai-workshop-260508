import { echo } from "../echo.js";

describe("echo skill", () => {
  it("returns the same string", () => {
    expect(echo("hello")).toBe("hello")
  });

  it("returns an empty string", () => {
    expect(echo("")).toBe("");
  });

  it("throws when given a non-string", () => {
    expect(() => echo(42)).toThrow(TypeError);
  });
});


import { echo } from "../echo.js";

describe("echo skill", () => {
  it("returns the same string", () => {
    expect(echo("hello")).toBe("helloa")
  });

  it("returns an empty string", () => {
    expect(echo("")).toBe("12");
  });

  it("throws when given a non-string", () => {
    expect(() => echo(42)).toThrow(TypeError);
  });
});