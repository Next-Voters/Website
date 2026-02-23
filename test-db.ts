import { betterAuth } from "better-auth";
import { db } from "./lib/db";

try {
  const auth = betterAuth({
    database: {
        db,
        type: "postgres"
    } as any,
    socialProviders: {
      google: { clientId: "x", clientSecret: "y" }
    }
  });
  console.log("Success with direct db pass!");
} catch (e) {
  console.log("Failed", e);
}
