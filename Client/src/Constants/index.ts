export const pattern = {
  email: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  mobile: /^([+]\d{2})?[6-9]\d{9}$/,
  aadhar: /^\d{4}\d{4}\d{4}$/g,
  panNo: /[A-Z]{5}\d{4}[A-Z]/,
  gstNo: /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
  pinCode: /^[1-9]\d{5}$/,
  bank_account: /^\d{9,18}$/,
  ifsc: /^[A-Za-z]{4}[a-zA-Z0-9]{7}$/,
  positiveInteger: /^\d*$/,
  noSpace: /^[^\s]/,
  rupees: /^\d*(?:\.\d*)?$/,
  removeSpecialChars: /^[A-Za-z0-9 ]+$/,
  allowOnlyNumbers: /^(\s*|\d+)$/,
  /**
   * @requires lowercase letter.
   * @requires uppercase letter.
   * @requires number.
   * @requires special character.
   * @satisfies a minimum of 8 characters from the specified character classes.
   */
  strongPassword:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
};
