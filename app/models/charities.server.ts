import { charities } from "@prisma/client";
import { prisma } from "~/services/db.server";
export const createCharity = async (
  charityData: Partial<charities>,
  userId: string,
) => {
  try {
    const charity = await prisma.charities.create({
      data: {
        name: charityData.name ?? "",
        description: charityData.description ?? "xs",
        website: charityData.website,
        contactEmail: charityData.contactEmail ?? undefined,
        tags: charityData.tags,
        users: {
          connect: { id: userId },
        },
      },
    });
    return { charity, message: "Charity successfully created", status: 200 };
  } catch (error) {
    return {
      charity: null,
      message: `Unable to create charity: ${error}`,
      status: 500,
    };
  }
};

export const getCharity = async (id: string) => {
  try {
    const charity = await prisma.charities.findUnique({
      where: { id },
    });
    return { charity, message: "Found charity", status: 200 };
  } catch (error) {
    return {
      charity: null,
      message: `Unable to find charity: ${error}`,
      status: 500,
    };
  }
};
