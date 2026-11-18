import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const component = readFileSync(join(root, "src/components/PasswordField.tsx"), "utf8");
const login = readFileSync(join(root, "src/app/login/page.tsx"), "utf8");
const register = readFileSync(join(root, "src/components/RegisterForm.tsx"), "utf8");
const reset = readFileSync(join(root, "src/app/reset-password/page.tsx"), "utf8");
const spam = readFileSync(join(root, "src/app/spam/page.tsx"), "utf8");

assert.match(component, /Show password/);
assert.match(component, /Hide password/);
assert.match(component, /aria-pressed=\{visible\}/);
assert.match(component, /type=\{visible \? "text" : "password"\}/);
assert.match(login, /PasswordField/);
assert.match(register, /PasswordField/);
assert.match(reset, /PasswordField/);
assert.match(spam, /PasswordField/);
assert.doesNotMatch(login, /type="password"/);
assert.doesNotMatch(register, /type="password"/);
assert.doesNotMatch(reset, /type="password"/);
assert.doesNotMatch(spam, /type="password"/);
console.log("password field tests passed");
