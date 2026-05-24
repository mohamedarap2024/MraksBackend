/** Standard API response messages — use exact strings across the system */

export const MSG = {
  register: {
    success: "Registered successfully",
    failure: "Registration failed. Please try again",
  },
  login: {
    success: "Login successful",
    failure: "Login failed. Unable to verify user",
  },
  search: {
    notFound: "This ID is not registered",
    found: "Student record found",
  },
  save: {
    success: "Data saved successfully",
    failure: "Unable to save data",
  },
  update: {
    success: "Updated successfully",
    failure: "Update failed",
  },
  delete: {
    success: "Deleted successfully",
    failure: "Delete operation failed",
  },
  db: {
    connectionFailed: "Database connection failed",
    unableToProcess: "Unable to process request",
  },
  backend: {
    operationFailed: "Operation failed. Please try again later",
  },
  upload: {
    success: "Results uploaded successfully",
    failure: "Result upload failed",
  },
} as const;
