import { getLgasForState, STATE_NAMES } from "./nigeria-locations";
import { AGE_RANGES, GENDER_OPTIONS } from "./onboarding-schema";

type SelectOption = {
  value: string;
  label: string;
};

export const GENDER_SELECT_OPTIONS: SelectOption[] = GENDER_OPTIONS.map(({ value, label }) => ({
  value,
  label,
}));

export const AGE_RANGE_OPTIONS: SelectOption[] = AGE_RANGES.map((value) => ({
  value,
  label: value,
}));

export const STATE_OPTIONS: SelectOption[] = STATE_NAMES.map((name) => ({
  value: name,
  label: name,
}));

export function getLgaOptions(state: string): SelectOption[] {
  return getLgasForState(state).map((name) => ({ value: name, label: name }));
}
