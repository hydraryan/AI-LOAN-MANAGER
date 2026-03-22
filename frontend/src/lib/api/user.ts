import API from "./api";

export type UserResponse = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastActive: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Staff" | "Manager";
  status: "Active" | "Inactive";
  lastActive: string;
};

// 🔥 role mapper
const mapRole = (role: string): User["role"] => {
  switch (role) {
    case "admin":
      return "Admin";
    case "officer":
      return "Staff";
    case "borrower":
      return "Manager";
    default:
      return "Staff";
  }
};

export const getUsers = async (): Promise<User[]> => {
  const res = await API.get<UserResponse[]>("/users");

  return res.data.map((u) => ({
    ...u,
    role: mapRole(u.role),
    status: "Active" // temp
  }));
};