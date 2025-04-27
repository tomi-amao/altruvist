export type CharityApplication = {
  id: string;
  userId: string;
  charityId: string;
  roles: string[];
  applicationNote?: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  appliedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNote?: string;
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
