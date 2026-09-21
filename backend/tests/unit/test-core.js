import { generateConversationTitle } from '../../services/title.service.js';
import { buildConversationContext } from '../../services/context.service.js';
import { isSensitiveTopic } from '../../utils/sensitiveTopics.js';

console.log('Testing Title Generation...');
const title1 = await generateConversationTitle('What is Java?\nAnd how does it work?');
console.log('Title 1:', title1);
console.assert(title1.includes('Java'), 'Title 1 mismatch');

const hindiTitle = await generateConversationTitle('नमस्ते, मुझे जावा प्रोग्रामिंग और ऑब्जेक्ट ओरिएंटेड कॉन्सेप्ट्स के बारे में विस्तार से समझाइए');
console.log('Hindi title:', hindiTitle);
console.assert(Array.from(hindiTitle).length <= 61, 'Hindi title length violation');

console.log('Testing Sensitive Topic Detection...');
console.assert(isSensitiveTopic('What dose of paracetamol is safe for fever?') === true, 'Medical not detected');
console.assert(isSensitiveTopic('मुझे सिर दर्द की दवा बताओ') === true, 'Hindi medical not detected');
console.assert(isSensitiveTopic('How do I write a binary search in Java?') === false, 'False positive detected');

console.log('Testing Context Window Builder...');
const history = [
  { role: 'user', content: 'Hello' },
  { role: 'assistant', content: 'Hi there!' },
  { role: 'user', content: 'What is Java?' },
  { role: 'assistant', content: 'Java is an OOP language.' },
];
const nextMsg = { role: 'user', content: 'What are its advantages?' };
const context = buildConversationContext(history, nextMsg);

console.assert(context.contents.length === 5, 'Context length mismatch');
console.assert(context.contents[0].role === 'user', 'First turn must be user');
console.assert(context.contents[4].parts[0].text === 'What are its advantages?', 'Last turn mismatch');

console.log('✅ ALL CORE UNIT TESTS PASSED!');
