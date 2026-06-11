const fs = require('fs');
const path = './src/hooks/useBugList.ts';
let content = fs.readFileSync(path, 'utf8');

// Replace import
content = content.replace('import { message } from "antd";', 'import { App } from "antd";');

// Function to inject App.useApp()
const regex = /export const (use[A-Za-z0-9_]+) = \([^)]*\) =>\s*(?:\{\s*const qc = useQueryClient\(\);\s*)?(?:return\s*)?useMutation\(\{/g;

content = content.replace(regex, (match, hookName) => {
    // If it already has block, inject inside.
    if (match.includes('{')) {
        if (match.includes('const qc = useQueryClient();')) {
            return match.replace('const qc = useQueryClient();', 'const qc = useQueryClient();\n  const { message } = App.useApp();');
        } else {
            return match.replace('useMutation({', '{\n  const { message } = App.useApp();\n  return useMutation({');
        }
    } else {
        // Arrow function without block
        return match.replace('useMutation({', '{\n  const { message } = App.useApp();\n  return useMutation({');
    }
});

// Fix the ones that didn't have a block initially
content = content.replace(/export const useAiReviewBugs = \(\) =>\s*useMutation\(\{/g, 'export const useAiReviewBugs = () => {\n  const { message } = App.useApp();\n  return useMutation({');
content = content.replace(/export const useAiSuggestGroups = \(\) =>\s*useMutation\(\{/g, 'export const useAiSuggestGroups = () => {\n  const { message } = App.useApp();\n  return useMutation({');

// For any remaining implicit returns that we changed to blocks, we need to add the closing brace.
// Actually, regex replacement for block wrapping is tricky. Let's do it manually for the two AI hooks since they are the only ones without blocks.
fs.writeFileSync(path, content, 'utf8');
