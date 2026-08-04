import type { clientLoginData } from "../models/clientModel";
const baseUrl = "http://localhost:3000/";

export class clientController {
  static async clientLogin({ email, password }: clientLoginData) {
    /**
     * check if email and password exits or not
     * call backend api
     * send result back to script
     */
    try {
      const response = await fetch(`${baseUrl}/client-login`);
      if (response.status != 200) {
        return { status: response.status, success: false };
      }
      const data = await response.json();
      return { data, success: true };
    } catch (error) {
      alert("Fetch failed: " + error);
    }
  }
}
