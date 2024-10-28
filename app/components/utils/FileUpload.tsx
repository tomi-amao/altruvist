import React, { useEffect, useState } from "react";
import Uppy, { Meta, UppyFile } from "@uppy/core";
import { Dashboard } from "@uppy/react";
import GoogleDrive from "@uppy/google-drive";
import ImageEditor from "@uppy/image-editor";
import Tus from "@uppy/tus";
import DropTarget from "@uppy/drop-target";
import ThumbnailGenerator from "@uppy/thumbnail-generator";
import ProgressBar from "@uppy/progress-bar";
import Compressor from "@uppy/compressor";

import "@uppy/core/dist/style.css";
import "@uppy/dashboard/dist/style.css";
import "@uppy/image-editor/dist/style.css";
import "@uppy/progress-bar/dist/style.css";
import Form from "@uppy/form";
import { NewTaskFormData } from "~/models/types.server";
import { FilePreviewButton } from "./FormField";

const FileUpload = ({
  formTarget,
  uppyId,
  onUploadedFile,
  toggleUploadBtn,
}: {
  formTarget: string;
  uppyId: string;
  onUploadedFile: (
    uploadedUrl: UppyFile<Meta, Record<string, never>>[],
  ) => void;
  toggleUploadBtn: (toggle: boolean) => void;
}) => {
  const [uppyInstance, setUppyInstance] = useState<Uppy | null>(null);
  //   const []

  useEffect(() => {
    const uppy = new Uppy({
      debug: true,
      autoProceed: false,
      id: uppyId,
      restrictions: {
        allowedFileTypes: [
          ".doc",
          ".docx",
          ".ppt",
          ".pptx",
          ".xls",
          ".xlsx",
          ".pdf",
          ".jpg",
          ".jpeg",
          ".png",
          ".bmp",
        ],
        maxFileSize: 10 * 1024 * 1024,
        maxNumberOfFiles: 10,
      },
    })
      .use(Compressor)
      // .use(Form, {
      //   target: formTarget,
      //   triggerUploadOnSubmit: true,
      // })
      .use(GoogleDrive, {
        companionUrl: "http://localhost:3020",
      })
      .use(ImageEditor, {
        quality: 0.8,
      })
      .use(DropTarget, {
        target: document.body,
      })
      .use(ThumbnailGenerator, {
        thumbnailWidth: 200,
      })
      .use(ProgressBar, {
        target: document.body,
        fixed: true,
        hideAfterFinish: false,
      })
      .use(Tus, {
        endpoint: "http://localhost:8004/files/",
        retryDelays: [0, 1000, 3000, 5000],
      });

    setUppyInstance(uppy);

    uppy.on("upload-success", (file, response) => {
      console.log("Files uploaded:", file?.name);
      console.log("Url:", response.uploadURL);
      console.log(file?.extension);
    });

    uppy.on("file-added", (file) => {
      toggleUploadBtn(true);
    });

    uppy.on("complete", (result) => {
      console.log("successful files:", result.successful);
      console.log("failed files:", result.failed);
      setTimeout(function () {
        uppy.clear();
      }, 1000);
      if (!result.successful) {
        return { message: "No successful files found" };
      } else {
        onUploadedFile(result.successful);
      }
    });

    return () => {
      uppy.off("upload-success", (file) => {});
      uppy.off("complete", (file) => {});
      uppy.clear();
    };
  }, [formTarget]);

  if (!uppyInstance) {
    return <div>Loading...</div>;
  }

  return (
    <Dashboard
      uppy={uppyInstance}
      plugins={["GoogleDrive", "ImageEditor"]}
      theme="light"
      // hideUploadButton
      height={"250px"}
      width={"400px"}
    />
  );
};
export const UploadFilesComponent: React.FC<{
  setFormData: React.Dispatch<React.SetStateAction<NewTaskFormData>>;
  formData: NewTaskFormData;
}> = ({ setFormData, formData }) => {
  const [uploadedResources, setUploadedResources] = useState<
    UppyFile<Meta, Record<string, never>>[]
  >([]);

  const [showUploadButton, setShowUploadButton] = useState<boolean>(false);

  const handleUploadedResourcesUrls = (
    successfullFiles: UppyFile<Meta, Record<string, never>>[],
  ) => {
    setUploadedResources((prevUploads) => [
      ...prevUploads,
      ...successfullFiles,
    ]);
  };

  useEffect(() => {
    setUploadedResources(() => [...formData.resources]);
  }, []);

  useEffect(() => {
    console.log("Client Side Files uploaded", uploadedResources);
    setFormData({ ...formData, resources: uploadedResources });
  }, [uploadedResources]);
  return (
    <>
      <FileUpload
        formTarget="#uploadResources"
        uppyId="uploadResourceTask"
        onUploadedFile={(
          successfullFiles: UppyFile<Meta, Record<string, never>>[],
        ) => handleUploadedResourcesUrls(successfullFiles)}
        toggleUploadBtn={(toggle: boolean) => setShowUploadButton(toggle)}
      />

      {uploadedResources.length > 0 && (
        <div className="pt-8">
          <div id="uploaded-files" className="flex gap-4 mt-2 flex-wrap">
            {uploadedResources.map((upload, index) => {
              return (
                <FilePreviewButton
                  fileName={upload.name}
                  fileSize={upload.size}
                  fileUrl={upload.uploadURL}
                  fileExtension={upload.extension}
                />
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default FileUpload;
