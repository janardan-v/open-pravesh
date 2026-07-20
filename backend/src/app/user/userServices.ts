import type { RegisterData, LoginData } from "./userModel";
import { usersTable } from "../../db/schema";
import db from "../../db/index";
import { eq } from "drizzle-orm";
import ApiError from "../../common/utils/apiError";
import ApiResponse from "../../common/utils/apiResponse";
import { getPrivateKey} from "../../common/utils/pemTojwk";
import { verifyAccessToken} from "../../common/utils/jwtUtils";
import { password as psw } from "bun"; // using inBuilt library of bun to hash and verify the password

export default class userServices {
  static async register({
    name,
    email,
    password,
    dateOfBirth,
    phoneNumber,
  }: RegisterData) {
    const userEmailResult = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    if (userEmailResult.length > 0) {
      throw ApiError.badRequest("Email already exists");
    }

    const hashedPassword: string = await psw.hash(password);

    const [insertResult] = await db
      .insert(usersTable)
      .values({
        name,
        email,
        password: hashedPassword,
        dateOfBirth: dateOfBirth ?? null,
        phoneNumber: phoneNumber ?? null,
      })
      .returning({ id: usersTable.id });

    if (!insertResult) {
      throw ApiError.internalServerError("Error while creating user");
    }

    return ApiResponse.created("User registered successfully", {
      id: insertResult.id,
    });
  }

  static async login({ email, password: userPass }: LoginData) {
    // take credentials and look for user in db
    const [userEmailResult] = await db
      .select({
        userId: usersTable.id,
        email: usersTable.email,
        hashedPass: usersTable.password,
      })
      .from(usersTable)
      .where(eq(usersTable.email, email));

    // if user not found, throw error
    if (!userEmailResult) {
      throw ApiError.badRequest("User do not exists");
    }
    
    // if user found, check for password 
    const isPasswordValid = await psw.verify(
      userPass,
      userEmailResult.hashedPass!,
    );

    //  invalid password, throw error
    if (!isPasswordValid) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    // if all good
    // generate a short code
    // return it in url
    return ApiResponse.success("User found", {
      id: userEmailResult.userId,
      email: userEmailResult.email
    });
  }
}
