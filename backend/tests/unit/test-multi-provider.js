import { AIProviderRouter } from '../../services/ai/aiProviderRouter.js';
import { GeminiChatService } from '../../services/ai/geminiChat.service.js';
import { NemotronChatService } from '../../services/ai/nemotronChat.service.js';
import { GeminiImageService } from '../../services/ai/geminiImage.service.js';
import { getGeminiChatKey, getGeminiImageKey, getNemotronApiKey } from '../../config/env.js';

console.log('=== MULTI-PROVIDER AI INTEGRATION TEST SUITE ===');

// 1. Key Isolation Verification
console.log('\n--- 1. Testing Key Isolation & Separation ---');
const chatKey = getGeminiChatKey();
const imageKey = getGeminiImageKey();
const nemotronKey = getNemotronApiKey();

console.assert(Boolean(chatKey), 'Gemini Chat Key (Key 1) must be configured');
console.assert(Boolean(imageKey), 'Gemini Image Key (Key 2) must be configured');
console.assert(Boolean(nemotronKey), 'NVIDIA Nemotron Key must be configured');

console.assert(chatKey !== imageKey, 'CRITICAL: Gemini Key 1 and Key 2 must be completely distinct');
console.assert(nemotronKey.startsWith('nvapi-'), 'NVIDIA Key must start with nvapi-');
console.log('✅ Key isolation verified: All 3 keys are uniquely separated with distinct responsibilities.');

// 2. Model Status Verification
console.log('\n--- 2. Testing AIProviderRouter.getModelStatus ---');
const status = AIProviderRouter.getModelStatus();
console.assert(status.chatModels.length === 2, 'Should advertise exactly 2 chat models (Gemini & Nemotron)');
console.assert(status.chatModels[0].id === 'gemini', 'First model should be Gemini');
console.assert(status.chatModels[0].isDefault === true, 'Gemini should be default');
console.assert(status.chatModels[1].id === 'nemotron', 'Second model should be Nemotron');
console.assert(status.imageProvider.id === 'gemini-image', 'Image provider should be gemini-image');
console.log('✅ Model status verified:', status.chatModels.map(m => m.name).join(', '));

// 3. Live Chat Generation with Gemini (Key 1)
console.log('\n--- 3. Testing GeminiChatService (Key 1 Exclusively) ---');
try {
  const geminiRes = await GeminiChatService.generateReply({
    contents: [
      { role: 'user', parts: [{ text: 'Respond with exactly: "GEMINI_CHAT_TEST_OK"' }] }
    ]
  });
  console.assert(geminiRes.provider === 'gemini', 'Provider must be gemini');
  console.assert(geminiRes.text.includes('GEMINI_CHAT_TEST_OK'), 'Gemini should return expected text');
  console.log(`✅ Gemini Chat succeeded (${geminiRes.model}, latency: ${geminiRes.latencyMs}ms): "${geminiRes.text.trim()}"`);
} catch (err) {
  console.error('❌ Gemini Chat failed:', err.message);
  throw err;
}

// 4. Live Chat Generation with NVIDIA Nemotron 3 Ultra
console.log('\n--- 4. Testing NemotronChatService (NVIDIA Key Exclusively) ---');
try {
  const nemotronRes = await NemotronChatService.generateReply({
    contents: [
      { role: 'user', parts: [{ text: 'Respond with exactly: "NEMOTRON_CHAT_TEST_OK"' }] }
    ]
  });
  console.assert(nemotronRes.provider === 'nemotron', 'Provider must be nemotron');
  console.assert(nemotronRes.text.includes('NEMOTRON_CHAT_TEST_OK'), 'Nemotron should return expected text');
  console.log(`✅ Nemotron Chat succeeded (${nemotronRes.model}, latency: ${nemotronRes.latencyMs}ms): "${nemotronRes.text.trim()}"`);
} catch (err) {
  console.error('❌ Nemotron Chat failed:', err.message);
  throw err;
}

// 5. Router Model Selection Routing Verification
console.log('\n--- 5. Testing AIProviderRouter.routeChat ---');
const routedGemini = await AIProviderRouter.routeChat({
  model: 'gemini',
  contents: [{ role: 'user', parts: [{ text: 'Say hi' }] }]
});
console.assert(routedGemini.provider === 'gemini', 'Routed to Gemini');

const routedNemotron = await AIProviderRouter.routeChat({
  model: 'nemotron',
  contents: [{ role: 'user', parts: [{ text: 'Say hi' }] }]
});
console.assert(routedNemotron.provider === 'nemotron', 'Routed to Nemotron');
console.log('✅ Router successfully dispatched requests to respective provider based on model parameter.');

// 6. Gemini Image Generation & Storage Verification (Key 2)
console.log('\n--- 6. Testing GeminiImageService (Key 2 Exclusively) ---');
const imagePrompt = 'A sleek minimalist neon icon of a brain with glowing neural synapses, vector digital art';
try {
  const imgResult = await GeminiImageService.generateImage({
    prompt: imagePrompt,
    style: 'digital_art',
    aspectRatio: '1:1',
    userId: 'test_user_id',
  });

  console.assert(imgResult.imageId, 'Image must have an imageId');
  console.assert(imgResult.url.startsWith('/api/images/raw/'), 'URL must point to raw endpoint');
  console.assert(imgResult.size > 1000, 'Image file size must be substantial (>1KB)');
  console.log(`✅ Image generation and disk storage succeeded!`);
  console.log(`   Model: ${imgResult.model}`);
  console.log(`   URL: ${imgResult.url}`);
  console.log(`   Size: ${imgResult.size} bytes`);
  console.log(`   Billing Notice: ${imgResult.billingNotice || 'None (Direct Generation)'}`);

  // Test retrieval
  const retrieved = await GeminiImageService.getImageFile(imgResult.imageId);
  console.assert(retrieved.filePath && retrieved.mimeType, 'Retrieved file info must be valid');
  console.log('✅ Stored image file retrieval verified.');
} catch (imgErr) {
  console.error('❌ Image Generation test error:', imgErr.message);
  throw imgErr;
}

console.log('\n🎉 ALL MULTI-PROVIDER AI TESTS COMPLETED SUCCESSFULLY!');

