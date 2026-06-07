const kgService = require('../services/kgService');
const { asyncHandler } = require('../utils');

const getGraph = asyncHandler(async (req, res) => {
  const { refresh } = req.query;
  let graph;
  if (refresh === 'true') {
    graph = await kgService.refreshGraph(req.user._id);
  } else {
    graph = await kgService.getOrCreateGraph(req.user._id);
    if (graph.nodes.length === 0) {
      graph = await kgService.refreshGraph(req.user._id);
    }
  }
  res.json(kgService.serializeGraph(graph));
});

const refreshGraph = asyncHandler(async (req, res) => {
  const graph = await kgService.refreshGraph(req.user._id);
  res.json(kgService.serializeGraph(graph));
});

const getNodeDetail = asyncHandler(async (req, res) => {
  const { nodeId } = req.params;
  const detail = await kgService.getNodeDetail(req.user._id, nodeId);
  if (!detail) {
    return res.status(404).json({ error: '节点不存在' });
  }
  res.json(detail);
});

const updateNode = asyncHandler(async (req, res) => {
  const { nodeId } = req.params;
  const { isHidden, annotations, synonyms, name, category } = req.body;
  const graph = await kgService.getOrCreateGraph(req.user._id);
  const node = graph.nodes.find((n) => n._id.toString() === nodeId || n.id === nodeId);

  if (!node) {
    return res.status(404).json({ error: '节点不存在' });
  }

  if (typeof isHidden === 'boolean') node.isHidden = isHidden;
  if (Array.isArray(synonyms)) node.synonyms = synonyms;
  if (typeof name === 'string') node.name = name;
  if (typeof category === 'string') node.category = category;
  if (Array.isArray(annotations)) {
    node.annotations = annotations.map((a) => ({
      content: a.content,
      createdAt: a.createdAt || new Date(),
    }));
  }

  await graph.save();
  res.json(kgService.serializeGraph(graph));
});

const addAnnotation = asyncHandler(async (req, res) => {
  const { nodeId } = req.params;
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: '批注内容不能为空' });
  }

  const graph = await kgService.getOrCreateGraph(req.user._id);
  const node = graph.nodes.find((n) => n._id.toString() === nodeId || n.id === nodeId);

  if (!node) {
    return res.status(404).json({ error: '节点不存在' });
  }

  node.annotations.push({ content: content.trim() });
  await graph.save();

  const updated = node.annotations[node.annotations.length - 1];
  res.json({
    id: updated._id.toString(),
    content: updated.content,
    createdAt: updated.createdAt,
  });
});

const removeAnnotation = asyncHandler(async (req, res) => {
  const { nodeId, annotationId } = req.params;
  const graph = await kgService.getOrCreateGraph(req.user._id);
  const node = graph.nodes.find((n) => n._id.toString() === nodeId || n.id === nodeId);

  if (!node) {
    return res.status(404).json({ error: '节点不存在' });
  }

  node.annotations = node.annotations.filter((a) => a._id.toString() !== annotationId);
  await graph.save();
  res.json({ success: true });
});

const toggleNodeHidden = asyncHandler(async (req, res) => {
  const { nodeId } = req.params;
  const graph = await kgService.getOrCreateGraph(req.user._id);
  const node = graph.nodes.find((n) => n._id.toString() === nodeId || n.id === nodeId);

  if (!node) {
    return res.status(404).json({ error: '节点不存在' });
  }

  node.isHidden = !node.isHidden;
  await graph.save();
  res.json({ isHidden: node.isHidden });
});

const addManualEdge = asyncHandler(async (req, res) => {
  const { source, target } = req.body;
  if (!source || !target || source === target) {
    return res.status(400).json({ error: '无效的连线参数' });
  }

  const graph = await kgService.getOrCreateGraph(req.user._id);

  const exists = graph.edges.find(
    (e) =>
      (e.source === source && e.target === target) ||
      (e.source === target && e.target === source)
  );

  if (exists) {
    return res.status(400).json({ error: '连线已存在' });
  }

  const newEdge = {
    source,
    target,
    weight: 1,
    type: 'manual',
    noteIds: [],
    createdAt: new Date(),
  };

  graph.edges.push(newEdge);
  await graph.save();

  const saved = graph.edges[graph.edges.length - 1];
  res.json({
    id: saved._id.toString(),
    source: saved.source,
    target: saved.target,
    weight: saved.weight,
    type: saved.type,
    createdAt: saved.createdAt,
  });
});

const removeEdge = asyncHandler(async (req, res) => {
  const { edgeId } = req.params;
  const graph = await kgService.getOrCreateGraph(req.user._id);

  const initialLength = graph.edges.length;
  graph.edges = graph.edges.filter((e) => e._id.toString() !== edgeId && e.id !== edgeId);

  if (graph.edges.length === initialLength) {
    return res.status(404).json({ error: '连线不存在' });
  }

  await graph.save();
  res.json({ success: true });
});

const exportData = asyncHandler(async (req, res) => {
  const { format } = req.query;
  const graph = await kgService.getOrCreateGraph(req.user._id);
  const serialized = kgService.serializeGraph(graph);

  if (format === 'json') {
    const exportData = {
      nodes: serialized.nodes.map((n) => ({
        id: n.id,
        name: n.name,
        category: n.category,
        frequency: n.frequency,
        synonyms: n.synonyms,
        firstSeenAt: n.firstSeenAt,
        lastSeenAt: n.lastSeenAt,
      })),
      edges: serialized.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        weight: e.weight,
        type: e.type,
      })),
      generatedAt: serialized.generatedAt,
      totalNotes: serialized.totalNotes,
      totalWorks: serialized.totalWorks,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=knowledge-graph-${Date.now()}.json`);
    res.json(exportData);
  } else if (format === 'csv') {
    const nodesHeader = 'id,name,category,frequency,firstSeenAt,lastSeenAt,synonyms\n';
    const nodesRows = serialized.nodes
      .map((n) => `${n.id},"${n.name}",${n.category},${n.frequency},${n.firstSeenAt},${n.lastSeenAt},"${(n.synonyms || []).join(';')}"`)
      .join('\n');

    const edgesHeader = '\n\nid,source,target,weight,type\n';
    const edgesRows = serialized.edges
      .map((e) => `${e.id},${e.source},${e.target},${e.weight},${e.type}`)
      .join('\n');

    const csv = nodesHeader + nodesRows + edgesHeader + edgesRows;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=knowledge-graph-${Date.now()}.csv`);
    res.send('\uFEFF' + csv);
  } else {
    res.json(serialized);
  }
});

module.exports = {
  getGraph,
  refreshGraph,
  getNodeDetail,
  updateNode,
  addAnnotation,
  removeAnnotation,
  toggleNodeHidden,
  addManualEdge,
  removeEdge,
  exportData,
};
