import type { MetaFunction } from "@remix-run/node";
import { Form } from "@remix-run/react";
import FileUpload from "~/components/utils/FileUpload";

export const meta: MetaFunction = () => {
  return [
    { title: "File Upload" },
    { name: "description", content: "Upload files with Uppy" },
  ];
};

export default function Upload() {
  const handleSubmit = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    // Handle form submission, including the selectedFiles
  };
  return (
    <div className="w-72">
      <h1>File Upload</h1>
      {/* <CustomUploadForm/> */}
      <Form onSubmit={handleSubmit} id="my-form">
        <FileUpload formTarget="#my-form" uppyId="taskDetails" />
        {/* Other form fields */}
        {/* <FileUploaderCustom onFilesSelected={handleFilesSelected}/> */}
        <button type="submit">Submit</button>
      </Form>
    </div>
  );
}
