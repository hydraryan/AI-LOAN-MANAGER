import API from "./api";

export type UserResponse = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: "Admin";
  lastActive: string;
};

// 🔥 role mapper
const mapRole = (role: string): User["role"] => {
  return role === "admin" ? "Admin" : "Admin";
};

export const getUsers = async (): Promise<User[]> => {
  const res = await API.get<UserResponse[]>("/users");

  return res.data.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: mapRole(u.role),
    lastActive: u.updatedAt ? new Date(u.updatedAt).toLocaleString() : "-"
  }));
};