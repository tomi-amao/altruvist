import type { charityApplications  } from "@prisma/client";



export type CharityMembership = {
  id: string;
  userId: string;
  charityId: string;
  roles: string[];
  permissions: string[];
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  charity: {
    id: string;
    name: string;
  };
};

export type Charity = {
  id: string;
  name: string;
  description: string;
  website?: string;
  contactPerson?: string;
  contactEmail?: string;
  backgroundPicture?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  members?: CharityMembership[];
  applications?: CharityApplication[];
};

export interface CharityTask {
  id: string;
  title: string;
  status: string;
  [key: string]: unknown;
}


export type CharityApplication = charityApplications & {
  user: {
    name: string;
    email: string;
  };
  charity: {
    name: string;
  };
};