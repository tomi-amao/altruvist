import { Session } from "@remix-run/node";
import type { AppError } from "~/types/error";

export async function getFlashError(session: Session): Promise<AppError | null> {
  const error = session.get("error") as AppError | null;
  session.unset("error");
  return error;
}

export async function setFlashError(session: Session, error: AppError) {
  session.flash("error", error);
}
