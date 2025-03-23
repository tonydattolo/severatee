import { SecretVaultWrapper } from "secretvaults";
import { orgConfig } from "./nillion.config.js";
import schema from "./lumon-task-schema.json";
import testSchema from "./nillion.schema.example.json";

export async function createLumonTaskSchema() {
  try {
    const org = new SecretVaultWrapper(
      orgConfig.nodes,
      orgConfig.orgCredentials,
    );
    await org.init();

    // create a new collectionschema
    const newSchema = await org.createSchema(schema, "Lumon Tasks");
    console.log("📚 New Schema:", newSchema);
    return newSchema;
  } catch (error) {
    console.error(
      "❌ Failed to use SecretVaultWrapper:",
      JSON.stringify(error),
    );
    throw error;
  }
}

export async function createTestSchema() {
  try {
    const org = new SecretVaultWrapper(
      orgConfig.nodes,
      orgConfig.orgCredentials,
    );
    await org.init();

    // create a new collectionschema
    const newSchema = await org.createSchema(testSchema, "Test Schema");
    console.log("📚 New Schema:", newSchema);
    return newSchema;
  } catch (error) {
    console.error(
      "❌ Failed to use SecretVaultWrapper:",
      JSON.stringify(error),
    );
    throw error;
  }
}
