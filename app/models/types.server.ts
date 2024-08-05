import type {User} from "@prisma/client"


export type RegisterForm = {
    email: User["email"],
    password: User["password"],
    lastName: string,
    firstName: string,
}

export type LoginForm = {
    email: User["email"],
    password: User["password"],

}
