import {
  listArtifacts,
  getArtifactById,
  createArtifact,
  updateArtifact,
  deleteArtifact,
  editFileWithAI,
} from '../services/artifact.service.js';

export async function list(req, res) {
  const result = await listArtifacts(req.user.id, req.query);

  res.status(200).json({
    success: true,
    data: {
      artifacts: result.artifacts,
      total: result.total,
    },
    meta: {
      hasMore: result.hasMore,
    },
  });
}

export async function getById(req, res) {
  const artifact = await getArtifactById(req.user.id, req.params.id);

  res.status(200).json({
    success: true,
    data: { artifact },
  });
}

export async function create(req, res) {
  const artifact = await createArtifact(req.user.id, req.body);

  res.status(201).json({
    success: true,
    data: { artifact },
  });
}

export async function update(req, res) {
  const artifact = await updateArtifact(req.user.id, req.params.id, req.body);

  res.status(200).json({
    success: true,
    data: { artifact },
  });
}

export async function remove(req, res) {
  await deleteArtifact(req.user.id, req.params.id);

  res.status(200).json({
    success: true,
    data: { message: 'Artifact removed from library.' },
  });
}

export async function download(req, res) {
  const artifact = await getArtifactById(req.user.id, req.params.id);

  const filename = artifact.filename || 'document.txt';
  const encodedFilename = encodeURIComponent(filename).replace(/['()]/g, escape);

  res.setHeader('Content-Type', artifact.mimeType || 'text/plain; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`
  );

  res.send(artifact.content);
}

export async function editFile(req, res) {
  const { fileContent, fileName, mimeType, instructions, targetFormat } = req.body;
  const conversationId = req.params.id;

  const result = await editFileWithAI({
    userId: req.user.id,
    conversationId,
    fileContent,
    fileName,
    mimeType,
    instructions,
    targetFormat,
  });

  res.status(200).json({
    success: true,
    data: {
      artifact: result.artifact,
      explanation: result.explanation,
      userMessage: result.userMessage,
      assistantMessage: result.assistantMessage,
      conversation: result.conversation,
    },
  });
}

