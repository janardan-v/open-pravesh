import { clientRegisterSchema, clientLoginSchema} from "./clientModel";
import ApiError from "../../common/utils/apiError";
import ApiResponse from "../../common/utils/apiResponse";
import clientServices from "./clientServices";
import { type Response, type Request, type NextFunction, response } from "express";

export default class clientController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = clientRegisterSchema.safeParse(req.body);
      
      if (!data.success) {
        throw ApiError.badRequest(
          data.error.issues[0]?.message || "All data fields are required",
        );
      }
  
      const result = await clientServices.register(data.data);
  
      if (!result || !result.success || !result.data) {
        return ApiError.internalServerError("Error while creating client");
      }
  
      return res.status(result.statusCode).json(result)   
    } catch (error) {
      next(error)
    }
  }

  
  static async login( req: Request, res: Response, next: NextFunction) {
    // take credentials and look for user in db
    try {
      const data = clientLoginSchema.safeParse(req.body);
  
      if (!data.success) {
        throw ApiError.badRequest(
          data.error.issues[0]?.message || "All data fields are required",
        );
      }
  
      const result = await clientServices.login(data.data);
  
      if (!result) {
        return ApiError.internalServerError("Error while finding client");
      }
  
      return res.status(result.statusCode).json(result)   
    } catch (error) {
      next(error)
    }
  }
 
  static async getUser(acceessToken: string) {}
}
