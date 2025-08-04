import React, { useEffect, useState } from "react";
import Uppy, { Meta, UppyFile } from "@uppy/core";
import { Dashboard } from "@uppy/react";
// import GoogleDrivePicker from "@uppy/google-drive-picker";
import ImageEditor from "@uppy/image-editor";
// import Tus from "@uppy/tus";
import DropTarget from "@uppy/drop-target";
import ThumbnailGenerator from "@uppy/thumbnail-generator";
import ProgressBar from "@uppy/progress-bar";
import Compressor from "@uppy/compressor";
import AwsS3 from "@uppy/aws-s3";
import { useViewport } from "~/hooks/useViewport";

import "@uppy/core/dist/style.css";
import "@uppy/dashboard/dist/style.css";
import "@uppy/image-editor/dist/style.css";
import "@uppy/progress-bar/dist/style.css";

const FileUpload = ({
  formTarget,
  uppyId,
  onUploadedFile,
  uploadURL,
}: {
  formTarget: string;
  uppyId: string;
  onUploadedFile: (
    uploadedUrl: UppyFile<Meta, Record<string, never>>[],
  ) => void;
  toggleUploadBtn?: (toggle: boolean) => void;
  uploadURL: string;
}) => {
  const [uppyInstance, setUppyInstance] = useState<Uppy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isMobile } = useViewport();

  useEffect(() => {
    async function initializeUppy() {
      try {
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
          // .use(GoogleDrivePicker, {
          //   companionUrl: uploadURL,
          //   clientId,
          //   apiKey,
          //   appId: clientId.split("-")[0],
          // })
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
            endpoint: uploadURL,
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
      plugins={["ImageEditor"]}
      theme="light"
      // hideUploadButton
      height={isMobile ? "350px" : "350px"}
      width={isMobile ? "384px" : "600px"}
    />
  );
};

export default FileUpload;
