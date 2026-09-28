import assert from "node:assert/strict";
import { test } from "node:test";

import { CHARACTER_TYPES, generatePassword, getLengthError } from "../src/helpers/helpers";

test("every character selection produces the requested length and includes every selected type", () => {
  for (let mask = 1; mask < 1 << CHARACTER_TYPES.length; mask++) {
    const selected = CHARACTER_TYPES.filter((_, index) => mask & (1 << index));
    for (const excludeSimilar of [false, true]) {
      const groups = selected.map((type) =>
        excludeSimilar ? type.characters.replace(/[0O1lIo]/g, "") : type.characters,
      );
      const allowed = groups.join("");
      for (const length of [5, 16, 32, 64]) {
        for (let sample = 0; sample < 10; sample++) {
          const password = generatePassword(
            length,
            selected.map((type) => type.value),
            excludeSimilar,
          );
          assert.equal(password.length, length);
          assert.ok([...password].every((character) => allowed.includes(character)));
          assert.ok(groups.every((group) => [...password].some((character) => group.includes(character))));
          if (excludeSimilar) assert.doesNotMatch(password, /[0O1lIo]/);
        }
      }
    }
  }
});

test("invalid lengths and empty character selections are rejected", () => {
  for (const length of [0, 4, 65, -1, 5.5, NaN, Infinity]) {
    assert.throws(() => generatePassword(length, ["lowercase"], true), /length/);
  }
  assert.throws(() => generatePassword(16, [], true), /character type/);
});

test("manual length input accepts only whole numbers within the limits", () => {
  for (const input of ["", " ", "4", "65", "16.5", "16abc", "1e1", "-5", "16 "]) {
    assert.ok(getLengthError(input), input);
  }
  for (const input of ["5", "16", "32", "64"]) {
    assert.equal(getLengthError(input), undefined);
  }
});
