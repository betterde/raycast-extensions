import crypto from "node:crypto";

export const CHARACTER_TYPES = [
  { value: "uppercase", title: "Uppercase", characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ" },
  { value: "lowercase", title: "Lowercase", characters: "abcdefghijklmnopqrstuvwxyz" },
  { value: "numbers", title: "Numbers", characters: "0123456789" },
  { value: "symbols", title: "Symbols", characters: "!@#$*^&%" },
] as const;

export type CharacterType = (typeof CHARACTER_TYPES)[number]["value"];

export const DEFAULT_CHARACTER_TYPES: CharacterType[] = ["uppercase", "lowercase", "numbers"];

export function getLengthError(value: string): string | undefined {
  if (!/^\d+$/.test(value) || Number(value) < 5 || Number(value) > 64) {
    return "Enter a whole number from 5 to 64";
  }
}

export function generatePassword(length: number, types: readonly CharacterType[], excludeSimilar: boolean): string {
  if (!Number.isInteger(length) || length < 5 || length > 64) {
    throw new Error("Password length must be a whole number from 5 to 64");
  }

  const groups = CHARACTER_TYPES.filter((type) => types.includes(type.value)).map((type) =>
    excludeSimilar ? type.characters.replace(/[0O1lIo]/g, "") : type.characters,
  );

  if (groups.length === 0) {
    throw new Error("Choose at least one character type");
  }

  const charset = groups.join("");
  // Sample uniformly, retrying until every selected character type is represented.
  // At most four non-empty groups are selected, and the minimum length is five.
  let password: string;
  do {
    password = Array.from({ length }, () => charset[crypto.randomInt(charset.length)]).join("");
  } while (!groups.every((group) => [...password].some((character) => group.includes(character))));
  return password;
}
