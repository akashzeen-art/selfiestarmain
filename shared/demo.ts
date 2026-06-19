export const DEMO_COUNTRY_CODE = "+91";
export const DEMO_MSISDN_LOCAL = "9876543210";

export function normalizeMsisdn(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function toFullMsisdn(
  localNumber: string,
  countryCode: string = DEMO_COUNTRY_CODE,
): string {
  const digits = normalizeMsisdn(localNumber);
  const code = normalizeMsisdn(countryCode);
  if (!digits) return "";
  if (digits.startsWith(code)) return digits;
  return `${code}${digits}`;
}

export const DEMO_MSISDN_FULL = toFullMsisdn(DEMO_MSISDN_LOCAL, DEMO_COUNTRY_CODE);

export function isDemoMsisdn(phone: string): boolean {
  return normalizeMsisdn(phone) === DEMO_MSISDN_FULL;
}
