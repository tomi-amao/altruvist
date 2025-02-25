import React, { useEffect, useState } from "react";
import Uppy, { Meta, UppyFile } from "@uppy/core";
import { Dashboard } from "@uppy/react";
import GoogleDrivePicker from "@uppy/google-drive-picker";
import ImageEditor from "@uppy/image-editor";
// import Tus from "@uppy/tus";
import DropTarget from "@uppy/drop-target";
import ThumbnailGenerator from "@uppy/thumbnail-generator";
import ProgressBar from "@uppy/progress-bar";
import Compressor from "@uppy/compressor";
import AwsS3 from "@uppy/aws-s3";

import "@uppy/core/dist/style.css";
import "@uppy/dashboard/dist/style.css";
import "@uppy/image-editor/dist/style.css";
import "@uppy/progress-bar/dist/style.css";
import { NewTaskFormData, TaskResource } from "~/types/tasks";
import { FilePreviewButton } from "./FormField";

const FileUpload = ({
  formTarget,
  uppyId,
  onUploadedFile,
}: {
  formTarget: string;
  uppyId: string;
  onUploadedFile: (
    uploadedUrl: UppyFile<Meta, Record<string, never>>[],
  ) => void;
  toggleUploadBtn?: (toggle: boolean) => void;
}) => {
  const [uppyInstance, setUppyInstance] = useState<Uppy | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initializeUppy() {
      try {
        const response = await fetch("/api/google-credentials");
        if (!response.ok) {
          throw new Error("Failed to fetch credentials");
        }
        const { clientId, apiKey } = await response.json();

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
          .use(GoogleDrivePicker, {
            companionUrl: "http://localhost:3020",
            clientId,
            apiKey,
            appId: clientId.split("-")[0],
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
          .use(AwsS3, {
            endpoint: "http://localhost:3020",
          });
        // .use(Tus, {
        //   endpoint: "http://localhost:8004/files/",
        //   retryDelays: [0, 1000, 3000, 5000],
        // });

        uppy.on("upload-success", (file, response) => {
          console.log("Files uploaded:", file?.name);
          console.log("Url:", response.uploadURL);
          console.log(file?.extension);
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

        setUppyInstance(uppy);
      } catch (error) {
        console.error("Failed to initialize Uppy:", error);
        setError("Failed to initialize file upload component");
      }
    }

    initializeUppy();

    return () => {
      if (uppyInstance) {
        uppyInstance.clear();
      }
    };
  }, [formTarget, uppyId]);

  if (error) {
    return <div className="text-dangerPrimary">{error}</div>;
  }

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
export const UploadFilesComponent = ({
  setFormData,
  formData,
}: {
  setFormData: React.Dispatch<React.SetStateAction<NewTaskFormData>>;
  formData: NewTaskFormData;
}) => {
  const [uploadedResources, setUploadedResources] = useState<TaskResource[]>(
    [],
  );

  const [showUploadButton, setShowUploadButton] = useState<boolean>(false);
  console.log(showUploadButton);

  const handleUploadedResourcesUrls = (successfulFiles: TaskResource[]) => {
    setUploadedResources((prevUploads) => [...prevUploads, ...successfulFiles]);
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
          successfulFiles: UppyFile<Meta, Record<string, never>>[],
        ) => handleUploadedResourcesUrls(successfulFiles as TaskResource[])}
        toggleUploadBtn={(toggle: boolean) => setShowUploadButton(toggle)}
      />

      {uploadedResources.length > 0 && (
        <div className="pt-8">
          <div id="uploaded-files" className="flex gap-4 mt-2 flex-wrap">
            {uploadedResources.map((upload, index) => {
              return (
                <FilePreviewButton
                  key={index}
                  fileName={upload.name || null}
                  fileSize={upload.size}
                  fileUrl={upload.uploadURL || null}
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
