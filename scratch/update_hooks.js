const fs = require('fs');
const path = './src/hooks/useBugList.ts';
let content = fs.readFileSync(path, 'utf8');

// Replace import
content = content.replace('import { message } from "antd";', 'import { App } from "antd";');

// Function to inject App.useApp() into hooks that already have blocks
const regexBlock = /export const (use[A-Za-z0-9_]+) = \([^)]*\) =>\s*\{\s*const qc = useQueryClient\(\);\s*return useMutation\(\{/g;
content = content.replace(regexBlock, (match, hookName) => {
    return match.replace('const qc = useQueryClient();', 'const qc = useQueryClient();\n  const { message } = App.useApp();');
});

// For AI hooks which don't have qc but useMutation directly
content = content.replace(/export const useAiReviewBugs = \(\) =>\s*useMutation\(\{/g, 'export const useAiReviewBugs = () => {\n  const { message } = App.useApp();\n  return useMutation({');

content = content.replace(/export const useAiSuggestGroups = \(\) =>\s*useMutation\(\{/g, 'export const useAiSuggestGroups = () => {\n  const { message } = App.useApp();\n  return useMutation({');

// Fix closing braces for the two AI hooks
content = content.replace(/mutationFn: \(bugIds: string\[\]\) => BugListService\.aiReview\(bugIds\),\n    onError: \(err: Error\) => message\.error\(err\.message\),\n  \}\);/g, 'mutationFn: (bugIds: string[]) => BugListService.aiReview(bugIds),\n    onError: (err: Error) => message.error(err.message),\n  });\n};');

content = content.replace(/mutationFn: \(bugIds: string\[\]\) => BugListService\.aiSuggestGroups\(bugIds\),\n    onError: \(err: Error\) => message\.error\(err\.message\),\n  \}\);/g, 'mutationFn: (bugIds: string[]) => BugListService.aiSuggestGroups(bugIds),\n    onError: (err: Error) => message.error(err.message),\n  });\n};');


fs.writeFileSync(path, content, 'utf8');
