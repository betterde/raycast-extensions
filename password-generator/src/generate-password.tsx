import {
  Form,
  Toast,
  Action,
  showHUD,
  showToast,
  Clipboard,
  ActionPanel,
  PopToRootType,
  getPreferenceValues,
  openExtensionPreferences,
} from "@raycast/api";
import { useEffect, useState } from "react";

import {
  CHARACTER_TYPES,
  DEFAULT_CHARACTER_TYPES,
  CharacterType,
  generatePassword,
  getLengthError,
} from "@/helpers/helpers";

interface Preferences {
  hideAfterCopy: boolean;
  storePasswordLength: boolean;
  poppingBackToRootType: PopToRootType;
}

interface FormValues {
  length: string;
  characterTypes: CharacterType[];
  excludeSimilar: boolean;
}

export default function Command() {
  const { hideAfterCopy, storePasswordLength, poppingBackToRootType } = getPreferenceValues<Preferences>();
  const [length, setLength] = useState("16");
  const [characterTypes, setCharacterTypes] = useState<CharacterType[]>(DEFAULT_CHARACTER_TYPES);
  const [excludeSimilar, setExcludeSimilar] = useState(true);
  const [password, setPassword] = useState("");
  const [lengthError, setLengthError] = useState<string>();
  const characterTypesError = characterTypes.length === 0 ? "Choose at least one character type" : undefined;
  const validLength = !getLengthError(length);

  useEffect(() => {
    setPassword(
      validLength && characterTypes.length > 0 ? generatePassword(Number(length), characterTypes, excludeSimilar) : "",
    );
  }, [length, validLength, characterTypes, excludeSimilar]);

  async function handleGeneratePassword(values: FormValues) {
    const error = getLengthError(values.length);
    setLengthError(error);
    if (error || values.characterTypes.length === 0) return;

    const generatedPassword = generatePassword(Number(values.length), values.characterTypes, values.excludeSimilar);
    setPassword(generatedPassword);

    try {
      await Clipboard.copy(generatedPassword);
      if (hideAfterCopy) {
        await showHUD("Password copied", {
          clearRootSearch: false,
          popToRootType: poppingBackToRootType,
        });
      } else {
        await showToast(Toast.Style.Success, "Password copied");
      }
    } catch {
      await showToast(Toast.Style.Failure, "Could not copy password", "Try Generate again");
    }
  }

  const selectedLabels = CHARACTER_TYPES.filter((type) => characterTypes.includes(type.value)).map(
    (type) => type.title,
  );

  return (
    <Form
      navigationTitle="Password Generator"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Generate" onSubmit={handleGeneratePassword} />
          <Action title="Open Extension Preferences" onAction={openExtensionPreferences} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="length"
        placeholder="Password length · 5–64 characters"
        value={length}
        storeValue={storePasswordLength}
        autoFocus
        error={lengthError}
        onChange={(value) => {
          setLength(value);
          setLengthError(undefined);
        }}
        onFocus={(event) => {
          // Keep the preview in sync with lengths restored by Raycast's storeValue.
          if (event.target.value !== undefined) setLength(event.target.value);
        }}
        onBlur={(event) => setLengthError(getLengthError(event.target.value ?? ""))}
      />
      <Form.TagPicker
        id="characterTypes"
        placeholder="Choose character types"
        value={characterTypes}
        error={characterTypesError}
        onChange={(values) =>
          setCharacterTypes(CHARACTER_TYPES.filter((type) => values.includes(type.value)).map((type) => type.value))
        }
      >
        {CHARACTER_TYPES.map((type) => (
          <Form.TagPicker.Item key={type.value} value={type.value} title={type.title} />
        ))}
      </Form.TagPicker>
      <Form.Checkbox
        id="excludeSimilar"
        label="Exclude similar characters: 0 O o 1 l I"
        value={excludeSimilar}
        onChange={setExcludeSimilar}
      />
      <Form.Separator />
      <Form.Description
        text={`${password || "Enter a valid length and choose a character type to preview your password."}`}
      />
      <Form.Description
        text={password ? `${Number(length)} characters · ${selectedLabels.join(" · ")}` : "5–64 characters · At least one character type"}
      />
    </Form>
  );
}
