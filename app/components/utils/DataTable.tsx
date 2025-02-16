import React from "react";
import { AccountCircleIcon } from "./icons";

<div className="w-full md:grid grid-cols-1 md:grid-cols-7 gap-4 md:gap-2 hidden ">
  <div className="col-span-1 md:col-span-2">
    <h2 className="text-base md:text-lg font-semibold ">
      {searchResults.data.title}
    </h2>
    <p className="text-xs md:text-sm ">{searchResults.data.description}</p>
  </div>

  <div className="col-span-1 md:col-span-1">
    <h2 className="text-base md:text-lg font-semibold ">Urgency</h2>
    <span
      className={`inline-block rounded-full px-3 py-1 md:px-4 md:py-1.5 text-xs font-semibold ${getUrgencyColor(searchResults.data.urgency || "LOW")}`}
    >
      {searchResults.data.urgency}
    </span>
  </div>

  <div className="col-span-1 md:col-span-1">
    <h2 className="text-base md:text-lg font-semibold ">Skills</h2>
    <span className="inline-block bg-basePrimaryLight rounded-md px-2 py-1 md:px-3 md:py-1 text-xs font-semibold text-baseSecondary mr-2 mb-2">
      {"Node.js"}
    </span>
  </div>

  <div className="col-span-1 md:col-span-3 md:grid md:grid-cols-3 gap-2 hidden">
    <div>
      <h2 className="text-base md:text-lg font-semibold ">Deadline</h2>
      <span className="text-xs md:text-sm">
        {new Date(searchResults.data.deadline).toLocaleDateString()}
      </span>
    </div>

    <div>
      <h2 className="text-base md:text-lg font-semibold ">Category</h2>
      <span className="text-xs md:text-sm">{searchResults.data.category}</span>
    </div>

    {searchResults.data.deliverables[0] && (
      <div>
        <h2 className="text-base md:text-lg font-semibold ">Deliverable</h2>
        <span className="text-xs md:text-sm">
          {searchResults.data.deliverables[0]}
        </span>
      </div>
    )}
  </div>
</div>;
