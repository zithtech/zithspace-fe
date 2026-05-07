export const getStatusLabel = (status: string, options?: any[]) => {
  if (!status) return 'Not Started';
  const s = status.toLowerCase().replace(/ /g, '_');
  
  if (options && options.length > 0) {
    const opt = options.find(o => o.value?.toLowerCase().replace(/ /g, '_') === s);
    if (opt) return opt.label;
  }
  
  // Fallback map
  const labelMap: Record<string, string> = {
    'not_started': 'Not Started',
    'in_progress': 'In Progress',
    'dev_complete': 'Dev Complete',
    'dev_testing': 'Dev Testing',
    'in_review': 'In Review',
    'live': 'Live',
    'live_testing': 'Live Testing',
    'completed': 'Completed',
    'pause': 'Pause'
  };
  
  return labelMap[s] || status.replace(/_/g, ' ');
};

export const getStatusColor = (status: string) => {
  if (!status) return "default";
  const s = status.toLowerCase().replace(/ /g, '_');

  switch (s) {
    case "completed":
      return "success";
    case "in_progress":
      return "processing";
    case "dev_testing":
      return "warning";
    case "live_testing":
      return "geekblue";
    case "in_review":
      return "purple";
    case "dev_complete":
      return "cyan";
    case "live":
      return "blue";
    case "pause":
      return "orange";
    case "not_started":
      return "default";
    default:
      return "default";
  }
};

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "P1":
      return "red";
    case "P2":
      return "orange";
    case "P3":
      return "green";
    default:
      return "default";
  }
};

export const getTypeColor = (type: string) => {
  if (!type) return "default";

  // Normalize type string
  const normalizedType = type.toLowerCase();

  if (normalizedType.includes("bug")) return "red";
  if (normalizedType.includes("task")) return "blue";
  if (normalizedType.includes("feat")) return "green";
  if (normalizedType.includes("overwrite")) return "volcano"; // Changed from orange to distinguish from P2

  return "default";
};

export const getPlatformColor = (platform: string) => {
  if (!platform) return "default";

  const p = platform.toLowerCase();

  if (p.includes("ios") || p.includes("mac")) return "cyan";
  if (p.includes("android")) return "lime";
  if (p.includes("web") || p.includes("frontend") || p.includes("react")) return "geekblue";
  if (p.includes("backend") || p.includes("api") || p.includes("node") || p.includes("db")) return "purple";
  if (p.includes("design") || p.includes("ui") || p.includes("ux") || p.includes("figma")) return "magenta";
  if (p.includes("desktop") || p.includes("windows") || p.includes("linux")) return "blue";
  if (p.includes("qa") || p.includes("test")) return "gold";
  if (p.includes("devops") || p.includes("ci/cd") || p.includes("infra")) return "volcano";
  if (p.includes("data") || p.includes("analytics")) return "cyan";

  return "blue"; // Fallback to blue instead of default (grey) to ensure color
};

export const getStackColor = (stack: string) => {
  if (!stack) return "default";

  const s = stack.toLowerCase();

  if (s.includes("react") || s.includes("next")) return "cyan";
  if (s.includes("node") || s.includes("express") || s.includes("nest")) return "green";
  if (s.includes("python") || s.includes("django") || s.includes("fastapi")) return "blue";
  if (s.includes("java") || s.includes("spring")) return "geekblue";
  if (s.includes("c#") || s.includes(".net")) return "purple";
  if (s.includes("php") || s.includes("laravel")) return "indigo";
  if (s.includes("db") || s.includes("sql") || s.includes("mongo") || s.includes("postgres")) return "geekblue";
  if (s.includes("aws") || s.includes("azure") || s.includes("gcp")) return "orange";
  if (s.includes("docker") || s.includes("k8s")) return "blue";

  return "blue"; // Default colored
};

export const getTaskLevelColor = (level: string) => {
  if (!level) return "default";

  const l = level.toLowerCase();

  if (l.includes("complex") || l.includes("hard") || l.includes("level 3")) return "red";
  if (l.includes("medium") || l.includes("level 2")) return "orange";
  if (l.includes("simple") || l.includes("easy") || l.includes("level 1")) return "green";

  return "blue"; // Default colored for other levels
};

export const STATUS_OPTIONS = [
  { label: "Not Started", value: "not_started" },
  { label: "In Progress", value: "in_progress" },
  { label: "Dev Complete", value: "dev_complete" },
  { label: "Dev Testing", value: "dev_testing" },
  { label: "In Review", value: "in_review" },
  { label: "Live", value: "live" },
  { label: "Live Testing", value: "live_testing" },
  { label: "Completed", value: "completed" },
  { label: "Pause", value: "pause" },
];

export const PRIORITY_OPTIONS = [
  { label: "High (P1)", value: "P1" },
  { label: "Medium (P2)", value: "P2" },
  { label: "Lite (P3)", value: "P3" },
];

export const TYPE_OPTIONS = [
  { label: "Bug", value: "Bug" },
  { label: "Task", value: "Task" },
  { label: "Feature", value: "Feat" },
  { label: "Overwrite", value: "Overwrite" },
];
