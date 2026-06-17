export function isEmptyString(
  str: string | null | undefined,
): str is null | undefined | "" {
  try {
    return (str ? str.replace(/\s/g, "") : "") === "";
  } catch (error) {
    console.warn(
      `There was a critical error in processing isEmptyString: ${str}`,
      error,
    );
  }
  return true;
}
