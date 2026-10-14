export type Attendance = "pendente" | "confirmado" | "recusado";
export type Guest = {
  id: string;
  name: string;
  child: boolean;
  status: Attendance;
  checkedIn: boolean;
  tableId?: string;
  seat?: string;
  checkedInAt?: string | null;
};
export type Invitation = {
  id: string;
  kind?: "individual" | "group";
  code?: string;
  guestCodes?: Record<string, string>;
  personalCodes?: Record<string, string>;
  personalTokens?: Record<string, string>;
  personalResponses?: Record<string, {message: string; dietaryRestrictions: string; respondedAt: string}>;
  label: string;
  token: string;
  active: boolean;
  guests: Guest[];
  revision: number;
  updatedAt: string;
  respondedAt: string | null;
  sentAt: string | null;
  openedAt?: string | null;
  personalOpenedAt?: Record<string, string>;
  message: string;
  dietaryRestrictions: string;
};
export type RSVPSettings = { deadline: string; enabled: boolean };

export type EventTable = {id:string; name:string; capacity:number};
export type AuditEntry = {id:string; at:string; actor:string; action:string; target:string; details:string};
export type ReceptionMember = {id:string; email:string; active:boolean};
