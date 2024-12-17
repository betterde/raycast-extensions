import {
  showHUD,
  Clipboard,
  PopToRootType,
  getPreferenceValues,
} from "@raycast/api";

import { v4 as uuid } from 'uuid';

interface Preferences {
  hideAfterCopy: boolean;
  poppingBackToRootType: PopToRootType;
}

const id = uuid();

Clipboard.copy(id);

const { poppingBackToRootType } = getPreferenceValues<Preferences>();

showHUD(`Copied UUID - ${id} 🎉`, {
  clearRootSearch: false,
  popToRootType: poppingBackToRootType,
});

export default function Command() {
  return;
}