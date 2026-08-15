import fs from 'node:fs/promises';
import { generateProposalDocx } from './src/lib/docx.js';

const sampleProposal = {
  title: 'Enterprise AI Automation Platform Proposal',
  client_name: 'Acme Global Innovations Inc.',
  created_at: '2026-08-15T16:00:00Z',
  sections: [
    {
      title: 'Executive Summary',
      content: 'This proposal outlines our solution to modernize Acme Global\'s workflow engine using MurryAI.\n\nKey highlights of our approach:\n- Custom workflow integration\n- Automated document intelligence\n- 24/7 high-availability SLA'
    },
    {
      title: 'Scope of Work',
      content: '# Phase 1: Ingestion Pipeline\nDeployment of high-performance ingestion engine.\n\n## Phase 2: Workflow Integration\nIntegration with existing enterprise systems.\n\n- Custom connectors\n- Real-time indexing\n- Secure storage and audit logs'
    }
  ],
  pricing: [
    { service: 'Platform Setup & Configuration', description: 'Initial workspace setup, DO provisioning, and workflow triggers', price: 15000 },
    { service: 'Custom Model Tuning & RAG Pipeline', description: 'Fine-tuning retrieval augmented generation over corporate data', price: 25000 },
    { service: 'Annual Enterprise Subscription', description: '24/7 support, managed SLA, and continuous platform updates', price: 48000 }
  ],
  total_value: 88000,
  terms: 'Payment schedule: 50% upon agreement signing, 50% upon completion. Proposal valid for 30 days.'
};

async function main() {
  console.log('Generating sample proposal DOCX...');
  const bytes = await generateProposalDocx(sampleProposal);
  await fs.writeFile('/tmp/test-proposal.docx', bytes);
  console.log(`Saved /tmp/test-proposal.docx (${bytes.length} bytes)`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
