
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
