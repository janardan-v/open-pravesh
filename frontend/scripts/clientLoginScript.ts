import ts from "typescript";
import { clientController } from "../controllers/clientController";

const loginForm = document.getElementById("clientLoginForm") as HTMLFormElement;
const errorScreen = document.getElementById("loginErrorScreen");

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(loginForm);
  const email = formData.get("email");
  const password = formData.get("password");
  if (!email || !password) {
    // un hide the no credentials div
    alert("No credentials found");
  }
  console.log("Email ", email)
  console.log("Password ", password)
  //   @ts-ignore
  const result = await clientController.clientLogin({ email, password });
  if (result?.success) {
    alert("Login failed");
  }
  console.log(result)
  alert("Login succssfuly");
});
