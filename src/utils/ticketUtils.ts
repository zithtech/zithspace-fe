
export const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "success";
    case "in_progress":
      return "processing";
    case "in_testing":
      return "warning";
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
  switch (type) {
    case "Bug":
      return "red";
    case "Task":
      return "blue";
    case "Feat":
      return "green";
    case "Overwrite":
      return "orange";
    default:
      return "default";
  }
};

export const STATUS_OPTIONS = [
  { label: "Not Started", value: "not_started" },
  { label: "In Progress", value: "in_progress" },
  { label: "In Testing", value: "in_testing" },
  { label: "Completed", value: "completed" },
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
