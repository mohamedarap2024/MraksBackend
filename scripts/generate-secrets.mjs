import { randomBytes } from "node:crypto";

const admin = randomBytes(32).toString("hex");
const student = randomBytes(32).toString("hex");

console.log("Paste into Vercel / backend .env:\n");
console.log(`ADMIN_TOKEN=${admin}`);
console.log(`STUDENT_TOKEN=${student}`);
