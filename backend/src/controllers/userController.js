import {
  getAllUsers,
  getUserById,
  createUser,
  deleteUser,
} from "../services/userService.js";

export async function listUsers(req, res) {
  try {
    const users = await getAllUsers();
    return res.json({ status: "OK", users });
  } catch (error) {
    console.error("listUsers error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch users",
      error: error.message,
    });
  }
}

export async function getUser(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ status: "ERROR", message: "Invalid ID" });
    }

    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({ status: "ERROR", message: "User not found" });
    }

    return res.json({ status: "OK", user });
  } catch (error) {
    console.error("getUser error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch user",
      error: error.message,
    });
  }
}

export async function createUserHandler(req, res) {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ status: "ERROR", message: "email and password are required" });
    }

    const newUser = await createUser({ email, password, fullName });
    return res.status(201).json({ status: "OK", user: newUser });
  } catch (error) {
    console.error("createUserHandler error:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ status: "ERROR", message: "Email already exists" });
    }
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to create user",
      error: error.message,
    });
  }
}

export async function deleteUserHandler(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ status: "ERROR", message: "Invalid ID" });
    }

    const deleted = await deleteUser(id);
    if (!deleted) {
      return res.status(404).json({ status: "ERROR", message: "User not found" });
    }

    return res.json({ status: "OK", message: "User deleted" });
  } catch (error) {
    console.error("deleteUserHandler error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to delete user",
      error: error.message,
    });
  }
}
