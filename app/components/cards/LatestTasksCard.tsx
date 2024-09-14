export default function LatestTasks() {
  return (
    <div className="bg-basePrimaryDark rounded-md p-2 m-2">
      <div className="p-4 flex flex-row justify-between border-y-baseSecondary border-b-[1px] items-center">
        <span>Latest Post</span>
        <span className="text-midGrey text-xs">See more</span>
      </div>
      <LatestTaskSummary />
      <LatestTaskSummary />
      <LatestTaskSummary />
    </div>
  );
}

export function LatestTaskSummary() {
  return (
    <div className="w-full rounded-md p-4  flex flex-col   ">
      <p className="font-bold font-primary">Data Analysis</p>
      <p className="text-midGrey text-sm ">
        Data analysis on the rate of deforestation in the last year
      </p>
      <div className="flex flex-row justify-between items-center py-2 text-xs ">
        <div className="flex flex-row gap-2 items-center">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-txtprimary opacity-25"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-txtprimary "></span>
        </span>
        <span className="text-midGrey font-primary ">Task</span>
        </div>
        <span> 4 minutes</span>
      </div>
    </div>
  );
}
