import {
  ActionFunctionArgs,

  UploadHandler,
  redirect,
  json,
  unstable_composeUploadHandlers as composeUploadHandlers,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData,
} from "@remix-run/node";

import { deleteUser,requireUserId, updateUser } from "~/models/user.server";
import { uploadImage } from "~/services/fileUpload.server";
import cloudinary from "cloudinary";
import { logout } from "~/services/session.server";

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);

  // handle upload user image to cloudinary using the custom uploadimage function
  const uploadHandler: UploadHandler = composeUploadHandlers(
    async ({ name, data, contentType, filename }) => {
      // only upload avatar image if the input file is named avatar
      if (name !== "avatar" && !data) {
        return undefined;
      }
      console.log(data, filename, contentType, name);

      //parse image data to be uploaded asynchronously
      const uploadedImage: cloudinary.UploadApiResponse = await uploadImage(
        data
      );
      await updateUser(userId!, { profilePicture: uploadedImage.secure_url });
      return uploadedImage.secure_url;
    },
    createMemoryUploadHandler()
  );
  const formData = await parseMultipartFormData(request, uploadHandler);

  const role = formData.get("role");
  const username = formData.get("username");
  const avatar = formData.get("avatar");
  const action = formData.get("_action")
  if (action === "delete") {
    await deleteUser(userId!)
    return logout(request)
  }

  if (typeof username !== "string" || typeof role !== "string") {
    return json({ error: `Invalid Form Data` }, { status: 400 });
  }

  // if user uploaded avatar image, perform upload handler
  if (avatar) {
    // parse in the request data to the uploadhandler using parseMultipartFormdata function
    const imgSrc = formData.get("avatar");
    console.log(imgSrc);

    if (!imgSrc) {
      return json({ error: "something wrong", imgSrc: null });
    }
    await updateUser(userId!, { username, role });

    return json({ error: null, imgSrc, username, role });
  }

  await updateUser(userId!, { username, role });

  return redirect("/feed");
}

export async function loader() {
  return redirect("/feed");
}

// parse in the request data to the uploadhandler using parseMultipartFormdata function
