



export { loader } from "./loader.server";

export default function MultiSearch() {
  // const fetcher = useFetcher();
  // const { searchResult, searchedDocuments, rawSearchedDocuments } =
  //   useLoaderData<typeof loader>();
  // // const handleSearch = (e: ChangeEvent<HTMLInputElement>, property: string) => {
  // //   // console.log(e.target.value);

  // //   // setSearch((preValue) => { return (setSearch((preValue) => {...preValue, [property]: e.va}))} )
  // //   setSearch((preValue) => {
  // //     return { ...preValue, [property]: e.target.value };
  // //   });
  // // };
  // // const rawSearchedDocuments = searchedDocuments.map(
  // //   (document) => document._source,
  // // );

  // // console.log("Result query",rawSearchedDocuments);

  // useEffect(() => {
  //   // console.log(search);
  //   fetcher.load(`/multisearch?search=${search.query}`);
  // }, [search]);
  return (
    <>
      {/* <Navbar isLoggedIn={false} searchValue={search} /> */}
      <div className="pt-20 flex flex-col ">{/* <SearchDropdown /> */}</div>
    </>
  );
}
