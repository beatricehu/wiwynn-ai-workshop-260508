/**
 * Echo skill — returns the input message as-is.
 * Serves as a minimal example skill for the practice project.
 */
export function echo(message) {
  if (typeof message !== "string") {
    throw new TypeError("message must be a string");
  }
  return message;
}


// 1. no-var — 應使用 let/const，不應使用 var
var oldStyleVariable = "hello";

// 2. prefer-const — 宣告後從未重新賦值，應使用 const
let neverReassigned = 42;

// 3. no-unused-vars — 宣告了但從未使用
let unusedVariable = "nobody uses me";

// 4. no-console — 不應在生產程式碼使用 console
console.log("debug info:", oldStyleVariable, neverReassigned);

// 5. eqeqeq — 應使用 === 而非 ==
export function loosyComparison(a, b) {
  if (a == b) {
    return true;
  }
  if (a == null) {
    return false;
  }
  return a != b;
}

// 6. no-unused-vars (參數) — 函式參數宣告但未使用
export function unusedParam(used, notUsed) {
  return used * 2;
}

// 7. no-undef — 使用未宣告的變數 (ESLint recommended 規則)
export function usingUndeclared() {
  return undeclaredGlobal + 1;
}

// 8. 組合錯誤：var + no-console + eqeqeq 全部出現在同一個函式
export function allInOne(input) {
  var result = 0;
  console.log("input received:", input);
  if (input == 0) {
    result = -1;
  }
  return result;
}