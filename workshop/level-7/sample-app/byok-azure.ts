/**
 * byok-azure.ts — BYOK with Azure OpenAI (the critical type distinction)
 *
 * Azure has TWO different endpoint styles that require DIFFERENT type values:
 *   - Native Azure:    type: "azure"   + host only (no /openai/v1 path)
 *   - Azure AI Foundry: type: "openai" + full path with /openai/v1/
 *
 * Getting this wrong = connection errors. This is the #1 Azure BYOK gotcha.
 *
 * Exercise covered: 4 (BYOK with Azure OpenAI)
 *
 * Run: npx tsx byok-azure.ts
 */

console.log("☁️  BYOK with Azure OpenAI — Two Endpoint Styles\n");

console.log("=== Style 1: Native Azure OpenAI ===\n");
console.log("  Endpoint: https://my-resource.openai.azure.com");
console.log("  Config:");
console.log(`    provider: {
      type: "azure",                                    // ← "azure" not "openai"!
      baseUrl: "https://my-resource.openai.azure.com",  // Host only — NO /openai/v1
      apiKey: process.env.AZURE_OPENAI_KEY,
    }`);
console.log();

console.log("=== Style 2: Azure AI Foundry ===\n");
console.log("  Endpoint: https://your-resource.openai.azure.com/openai/v1/");
console.log("  Config:");
console.log(`    provider: {
      type: "openai",                                                   // ← "openai" not "azure"!
      baseUrl: "https://your-resource.openai.azure.com/openai/v1/",     // Full path with /openai/v1/
      apiKey: process.env.AZURE_AI_FOUNDRY_KEY,
    }`);
console.log();

console.log("=== The Critical Distinction ===\n");
console.log("  ┌──────────────────────┬──────────┬────────────────────────────┐");
console.log("  │ Azure Style          │ type     │ baseUrl                    │");
console.log("  ├──────────────────────┼──────────┼────────────────────────────┤");
console.log("  │ Native Azure OpenAI  │ 'azure'  │ Host only (no path)        │");
console.log("  │ Azure AI Foundry     │ 'openai' │ Full path with /openai/v1/ │");
console.log("  └──────────────────────┴──────────┴────────────────────────────┘");
console.log();
console.log("  ⚠️  Wrong type = connection error. This is the #1 Azure gotcha.");
console.log();

console.log("=== All BYOK Providers Summary ===\n");
console.log("  ┌─────────────┬──────────────┬─────────────────────────────────────┐");
console.log("  │ Provider    │ type         │ baseUrl                             │");
console.log("  ├─────────────┼──────────────┼─────────────────────────────────────┤");
console.log("  │ OpenAI      │ 'openai'     │ https://api.openai.com/v1           │");
console.log("  │ Azure (nat) │ 'azure'      │ https://resource.openai.azure.com   │");
console.log("  │ Azure (AI)  │ 'openai'     │ https://resource.../openai/v1/      │");
console.log("  │ Anthropic   │ 'anthropic'  │ https://api.anthropic.com           │");
console.log("  │ Ollama      │ 'openai'     │ http://localhost:11434/v1           │");
console.log("  └─────────────┴──────────────┴─────────────────────────────────────┘");
console.log();
console.log("Note: This is a config reference exercise.");
console.log("To test, set AZURE_OPENAI_KEY and update the baseUrl to your resource.");

process.exit(0);
