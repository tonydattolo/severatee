import { SecretVaultWrapper } from "secretvaults";
import { orgConfig } from "./nillion.config.js";
import schema from "./lumon-task-schema.json";

export async function createLumonTaskSchema() {
  try {
    const org = new SecretVaultWrapper(
      orgConfig.nodes,
      orgConfig.orgCredentials,
    );
    await org.init();

    // create a new collectionschema
    const newSchema = await org.createSchema(schema, "Web3 Experience Survey");
    console.log("📚 New Schema:", newSchema);
  } catch (error) {
    console.error(
      "❌ Failed to use SecretVaultWrapper:",
      JSON.stringify(error),
    );
    process.exit(1);
  }
}
