export type Attendance = "pendente" | "confirmado" | "recusado";
export type Guest = {
  id: string;
  name: string;
  child: boolean;
  status: Attendance;
  checkedIn: boolean;
};
export type Invitation = {
  id: string;
  kind?: "individual" | "group";
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
  message: string;
  dietaryRestrictions: string;
};
export type RSVPSettings = { deadline: string; enabled: boolean };
