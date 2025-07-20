
export interface EmployerRecord {
  [k: string]: any;
  employerId: number;
  label: string;
  specialProgram?: string;
  insurancePackageId?: number;
}

export interface EmployerInfo {
  employerId?: number,
  label?: string,
  specialProgram?: string,
  insurancePackageId?: number,
}