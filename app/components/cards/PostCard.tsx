import type { Posts } from "@prisma/client";
import { useEffect, useState } from "react";

interface post extends Posts {
  author: {
    profile: {
      firstName: string;
      lastName: string;
      username: string | null;
      profilePicture: string | null;
      role: string | null;
      type: string | null;
    };
  };
}

export default function PostCard({ post }: { post: post }) {
  const [postAge, setPostAge] = useState<string>();
  const [dateNow, setDateNow] = useState<Date>();
  const postDate = new Date(post.createdAt);

  const now = new Date();

  function calculatePostAge(createdAt: Date): string {
    const timeDiffInMs = now.getTime() - createdAt.getTime();
    const seconds = Math.floor(timeDiffInMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      setPostAge(postDate.toLocaleDateString());
      return "";
    } else if (days > 0) {
      const daysOld = `${days} day${days > 1 ? "s" : ""} ago`;
      setPostAge(daysOld);
      return daysOld; // Handle pluralization for days
    } else if (hours > 0) {
      const hoursOld = `${hours} hour${hours > 1 ? "s" : ""} ago`;
      setPostAge(hoursOld);
      return hoursOld; // Handle pluralization for hours
    } else {
      const minsOld = `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
      setPostAge(minsOld);
      return minsOld; // Handle pluralization for minutes
    }
  }
  useEffect(() => {
    calculatePostAge(postDate);
  }, [now, dateNow, setDateNow]);

  return (
    <>
      <div className="w-full h-fit bg-midGrey p-3 rounded-md grid grid-cols-[0.1fr_1fr] ">
        <div className="w-[45px] h-[45px] rounded-full bg-bgprimary m-2 row-span-2 "></div>
        <div className="flex items-center pt-2 ">
          <div className="flex flex-col">
            <h2 className="text-base h-fit">
              {post.author.profile.username
                ? post.author.profile.username
                : post.author.profile.firstName}
            </h2>
            <h3 className="text-sm h-fit text-altMidGrey">
              {post.type &&
                post.type?.charAt(0).toUpperCase() + post.type?.slice(1)}{" "}
              · {postAge}
            </h3>
          </div>
        </div>
        <div className="flex flex-col col-start-1 col-span-2 pl-2 pt-2">
          <div className="flex items-baseline">
            <h2 className="text-base h-fit pr-4">{post.title} </h2>
            <ul className="flex gap-2 text-xs rounded-md ">
              {post.tags.map((tag, index) => (
                <li key={index} className="bg-darkGrey rounded-md p-1 px-2">
                  {" "}
                  {tag}{" "}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-base text-altMidGrey h-fit">{post.content}</p>
        </div>
      </div>
    </>
  );
}
