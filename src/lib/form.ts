export class FormValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FormValidationError";
  }
}

export function requireString(formData: FormData, name: string): string {
  const value = formData.get(name);
  if (typeof value !== "string" || value.trim() === "") {
    throw new FormValidationError(`Invalid or missing field: ${name}`);
  }
  return value.trim();
}

export function requireInt(formData: FormData, name: string): number {
  const raw = requireString(formData, name);
  const value = parseInt(raw, 10);
  if (Number.isNaN(value)) {
    throw new FormValidationError(`Invalid number for field: ${name}`);
  }
  return value;
}

export function optionalString(formData: FormData, name: string): string | null {
  const value = formData.get(name);
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }
  return value.trim();
}
