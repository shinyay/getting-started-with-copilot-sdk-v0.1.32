/**
 * image-attachments.ts — Send images for model analysis
 *
 * The SDK can send images alongside prompts. The model analyzes the
 * image and responds based on its contents.
 *
 * Exercise covered: 1 (Image analysis with attachments)
 *
 * Run: npx tsx image-attachments.ts
 */

import { CopilotClient, approveAll } from "@github/copilot-sdk";
import { existsSync } from "node:fs";

const imagePath = "./sample-images/diagram.png";

console.log("🖼️  Image Attachments — Send images for analysis\n");

if (!existsSync(imagePath)) {
  console.log(`⚠️  Sample image not found at: ${imagePath}\n`);
  console.log("Create a test image first:");
  console.log("  Option 1: Take a screenshot and save as sample-images/diagram.png");
  console.log("  Option 2: curl -o sample-images/diagram.png https://via.placeholder.com/400x200.png\n");
  console.log("The attachment config looks like:\n");
  console.log(`  await session.sendAndWait({
    prompt: "What's in this image?",
    attachments: [{ type: "file", path: "./sample-images/diagram.png" }],
  });`);
  console.log("\nKey points:");
  console.log("  - attachments is an array (multiple images possible)");
  console.log('  - type: "file" + path to the image file');
  console.log("  - Supported formats: PNG, JPG, GIF, WebP");
  process.exit(0);
}

const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
  onPermissionRequest: approveAll,
});

session.on("assistant.message_delta", (e) => process.stdout.write(e.data.deltaContent));
session.on("session.idle", () => console.log("\n"));

console.log(`Sending image: ${imagePath}\n`);
process.stdout.write("Assistant: ");
await session.sendAndWait({
  prompt: "Describe what you see in this image. What is it showing?",
  attachments: [{ type: "file", path: imagePath }],
});

await client.stop();
process.exit(0);
