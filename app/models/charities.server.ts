import { charities, type Prisma } from "@prisma/client";
import { prisma } from "~/services/db.server";
import { INDICES, indexDocument, deleteDocument, isMeilisearchConnected } from "~/services/meilisearch.server";

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

    // Index the new charity in Meilisearch
    const meiliConnected = await isMeilisearchConnected();
    if (meiliConnected) {
      await indexDocument(INDICES.CHARITIES, charity);
    }

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

export const updateCharity = async (
  id: string,
  charityData: Prisma.charitiesUpdateInput,
) => {
  try {
    const charity = await prisma.charities.findUnique({
      where: { id },
    });
    if (!charity) {
      return { message: "No charity Found", status: 404 };
    }
    const updatedCharity = await prisma.charities.update({
      where: { id },
      data: charityData,
    });

    // Update the charity in Meilisearch
    const meiliConnected = await isMeilisearchConnected();
    if (meiliConnected) {
      await indexDocument(INDICES.CHARITIES, updatedCharity);
    }

    return {
      charity,
      message: `Updated Charity ${updatedCharity}`,
      status: 200,
    };
  } catch (error) {
    return {
      charity: null,
      message: `Unable to find charity`,
      status: 500,
      error,
    };
  }
};

export const deleteCharity = async (id: string) => {
  try {
    const charity = await prisma.charities.findUnique({
      where: { id },
    });
    if (!charity) {
      return { message: "No charity Found", status: 404 };
    }
    await prisma.charities.delete({
      where: { id },
    });

    // Delete the charity from Meilisearch
    const meiliConnected = await isMeilisearchConnected();
    if (meiliConnected) {
      await deleteDocument(INDICES.CHARITIES, id);
    }

    return { message: "Charity deleted", status: 200 };
  } catch (error) {
    return {
      charity: null,
      message: `Unable to find charity: ${error}`,
      status: 500,
    };
  }
};

export const listCharities = async () => {
  try {
    const charities = await prisma.charities.findMany();
    return { charities, message: "Found charities", status: 200 };
  } catch (error) {
    return {
      charities: null,
      message: `Unable to find charities: ${error}`,
      status: 500,
    };
  }
};
