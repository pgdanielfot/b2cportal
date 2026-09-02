import type { Condition } from "./conditions";

export type FieldTypeValue = "TEXT" | "TEXTAREA" | "URL" | "DATE" | "DROPDOWN" | "FILE";

export type FieldDraft = {
  id?: string;
  label: string;
  labelMs?: string;
  labelZh?: string;
  type: FieldTypeValue;
  required: boolean;
  order: number;
  options?: string[];
  maxLength?: number;
  minFiles?: number;
  maxFiles?: number;
  maxSizeMb?: number;
  allowedTypes?: string[];
  width?: number;
  height?: number;
  condition?: Condition;
};

export type StepDraft = {
  id?: string;
  title: string;
  titleMs?: string;
  titleZh?: string;
  order: number;
  fields: FieldDraft[];
  condition?: Condition;
};

export type ProductDraft = {
  id: string;
  name: string;
  steps: StepDraft[];
};
