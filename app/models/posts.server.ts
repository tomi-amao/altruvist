import { prisma } from "~/services/db.server";

import { Posts, Prisma } from "@prisma/client";

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
  whereFilter: Prisma.PostsWhereInput
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
    orderBy: { ...sortFilter},
    where: {...whereFilter},
    include: {author: {select: {profile: true}}},
    take: numPosts
  });



  return userPosts;
};

export const deletePost = async (id: string) => {
  const deletePost = await prisma.posts.delete({ where: { id } });
  console.log(deletePost);

  return deletePost;
};
