import { charities } from "@prisma/client";
import { z } from "zod";

const emailSchema = z
  .string()
  .min(5)
  .email({ message: "Please input a valid email" });
const passwordSchema = z.string().min(8, {
  message: "Please enter a password that is minimum of 8 characters",
});
const firstNameSchema = z
  .string()
  .min(2, { message: "Please enter a valid first name" });
const lastNameSchema = z
  .string()
  .min(2, { message: "Please enter a valid last name" });

export const validateEmail = (email: string) => {
  const result = emailSchema.safeParse(email);

  return result;
};

export const validatePassword = (password: string) => {
  const result = passwordSchema.safeParse(password);
  return result;
};

export const validateFirstName = (firstName: string) => {
  return firstNameSchema.safeParse(firstName);
};
export const validateLastName = (lastName: string) => {
  return lastNameSchema.safeParse(lastName);
};

const charitySchema = z.object({
  name: z
    .string()
    .min(2, { message: "Charity name must be at least 2 characters long" }),
  description: z.string().min(10, {
    message: "Charity description must be at least 10 characters long",
  }),
  website: z.string().url({ message: "Please enter a valid URL" }).optional(),
  contactEmail: z
    .string()
    .email({ message: "Please input a valid contact email" })
    .optional(),
});

const userIdsSchema = z.string().min(1, { message: "Invalid user ID" });

export const validateCharity = (charityData: Partial<charities>) => {
  return charitySchema.safeParse(charityData);
};

export const validateUserIds = (userIds: string) => {
  return userIdsSchema.safeParse(userIds);
};

export const SearchSchema = z.object({
  query: z
    .string()
    .trim()
    .min(2, { message: "Search query must be at least 2 characters" })
    .max(100, { message: "Search query cannot exceed 100 characters" }),
});

export type SearchState = z.infer<typeof SearchSchema>;

export const TaskUrgency = z.enum(["LOW", "MEDIUM", "HIGH"]);
export const TaskStatus = z.enum(["OPEN", "IN_PROGRESS", "COMPLETED"]);
export const TaskLocation = z.enum(["REMOTE", "ONSITE"]);

// Define location schema for validation
export const LocationSchema = z.object({
  address: z.string().min(1, "Address is required"),
  lat: z.number().refine((lat) => lat >= -90 && lat <= 90, {
    message: "Latitude must be between -90 and 90",
  }),
  lng: z.number().refine((lng) => lng >= -180 && lng <= 180, {
    message: "Longitude must be between -180 and 180",
  }),
});

export const TaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(50, "Title must be less than 50 characters "),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must be less than 500 characters"),
  impact: z
    .string()
    .min(1, "Impact is required")
    .max(80, "Impact must be less than 80 characters"),
  charityId: z.string().min(1, "Charity selection is required"),
  requiredSkills: z
    .array(z.string())
    .min(1, "At least one skill is required")
    .max(4, "Only 4 skills can be provided "),
  estimatedHours: z.number().optional(),
  category: z
    .array(z.string())
    .min(1, "At least one category is required")
    .max(2, "Only 2 categories can be provided"),
  urgency: TaskUrgency.optional(),
  volunteersNeeded: z
    .number()
    .int()
    .min(1, "Volunteers needed must be at least 1")
    .max(50, "Task can only have a maximum of 50 volunteers"),
  deliverables: z
    .array(z.string())
    .min(1, "At least one deliverable is required")
    .max(5, "Task can only have a maximum of 3 deliverables"),
  deadline: z.coerce.date().refine((date) => date > new Date(), {
    message: "Deadline must be in the future",
  }),
  location: LocationSchema.nullable().optional(),
  resources: z
    .array(
      z.object({
        name: z.string().nullable(),
        extension: z.string().nullable(),
        type: z.string().nullable(),
        size: z.number().nullable(),
        uploadURL: z.string().url().nullable(),
      }),
    )
    .optional(),
  rewardAmount: z.number().int().optional(),
  creatorWalletAddress: z.string().optional(),
});

export const ObjectIdSchema = z.string().refine(
  (val) => {
    // ObjectId validation rules:
    // - Exactly 24 characters
    // - Hexadecimal characters only (0-9, a-f)
    return /^[0-9a-fA-F]{24}$/.test(val);
  },
  {
    message: "Invalid ObjectId format",
  },
);

export const validateObjectId = (id: string) => {
  return ObjectIdSchema.safeParse(id);
};
