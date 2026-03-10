export interface FieldMapping {
  csvField: string;
  crmField: string;
}

export interface RowError {
  row: number;
  field: string;
  error: string;
}

export interface ValidatedRow {
  rowIndex: number;
  data: Record<string, string>;
  errors: RowError[];
  isValid: boolean;
}

export interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors: RowError[];
}

export const CRM_FIELDS = [
  { value: "contact_name", label: "Client Name", required: true },
  { value: "email", label: "Email", required: true },
  { value: "phone", label: "Phone", required: false },
  { value: "mobile", label: "Mobile", required: false },
  { value: "website", label: "Website", required: false },
  { value: "city", label: "City", required: false },
  { value: "state", label: "State", required: false },
  { value: "country", label: "Country", required: false },
  { value: "address", label: "Address", required: false },
  { value: "company_name", label: "Company Name", required: false },
  { value: "__skip__", label: "— Skip —", required: false },
] as const;

export const DEFAULT_FIELD_MAP: Record<string, string> = {
  "*ContactName": "contact_name",
  "ContactName": "contact_name",
  "Name": "contact_name",
  "Client Name": "contact_name",
  "EmailAddress": "email",
  "Email": "email",
  "PhoneNumber": "phone",
  "Phone": "phone",
  "MobileNumber": "mobile",
  "Mobile": "mobile",
  "Website": "website",
  "POCity": "city",
  "City": "city",
  "PORegion": "state",
  "State": "state",
  "Region": "state",
  "POCountry": "country",
  "Country": "country",
  "POAddressLine1": "address",
  "Address": "address",
  "FirstName": "__first_name__",
  "LastName": "__last_name__",
  "CompanyName": "company_name",
  "Company": "company_name",
};
