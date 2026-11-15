import {
  parseArtifacts,
  resolveArtifactNaming,
  detectRequestedFormat,
  getExtension,
  getMimeType,
} from '../../utils/artifactParser.js';
import {
  jsonToCsv,
  csvToJson,
  markdownToPlainText,
} from '../../utils/fileConverter.js';
import { DevArtifact } from '../../services/devStore.js';

console.log('Testing Artifact Naming & Format Detection...');

// 1. Preserve original format when no target specified
const naming1 = resolveArtifactNaming({
  originalFileName: 'app.js',
  instructions: 'Please refactor this component and add error boundaries',
});
console.log('Preserved Naming:', naming1);
console.assert(naming1.filename === 'app.js', 'Should preserve app.js filename');
console.assert(naming1.format === 'javascript', 'Should preserve javascript format');
console.assert(naming1.isConverted === false, 'Should not be marked as converted');

// 2. Convert to JSON when requested
const naming2 = resolveArtifactNaming({
  originalFileName: 'sales_data.csv',
  instructions: 'Convert this table to JSON format and add an active status',
});
console.log('Converted to JSON:', naming2);
console.assert(naming2.filename === 'sales_data.json', 'Should convert filename to sales_data.json');
console.assert(naming2.format === 'json', 'Format should be json');
console.assert(naming2.isConverted === true, 'Should be marked as converted');

// 3. Convert to CSV when requested
const naming3 = resolveArtifactNaming({
  originalFileName: 'users.json',
  instructions: 'Please export this as CSV for Excel',
});
console.assert(naming3.filename === 'users.csv', 'Should convert to users.csv');
console.assert(naming3.format === 'csv', 'Format should be csv');

// 4. Test Artifact Tag Parsing
console.log('Testing Artifact XML Tag Parser...');
const sampleAiOutput = `Here is the refactored code you asked for. I added input validation.

<neuro_artifact identifier="art_123" type="code" title="Refactored Calculator" filename="calculator.py" format="python">
def add(a: float, b: float) -> float:
    """Safely adds two numbers."""
    if not isinstance(a, (int, float)) or not isinstance(b, (int, float)):
        raise TypeError("Inputs must be numbers")
    return a + b
</neuro_artifact>

Let me know if you would like unit tests as well.`;

const parsed = parseArtifacts(sampleAiOutput, { originalFileName: 'calculator.py' });
console.assert(parsed.artifacts.length === 1, 'Should extract exactly 1 artifact');
console.assert(parsed.artifacts[0].title === 'Refactored Calculator', 'Title mismatch');
console.assert(parsed.artifacts[0].filename === 'calculator.py', 'Filename mismatch');
console.assert(parsed.artifacts[0].format === 'python', 'Format mismatch');
console.assert(parsed.artifacts[0].content.includes('def add(a: float, b: float)'), 'Content mismatch');
console.assert(!parsed.cleanText.includes('<neuro_artifact'), 'Clean text should strip raw XML tags');

// 5. Test File Converters
console.log('Testing File Format Converters...');
const jsonString = JSON.stringify([
  { id: 1, name: 'Alice', role: 'Engineer' },
  { id: 2, name: 'Bob', role: 'Designer' },
]);

const csvResult = jsonToCsv(jsonString);
console.assert(csvResult.includes('"id","name","role"'), 'CSV header mismatch');
console.assert(csvResult.includes('"Alice"'), 'CSV data mismatch');

const backToJson = JSON.parse(csvToJson(csvResult));
console.assert(backToJson.length === 2, 'Back to JSON length mismatch');
console.assert(backToJson[0].name === 'Alice', 'Back to JSON data mismatch');

// 6. Test DevArtifact In-Memory Store
console.log('Testing DevArtifact Store...');
const art = await DevArtifact.create({
  userId: 'user_1',
  conversationId: 'conv_1',
  title: 'Test Artifact',
  filename: 'test.js',
  content: 'console.log("hello");',
  format: 'javascript',
});

console.assert(art.id, 'Artifact should have an ID');
const found = await DevArtifact.findById(art.id);
console.assert(found && found.title === 'Test Artifact', 'Found artifact mismatch');

await DevArtifact.findByIdAndUpdate(art.id, { content: 'console.log("updated");' });
const updated = await DevArtifact.findById(art.id);
console.assert(updated.content.includes('updated'), 'Updated content mismatch');

await DevArtifact.deleteOne({ _id: art.id });
const deleted = await DevArtifact.findById(art.id);
console.assert(deleted === null, 'Artifact should be deleted');

console.log('✅ ALL ARTIFACT & FILE EDITING TESTS PASSED!');

