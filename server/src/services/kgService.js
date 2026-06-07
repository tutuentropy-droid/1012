const KnowledgeGraph = require('../models/KnowledgeGraph');
const Note = require('../models/Note');
const Work = require('../models/Work');
const dayjs = require('dayjs');

const STOP_WORDS = new Set([
  '的', '了', '是', '我', '你', '他', '她', '它', '们', '这', '那', '个', '一', '不',
  '在', '有', '和', '就', '人', '都', '一', '上', '也', '很', '到', '说', '要', '去',
  '你', '会', '着', '没有', '看', '好', '自己', '这', '那', '里', '什么', '怎么',
  '但', '而', '与', '及', '或', '等', '之', '其', '此', '彼', '被', '把', '让',
  '从', '向', '对', '于', '给', '为', '因', '由', '以', '则', '却', '又', '再',
  '还', '才', '便', '就', '已', '曾', '将', '正', '刚', '才', '只', '仅',
  '啊', '呀', '吧', '呢', '吗', '嗯', '哦', '哈', '呵', '唉',
  '可以', '可能', '应该', '能够', '觉得', '感觉', '知道', '想', '认为', '以为',
  '这个', '那个', '这些', '那些', '这样', '那样', '怎么', '什么', '为什么',
  '因为', '所以', '但是', '可是', '然后', '后来', '现在', '以后', '之前',
  '其实', '真的', '非常', '特别', '比较', '更', '最', '太', '挺',
  '一个', '一些', '一下', '一样', '一定', '一起', '一直', '已经',
  '东西', '事情', '时候', '地方', '部分', '方面', '之间',
  'which', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over',
  'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
  'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other',
  'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
  'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while',
]);

const PERSON_PREFIXES = ['先生', '小姐', '女士', '老师', '教授', '博士', '国王', '女王', '皇帝', '太后', '公子', '姑娘'];
const ERA_KEYWORDS = ['朝', '代', '时期', '时代', '年间', '初', '末', '中', '盛世', '乱世', '春秋', '战国', '三国', '唐宋', '明清', '先秦', '魏晋', '南北朝', '五代', '民国'];
const IMAGERY_KEYWORDS = ['月', '风', '雨', '雪', '花', '鸟', '山', '水', '云', '雾', '霞', '露', '霜', '梅', '兰', '竹', '菊', '松', '柳', '莲', '荷', '秋', '春', '夏', '冬', '夜', '晨', '暮', '黄昏', '夕阳', '明月', '落花', '流水', '孤鸿', '寒鸦', '烟雨', '残阳', '古道', '长亭', '西楼', '东篱', '南山', '沧海', '桑田'];
const PLACE_SUFFIXES = ['城', '州', '郡', '府', '县', '镇', '村', '山', '河', '江', '湖', '海', '关', '岭', '楼', '阁', '亭', '台', '寺', '庙', '观', '庵', '园', '院', '宫', '殿', '堂', '斋', '居', '馆', '庄', '坞', '渡', '津', '驿'];

const SYNONYMS_MAP = {
  '贾宝玉': ['宝玉', '宝二爷'],
  '林黛玉': ['黛玉', '林妹妹', '潇湘妃子'],
  '薛宝钗': ['宝钗', '宝姐姐', '蘅芜君'],
  '王熙凤': ['凤姐', '琏二奶奶', '凤辣子'],
  '史湘云': ['湘云', '枕霞旧友'],
  '贾探春': ['探春', '蕉下客'],
  '花袭人': ['袭人', '花珍珠'],
  '晴雯': [],
  '苏轼': ['苏东坡', '苏子瞻', '东坡居士'],
  '李白': ['李太白', '青莲居士', '谪仙人'],
  '杜甫': ['杜子美', '杜工部', '少陵野老'],
  '白居易': ['白乐天', '香山居士'],
  '辛弃疾': ['辛幼安', '稼轩'],
  '李清照': ['李后主', '易安居士'],
  '王维': ['王摩诘', '王右丞'],
  '陶渊明': ['陶潜', '陶元亮', '五柳先生'],
  '屈原': ['屈平', '屈子'],
  '司马迁': ['司马子长', '太史公'],
  '关汉卿': [],
  '汤显祖': ['汤义仍'],
  '曹雪芹': ['曹沾', '曹雪芹'],
  '罗贯中': [],
  '施耐庵': [],
  '吴承恩': [],
  '兰陵笑笑生': [],
  '吴敬梓': [],
  '蒲松龄': ['柳泉居士'],
  '长安': ['西安'],
  '金陵': ['南京', '建康', '建业'],
  '燕京': ['北京', '大都', '北平'],
  '临安': ['杭州'],
  '姑苏': ['苏州'],
  '广陵': ['扬州'],
  '汴京': ['开封', '东京'],
  '洛阳': ['洛邑'],
  '成都': ['锦官城', '蓉城'],
  '唐朝': ['唐代', '盛唐', '李唐'],
  '宋朝': ['宋代', '赵宋'],
  '明朝': ['明代', '朱明'],
  '清朝': ['清代', '满清'],
  '汉朝': ['汉代', '两汉'],
  '先秦': ['春秋战国'],
  '民国': ['民国时期'],
};

function getSynonymKey(word) {
  for (const [key, synonyms] of Object.entries(SYNONYMS_MAP)) {
    if (word === key || synonyms.includes(word)) {
      return key;
    }
  }
  return word;
}

function isChineseChar(c) {
  return /[\u4e00-\u9fa5]/.test(c);
}

function extractChineseWords(text) {
  const words = [];
  const cleanText = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ');

  for (let len = 4; len >= 2; len--) {
    for (let i = 0; i <= cleanText.length - len; i++) {
      const slice = cleanText.slice(i, i + len);
      if (/^[\u4e00-\u9fa5]{2,4}$/.test(slice) && !STOP_WORDS.has(slice)) {
        words.push(slice);
      }
    }
  }

  const englishWords = cleanText.match(/[a-zA-Z]{3,}/g) || [];
  englishWords.forEach((w) => {
    if (!STOP_WORDS.has(w.toLowerCase())) {
      words.push(w);
    }
  });

  return words;
}

function categorizeWord(word) {
  for (const imagery of IMAGERY_KEYWORDS) {
    if (word.includes(imagery) && word.length <= 4) {
      return 'imagery';
    }
  }

  for (const era of ERA_KEYWORDS) {
    if ((word.endsWith(era) || word.includes(era)) && word.length <= 6) {
      return 'era';
    }
  }

  for (const prefix of PERSON_PREFIXES) {
    if (word.endsWith(prefix) || word.startsWith(prefix)) {
      return 'person';
    }
  }

  for (const suffix of PLACE_SUFFIXES) {
    if (word.endsWith(suffix) && word.length >= 2) {
      return 'place';
    }
  }

  if (/^[\u4e00-\u9fa5]{2,3}$/.test(word)) {
    if (word[0] === word[0].toUpperCase() && isChineseChar(word[0])) {
      const surnameChars = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳酆鲍史唐费廉岑薛雷贺倪汤滕殷罗毕郝邬安常乐于时傅皮卞齐康伍余元卜顾孟平黄和穆萧尹姚邵湛汪祁毛禹狄米贝明臧计伏成戴谈宋茅庞熊纪舒屈项祝董梁杜阮蓝闵席季麻强贾路娄危江童颜郭梅盛林刁钟徐邱骆高夏蔡田樊胡凌霍虞万支柯昝管卢莫经房裘缪干解应宗丁宣贲邓郁单杭洪包诸左石崔吉钮龚程嵇邢滑裴陆荣翁荀羊於惠甄曲家封芮羿储靳汲邴糜松井段富巫乌焦巴弓牧隗山谷车侯宓蓬全郗班仰秋仲伊宫宁仇栾暴甘钭厉戎祖武符刘景詹束龙叶幸司韶郜黎蓟薄印宿白怀蒲邰从鄂索咸籍赖卓蔺屠蒙池乔阴鬱胥能苍双闻莘党翟谭贡劳逄姬申扶堵冉宰郦雍却璩桑桂濮牛寿通边扈燕冀郏浦尚农温别庄晏柴瞿阎充慕连茹习宦艾鱼容向古易慎戈廖庾终暨居衡步都耿满弘匡国文寇广禄阙东欧殳沃利蔚越夔隆师巩厍聂晁勾敖融冷訾辛阚那简饶空曾毋沙乜养鞠须丰巢关蒯相查后荆红游竺权逯盖益桓公';
      if (surnameChars.includes(word[0])) {
        return 'person';
      }
    }
  }

  if (word.length >= 2 && word.length <= 4) {
    return 'theme';
  }

  return 'theme';
}

function tokenizeNote(content) {
  const rawWords = extractChineseWords(content);
  const wordCount = new Map();

  rawWords.forEach((w) => {
    const normalized = getSynonymKey(w);
    wordCount.set(normalized, (wordCount.get(normalized) || 0) + 1);
  });

  return Array.from(wordCount.entries())
    .filter(([word, count]) => count >= 1 && word.length >= 2)
    .map(([word, count]) => ({ word, count, category: categorizeWord(word) }))
    .filter(({ word }) => !STOP_WORDS.has(word.toLowerCase()));
}

function detectClusters(nodes, edges) {
  const clusters = [];
  const visited = new Set();
  const nodeMap = new Map(nodes.map((n) => [n.id || n._id.toString(), n]));
  const adjacency = new Map();

  nodes.forEach((n) => {
    const nid = n.id || n._id.toString();
    adjacency.set(nid, []);
  });

  edges.forEach((e) => {
    if (!adjacency.has(e.source)) adjacency.set(e.source, []);
    if (!adjacency.has(e.target)) adjacency.set(e.target, []);
    adjacency.get(e.source).push(e.target);
    adjacency.get(e.target).push(e.source);
  });

  let clusterIndex = 0;
  const clusterColors = ['#8B4513', '#2980B9', '#8E44AD', '#16A085', '#D35400', '#C0392B', '#E67E22', '#27AE60'];

  nodes.forEach((n) => {
    const nid = n.id || n._id.toString();
    if (visited.has(nid)) return;

    const queue = [nid];
    const component = [];
    visited.add(nid);

    while (queue.length > 0) {
      const current = queue.shift();
      component.push(current);
      const neighbors = adjacency.get(current) || [];
      neighbors.forEach((nb) => {
        if (!visited.has(nb)) {
          visited.add(nb);
          queue.push(nb);
        }
      });
    }

    if (component.length >= 3) {
      const clusterNodes = component.map((id) => nodeMap.get(id)).filter(Boolean);
      const topNode = clusterNodes.sort((a, b) => b.frequency - a.frequency)[0];
      clusters.push({
        id: `cluster-${clusterIndex}`,
        label: topNode ? topNode.name : `话题${clusterIndex + 1}`,
        nodeIds: component,
        color: clusterColors[clusterIndex % clusterColors.length],
      });
      clusterIndex++;
    }
  });

  return clusters;
}

function getQuarter(date) {
  const d = dayjs(date);
  return `${d.year()}年Q${Math.ceil(d.month() / 3) + 1}`;
}

function generateTimeline(nodes, edges) {
  const snapshots = [];
  const quarterMap = new Map();

  nodes.forEach((n) => {
    const q = getQuarter(n.firstSeenAt);
    if (!quarterMap.has(q)) {
      quarterMap.set(q, { date: n.firstSeenAt, newNodes: [], newEdges: [], topTerms: [] });
    }
    const snapshot = quarterMap.get(q);
    snapshot.newNodes.push(n.id || n._id.toString());
    snapshot.topTerms.push(n.name);
    if (n.firstSeenAt < snapshot.date) {
      snapshot.date = n.firstSeenAt;
    }
  });

  edges.forEach((e) => {
    const eDate = e.createdAt || new Date();
    const q = getQuarter(eDate);
    if (!quarterMap.has(q)) {
      quarterMap.set(q, { date: eDate, newNodes: [], newEdges: [], topTerms: [] });
    }
    quarterMap.get(q).newEdges.push(e.id || e._id.toString());
  });

  const sortedQuarters = Array.from(quarterMap.entries()).sort((a, b) =>
    dayjs(a[1].date).valueOf() - dayjs(b[1].date).valueOf()
  );

  sortedQuarters.forEach(([quarter, data], idx) => {
    const uniqueTerms = [...new Set(data.topTerms)].slice(0, 5);
    const summary = idx === 0
      ? `知识谱初启，新增 ${data.newNodes.length} 个关键词`
      : `本季度新增 ${data.newNodes.length} 个词、${data.newEdges.length} 条关联；代表词：${uniqueTerms.join('、')}`;

    snapshots.push({
      id: `snap-${idx}`,
      date: data.date,
      quarter,
      newNodes: data.newNodes,
      newEdges: data.newEdges,
      summary,
      topTerms: uniqueTerms,
    });
  });

  return snapshots;
}

async function generateKnowledgeGraph(userId) {
  const notes = await Note.find({ userId }).sort({ createdAt: 1 }).populate('workId');
  const works = await Work.find({ userId });

  const nodeMap = new Map();
  const edgeMap = new Map();

  for (const note of notes) {
    const workId = note.workId ? (note.workId._id || note.workId).toString() : null;
    const tokens = tokenizeNote(note.content || '');

    const noteKeywords = new Set();

    for (const token of tokens) {
      const key = `${token.category}:${token.word}`;
      noteKeywords.add(key);

      if (!nodeMap.has(key)) {
        nodeMap.set(key, {
          name: token.word,
          category: token.category,
          frequency: 0,
          synonyms: SYNONYMS_MAP[token.word] || [],
          isHidden: false,
          annotations: [],
          firstSeenAt: note.createdAt,
          lastSeenAt: note.createdAt,
          noteIds: new Set(),
          workIds: new Set(),
        });
      }

      const node = nodeMap.get(key);
      node.frequency += token.count;
      node.noteIds.add(note._id.toString());
      if (workId) node.workIds.add(workId);
      if (note.createdAt < node.firstSeenAt) node.firstSeenAt = note.createdAt;
      if (note.createdAt > node.lastSeenAt) node.lastSeenAt = note.createdAt;
    }

    const keywordArray = Array.from(noteKeywords);
    for (let i = 0; i < keywordArray.length; i++) {
      for (let j = i + 1; j < keywordArray.length; j++) {
        const a = keywordArray[i];
        const b = keywordArray[j];
        const edgeKey = [a, b].sort().join('|');
        if (!edgeMap.has(edgeKey)) {
          edgeMap.set(edgeKey, {
            source: a,
            target: b,
            weight: 0,
            type: 'cooccurrence',
            noteIds: new Set(),
            createdAt: note.createdAt,
          });
        }
        const edge = edgeMap.get(edgeKey);
        edge.weight += 1;
        edge.noteIds.add(note._id.toString());
      }
    }
  }

  const minFrequency = notes.length > 20 ? 2 : 1;
  let nodes = Array.from(nodeMap.values())
    .filter((n) => n.frequency >= minFrequency)
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 80)
    .map((n) => ({
      ...n,
      noteIds: Array.from(n.noteIds),
      workIds: Array.from(n.workIds),
    }));

  const validNodeKeys = new Set(
    nodes.map((n) => `${n.category}:${n.name}`)
  );

  let edges = Array.from(edgeMap.values())
    .filter((e) => validNodeKeys.has(e.source) && validNodeKeys.has(e.target) && e.weight >= 1)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 150)
    .map((e) => ({
      ...e,
      noteIds: Array.from(e.noteIds),
    }));

  const idMapping = new Map();
  nodes = nodes.map((n, idx) => {
    const id = `node-${idx}`;
    idMapping.set(`${n.category}:${n.name}`, id);
    return { id, ...n };
  });

  edges = edges.map((e, idx) => ({
    id: `edge-${idx}`,
    ...e,
    source: idMapping.get(e.source),
    target: idMapping.get(e.target),
  })).filter((e) => e.source && e.target);

  const clusters = detectClusters(nodes, edges);
  const timeline = generateTimeline(nodes, edges);

  nodes = nodes.map((n) => {
    const matched = clusters.find((c) => c.nodeIds.includes(n.id));
    return { ...n, cluster: matched ? matched.id : undefined };
  });

  return {
    nodes,
    edges,
    clusters,
    timeline,
    totalNotes: notes.length,
    totalWorks: works.length,
    generatedAt: new Date().toISOString(),
  };
}

async function getOrCreateGraph(userId) {
  let graph = await KnowledgeGraph.findOne({ userId });
  if (!graph) {
    graph = new KnowledgeGraph({ userId, nodes: [], edges: [], clusters: [], timeline: [] });
  }
  return graph;
}

async function refreshGraph(userId) {
  const data = await generateKnowledgeGraph(userId);
  const graph = await getOrCreateGraph(userId);

  const existingNodes = new Map(
    graph.nodes.map((n) => [n.name, n])
  );
  const existingEdges = new Map(
    graph.edges.filter((e) => e.type === 'manual').map((e) => [`${e.source}-${e.target}`, e])
  );

  data.nodes = data.nodes.map((n) => {
    const existing = existingNodes.get(n.name);
    if (existing) {
      return {
        ...n,
        _id: existing._id,
        isHidden: existing.isHidden,
        annotations: existing.annotations,
        synonyms: existing.synonyms.length > 0 ? existing.synonyms : n.synonyms,
      };
    }
    return n;
  });

  const manualEdges = Array.from(existingEdges.values());
  data.edges = [...data.edges, ...manualEdges];

  graph.nodes = data.nodes;
  graph.edges = data.edges;
  graph.clusters = data.clusters;
  graph.timeline = data.timeline;
  graph.totalNotes = data.totalNotes;
  graph.totalWorks = data.totalWorks;

  await graph.save();
  return graph;
}

function serializeGraph(graph) {
  return {
    nodes: graph.nodes.map((n) => ({
      id: n._id ? n._id.toString() : n.id,
      name: n.name,
      category: n.category,
      frequency: n.frequency,
      synonyms: n.synonyms || [],
      isHidden: n.isHidden || false,
      annotations: (n.annotations || []).map((a) => ({
        id: a._id ? a._id.toString() : a.id,
        content: a.content,
        createdAt: a.createdAt,
      })),
      firstSeenAt: n.firstSeenAt,
      lastSeenAt: n.lastSeenAt,
      noteIds: n.noteIds || [],
      workIds: n.workIds || [],
      cluster: n.cluster,
    })),
    edges: graph.edges.map((e) => ({
      id: e._id ? e._id.toString() : e.id,
      source: e.source,
      target: e.target,
      weight: e.weight,
      type: e.type,
      noteIds: e.noteIds || [],
      createdAt: e.createdAt,
    })),
    clusters: graph.clusters.map((c) => ({
      id: c._id ? c._id.toString() : c.id,
      label: c.label,
      nodeIds: c.nodeIds,
      color: c.color,
    })),
    timeline: graph.timeline.map((t) => ({
      id: t._id ? t._id.toString() : t.id,
      date: t.date,
      quarter: t.quarter,
      newNodes: t.newNodes,
      newEdges: t.newEdges,
      summary: t.summary,
      topTerms: t.topTerms,
    })),
    generatedAt: graph.updatedAt || new Date(),
    totalNotes: graph.totalNotes,
    totalWorks: graph.totalWorks,
  };
}

async function getNodeDetail(userId, nodeId) {
  const graph = await getOrCreateGraph(userId);
  const node = graph.nodes.find((n) => (n._id ? n._id.toString() : n.id) === nodeId);
  if (!node) return null;

  const connectedEdgeIds = new Set();
  graph.edges.forEach((e) => {
    if (e.source === nodeId || e.target === nodeId) {
      connectedEdgeIds.add(e.source === nodeId ? e.target : e.source);
    }
  });

  const connectedNodes = graph.nodes
    .filter((n) => connectedEdgeIds.has(n._id ? n._id.toString() : n.id))
    .map((n) => ({
      id: n._id ? n._id.toString() : n.id,
      name: n.name,
      category: n.category,
      frequency: n.frequency,
      synonyms: n.synonyms,
      isHidden: n.isHidden,
      firstSeenAt: n.firstSeenAt,
      lastSeenAt: n.lastSeenAt,
    }));

  const noteIds = node.noteIds || [];
  const workIds = node.workIds || [];

  const [notes, works] = await Promise.all([
    Note.find({ _id: { $in: noteIds } }).populate('workId').sort({ createdAt: -1 }),
    Work.find({ _id: { $in: workIds } }),
  ]);

  const workMap = new Map(works.map((w) => [w._id.toString(), w]));

  const relatedItems = [];

  works.forEach((w) => {
    relatedItems.push({
      type: 'work',
      id: w._id.toString(),
      title: w.title,
      workType: w.type,
      moodColor: w.moodColor,
      rating: w.rating,
      createdAt: w.createdAt,
    });
  });

  notes.forEach((n) => {
    const work = n.workId ? workMap.get((n.workId._id || n.workId).toString()) : null;
    relatedItems.push({
      type: 'note',
      id: n._id.toString(),
      content: n.content,
      moodColor: n.moodColor,
      createdAt: n.createdAt,
      workTitle: work ? work.title : undefined,
    });
  });

  relatedItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return {
    node: {
      id: node._id ? node._id.toString() : node.id,
      name: node.name,
      category: node.category,
      frequency: node.frequency,
      synonyms: node.synonyms,
      isHidden: node.isHidden,
      annotations: (node.annotations || []).map((a) => ({
        id: a._id ? a._id.toString() : a.id,
        content: a.content,
        createdAt: a.createdAt,
      })),
      firstSeenAt: node.firstSeenAt,
      lastSeenAt: node.lastSeenAt,
      noteIds: node.noteIds,
      workIds: node.workIds,
    },
    relatedItems,
    connectedNodes,
  };
}

module.exports = {
  generateKnowledgeGraph,
  getOrCreateGraph,
  refreshGraph,
  serializeGraph,
  getNodeDetail,
  getSynonymKey,
};
