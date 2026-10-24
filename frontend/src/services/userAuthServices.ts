import { api } from "./api";
import type { ApiResponse } from '../types/api'


export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  dateOfBirth: string;
  phoneNumber: string;
};

type RegisterResult = {
  id: string;
};

export async function registerUser(
  data: RegisterInput,
): Promise<ApiResponse<RegisterResult>> {
  const response = await api.post<ApiResponse<RegisterResult>>(
    "/register",
    data,
  );

  return response.data;
}

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginResult = {
  redirectTo: string
}

export async function loginUser(
  clientId: string,
  data: LoginInput,
): Promise<LoginResult> {
  const response = await api.post<LoginResult>(
    `/login/${encodeURIComponent(clientId)}`,
    data,
  )

  return response.data
}
