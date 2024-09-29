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
  description: z
    .string()
    .min(10, {
      message: "Charity description must be at least 10 characters long",
    }),
  website: z.string().url({ message: "Please enter a valid URL" }).optional(),
  contactEmail: z
    .string()
    .email({ message: "Please input a valid contact email" })
    .optional(),
});

const userIdsSchema = z.string().min(1, { message: "Invalid user ID" });

export const validateCharity = (charityData: any) => {
  return charitySchema.safeParse(charityData);
};

export const validateUserIds = (userIds: string) => {
  return userIdsSchema.safeParse(userIds);
};
