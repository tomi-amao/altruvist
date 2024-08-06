import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import MainHeader from "~/components/navigation/MainHeader";
import { FormField } from "~/components/utils/FormField";
import { logout } from "../services/session.server";
import { authenticator } from "~/services/auth.server";
import { authError, createUserSession, register } from "~/models/user.server";
import {
  validateEmail,
  validateFirstName,
  validateLastName,
  validatePassword,
} from "~/services/validators.server";

export default function Login() {
  const [registerView, setRegisterView] = useState(false);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    field: string,
  ) => {
    setFormData((form) => ({ ...form, [field]: event.target.value }));
  };

  const actionData = useActionData<typeof action>();
  const firstLoad = useRef(true);

  // hold field-specific errors and formError variables which will hold error messages to display form messages
  const [errors, setErrors] = useState(actionData?.errors || {});
  // updates the formData state variables to default to any values returned by the action function if available
  const [formData, setFormData] = useState({
    email: actionData?.fields?.email || "",
    password: actionData?.fields?.password || "",
    firstName: actionData?.fields?.lastName || "",
    lastName: actionData?.fields?.firstName || "",
  });

  useEffect(() => {
    if (!firstLoad.current) {
      const newState = {
        email: "",
        password: "",
        firstName: "",
        lastName: "",
      };
      setErrors(newState);
      setFormData(newState);
    }
  }, []);

  useEffect(() => {
    firstLoad.current = false;
  }, []);

  console.log("Action Data", actionData);

  const loaderData = useLoaderData<typeof loader>();
  console.log("Loaded Data", loaderData);

  return (
    <>
      <MainHeader />
      <div className="bg-bgsecondary flex flex-col  w-fit h-fit p-8 rounded-md mx-auto my-24 ">
        <h1 className="text-txtprimary text-2xl mx-auto">
          {actionData?._action === "login" ? "Sign in" : "Sign up"}
        </h1>
        <p className="text-txtprimary text-xs mx-auto mb-4">
          Start suggesting, or complaining
        </p>
        {loaderData?.error && (
          <p className="text-sm text-[#ac374b]"> Incorrect Login</p>
        )}
        <Form method="post" action="/login" className="flex flex-col mx-2">
          {actionData?.errors?.email && actionData?.errors?.email}

          <FormField
            htmlFor="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange(e, "email")}
            error={errors?.email}
          />
          {actionData?.errors?.password && actionData?.errors?.password}
          <FormField
            htmlFor="password"
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange(e, "password")}
            autocomplete="current-password"
            error={errors?.password}
          />

          {registerView && (
            <>
              {actionData?.errors?.firstName && actionData?.errors?.firstName}

              <FormField
                htmlFor="firstName"
                label="First name"
                type="string"
                value={formData.firstname}
                onChange={(e) => handleInputChange(e, "firstName")}
                autocomplete="given-name"
                error={errors?.firstName}
              />
              {actionData?.errors?.lastName && actionData?.errors?.lastName}

              <FormField
                htmlFor="lastName"
                label="Last name"
                type="string"
                value={formData.lastname}
                onChange={(e) => handleInputChange(e, "lastName")}
                autocomplete="family-name"
                error={errors?.lastName}
              />
            </>
          )}

          <div className="flex gap-4 items-center">
            <button
              type="button"
              onClick={() => {
                setRegisterView((prevalue) => !prevalue);
              }}
              className="text-txtprimary w-fit text-xs"
            >
              {registerView && "Sign in with your account "}
              {!registerView && "Create an Account "}
            </button>

            <button
              type="submit"
              name="_action"
              value={registerView === true ? "createAccount" : "signinUser"}
              className="w-fit px-2 py-1  rounded-sm text-sm bg-txtprimary"
            >
              {registerView && "Create account "}
              {!registerView && "Sign in "}
            </button>
          </div>
        </Form>
      </div>
    </>
  );
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const userCreds = Object.fromEntries(formData);
  console.log(`Action: ${userCreds._action}`);

  //validate formdata
  const emailValidation = validateEmail(userCreds.email as string);
  const passwordValidation = validatePassword(userCreds.password as string);
  const firstNameValidation = validateFirstName(userCreds.password as string);
  const lastNameValidation = validateLastName(userCreds.password as string);
  const errors: {
    email: string | boolean;
    password: string | boolean;
    firstName?: string | boolean;
    lastName?: string | boolean;
  } = { email: false, password: false };

  // add errors messages to error object
  if (!emailValidation.success) {
    errors.email = emailValidation.error.issues[0].message;
  }
  if (!passwordValidation.success) {
    errors.password = passwordValidation.error.issues[0].message;
  }
  // only perform name validation checks if user creates an account
  if (userCreds._action === "createAccount") {
    if (!firstNameValidation.success) {
      errors.firstName = firstNameValidation.error.issues[0].message;
    }
    if (!lastNameValidation.success) {
      errors.lastName = lastNameValidation.error.issues[0].message;
    }
  }

  switch (userCreds._action as string) {
    case "logout": {
      console.log("logging out");

      return await logout(request);
    }

    case "signinUser": {
      if (Object.values(errors).some(Boolean)) {
        return json({ errors });
      }

      const headers = await createUserSession(request, formData);

      return redirect("/feed", { headers });
    }
    case "createAccount": {
      if (Object.values(errors).some(Boolean)) {
        return json({ errors });
      }

      const registerResponse = await register(userCreds, request, formData);
      const validateRegister = await registerResponse.json();

      if (validateRegister.error) {
        errors.email = validateRegister.error;
        console.log(validateRegister.error);

        return json({ errors });
      }
      const session = registerResponse.headers;

      return redirect("/feed", { headers: session });
    }
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request);
  const error = await authError(request);
  if (error) {
    return json({ error }, { status: 401 });
  }
  if (user) {
    return redirect("/feed");
  }
  return null;
}
