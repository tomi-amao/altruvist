export interface UserProfile {
  givenName: string;
  familyName: string;
  nickName: string;
  displayName: string;
  preferredLanguage: string;
  gender: string;
}

export interface UserEmail {
  email: string;
  isVerified: boolean;
}

export interface UserHuman {
  profile: UserProfile;
  email: UserEmail;
  phone?: Record<string, never>;
  passwordChanged: string;
}

export interface UserDetails {
  sequence: string;
  changeDate: string;
  resourceOwner: string;
}

export interface User {
  userId: string;
  details: UserDetails;
  state: string;
  username: string;
  loginNames: string[];
  preferredLoginName: string;
  human: UserHuman;
}

export interface userZitadel {
  details: {
    totalResult: string;
    timestamp: string;
  };
  result: User[];
}

export interface zitadelUserInfo {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  locale: string;
  preferred_username: string;
  email: string;
  email_verified: boolean;
}

export interface GetUserResponse {
  userInfo: zitadelUserInfo | null;
  error: string | null;
}
