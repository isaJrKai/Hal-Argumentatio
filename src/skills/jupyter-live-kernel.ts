import { Skill } from './types';

export const jupyterLiveKernelSkill: Skill = {
  id: 'jupyter_live_kernel',
  name: 'Python Code Review (No Execution)',
  description: 'Reviews Python source and provides a static reasoning report. It does not execute code, maintain a live Jupyter kernel, import modules, or persist variables.',
  category: 'general',
  icon: 'Terminal',
  inputs: [
    { name: 'code', label: 'Python Code', type: 'string', required: true, defaultValue: '' },
    { name: 'notebookPath', label: 'Notebook Label (optional)', type: 'string', required: false, defaultValue: 'scratch.ipynb' }
  ],
  execute: async (inputs) => {
    const code = String(inputs.code || '');
    const notebookPath = String(inputs.notebookPath || 'scratch.ipynb');
    if (!code.trim()) throw new Error('Python code is required.');

    const report = [
      '### Python static review',
      '- **Notebook label:** ' + notebookPath,
      '- **Execution performed:** No',
      '- **Kernel state created or persisted:** No',
      '- **Runtime output:** Not available — HAL does not have a Python kernel connected to this skill.',
      '',
      '### Source supplied for review',
      '```python',
      code.slice(0, 12000),
      '```',
      '',
      '### Review limitations',
      '- Syntax, imports, file access, network access, runtime exceptions, and variable values have not been verified by execution.',
      '- Any expected output must be treated as a hypothesis until run in a real isolated Python environment.',
      '- Do not use this report as proof that the code is safe or correct.'
    ].join('\n');

    return {
      success: true,
      notebookPath,
      executionPerformed: false,
      kernelStatePersisted: false,
      evidenceStatus: 'static_source_review_only',
      codeLength: code.length,
      report,
      executedAt: new Date().toISOString()
    };
  }
};
