import { prisma } from "~/services/db.server";

import { Posts, Prisma } from "@prisma/client";
import { JsonObject } from "@prisma/client/runtime/library";

export const createPost = async (postData: Posts) => {
  const post = await prisma.posts.create({
    data: {
      title: postData.title,
      content: postData.content,
      authorId: postData.authorId,
      status: postData.status,
      type: postData.type,
      tags: postData.tags,
    },
  });
  console.log(post);
};

export const getUserPosts = async (
  userId: string,
  sortFilter: Prisma.PostsOrderByWithRelationInput,
  whereFilter: Prisma.PostsWhereInput,
) => {
  const userPosts = await prisma.posts.findMany({
    orderBy: { ...sortFilter },
    where: { authorId: userId, ...whereFilter },
  });

  return userPosts;
};
export const getPosts = async (
  sortFilter: Prisma.PostsOrderByWithRelationInput,
  whereFilter: Prisma.PostsWhereInput,
  numPosts: number | undefined = 4,
) => {
  const userPosts = await prisma.posts.findMany({
    orderBy: { ...sortFilter },
    where: { ...whereFilter },
    include: { author: { select: { profile: true } } },
    take: numPosts,
  });

  return userPosts;
};

export const deletePost = async (id: string) => {
  const deletePost = await prisma.posts.delete({ where: { id } });
  console.log(deletePost);

  return deletePost;
};

export const getPost = async (id: string | undefined) => {
  console.log(` Specified id : ${id}`);

  if (!id) {
    return { message: "No post found", status: 400, postData: null };
  }
  const postData = await prisma.posts.findFirst({ where: { id } });

  return { message: "Found post", status: 200, postData };
};

export const searchPosts = async (textQuery: string) => {
  try {
    const searchResults: JsonObject = await prisma.posts.aggregateRaw({
      pipeline: [
        {
          $search: {
            index: "default",
            text: {
              query: textQuery,
              path: {
                wildcard: "*",
              },
            },
          },
        },
        // {
        //   $limit: 2,
        // },
        {
          $lookup: {
            from: "User",
            localField: "authorId",
            foreignField: "_id",
            as: "author",
          },
        },
        {
          $unwind: "$author",
        },
        {
          $project: {
            _id: 1,
            title: 1,
            content: 1,
            status: 1,
            type: 1,
            author: {
              _id: 1,
              profile: 1,
            },
            tags: 1,
            score: { $meta: "searchScore" },
          },
        },
      ],
    });

    // check if searchResults is not undefined or null before using map()
    if (Array.isArray(searchResults) && searchResults.length > 0) {
      const transformedSearchResults = searchResults.map((item) => ({
        id: item._id["$oid"],
        title: item.title,
        content: item.content,
        status: item.status,
        type: item.type,
        author: {
          _id: item.author._id,
          profile: item.author.profile,
        },
        tags: item.tags,
        score: item.score,
      }));
      console.log(transformedSearchResults);

      return {
        message: "Found posts",
        status: 200,
        searchResults: transformedSearchResults,
      };
    }
  } catch (error) {
    console.log(error);
  }

  //transform results
};
