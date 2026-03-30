import fs from 'fs';
import path from 'path';

/**
 * Load a prompt template from /prompts/*.txt and inject variables.
 * Variables use {{VARIABLE_NAME}} syntax.
 */
export function loadPrompt(name: string, variables: Record<string, string> = {}): string {
  const templatePath = path.join(process.cwd(), 'prompts', `${name}.txt`);
  let template = fs.readFileSync(templatePath, 'utf-8');

  for (const [key, value] of Object.entries(variables)) {
    template = template.replaceAll(`{{${key}}}`, value);
  }

  // Strip any remaining unreplaced variables (optional fields)
  template = template.replace(/\{\{[A-Z_]+\}\}/g, '');

  return template.trim();
}
