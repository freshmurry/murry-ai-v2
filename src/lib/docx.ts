/**
 * Cloudflare Worker compatible .docx generator (Office Open XML format).
 * Runs purely on standard Web APIs (Uint8Array, TextEncoder) and custom pure-TS ZIP Writer.
 */

import { ZipWriter } from './zip';

export interface ProposalSectionData {
  title: string;
  content: string;
}

export interface ProposalPricingItem {
  service: string;
  description?: string;
  price: number | string;
}

export interface ProposalDocData {
  title: string;
  client_name: string;
  created_at?: string;
  sections: ProposalSectionData[];
  pricing?: ProposalPricingItem[];
  total_value?: number | string;
  terms?: string;
}

/**
 * Escapes special XML characters to ensure valid XML.
 */
function escapeXml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Formats monetary or numerical price values.
 */
function formatPrice(val: number | string): string {
  if (typeof val === 'number') {
    return '$' + val.toLocaleString('en-US');
  }
  return String(val);
}

/**
 * Parses markdown-ish string (lines starting with #, ##, -, or plain lines)
 * and turns them into Word processing paragraph XML elements.
 */
function renderMarkdownContent(content: string): string {
  if (!content) return '';
  const lines = content.split(/\r?\n/);
  let xml = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      xml += '<w:p/>';
      continue;
    }

    if (trimmed.startsWith('# ')) {
      const text = escapeXml(trimmed.substring(2).trim());
      xml += `<w:p><w:pPr><w:pStyle w:val="Heading1"/><w:spacing w:before="240" w:after="120"/><w:rPr><w:b/><w:sz w:val="32"/><w:szCs w:val="32"/><w:color w:val="1F4E78"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/><w:szCs w:val="32"/><w:color w:val="1F4E78"/></w:rPr><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
    } else if (trimmed.startsWith('## ')) {
      const text = escapeXml(trimmed.substring(3).trim());
      xml += `<w:p><w:pPr><w:pStyle w:val="Heading2"/><w:spacing w:before="180" w:after="80"/><w:rPr><w:b/><w:sz w:val="26"/><w:szCs w:val="26"/><w:color w:val="2E75B6"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/><w:szCs w:val="26"/><w:color w:val="2E75B6"/></w:rPr><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
    } else if (trimmed.startsWith('### ')) {
      const text = escapeXml(trimmed.substring(4).trim());
      xml += `<w:p><w:pPr><w:pStyle w:val="Heading3"/><w:spacing w:before="140" w:after="60"/><w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="333333"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="333333"/></w:rPr><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const text = escapeXml(trimmed.substring(2).trim());
      xml += `<w:p><w:pPr><w:ind w:left="360"/><w:spacing w:after="60"/></w:pPr><w:r><w:t xml:space="preserve">•  ${text}</w:t></w:r></w:p>`;
    } else {
      const text = escapeXml(trimmed);
      xml += `<w:p><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr><w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
    }
  }

  return xml;
}

/**
 * Renders an OOXML pricing table (<w:tbl>) with header row, item rows, and total row.
 */
function renderPricingTable(items: ProposalPricingItem[], totalValue?: number | string): string {
  if (!items || items.length === 0) return '';

  let rowsXml = '';

  // Header Row
  rowsXml += `
    <w:tr>
      <w:trPr>
        <w:tblHeader/>
        <w:cantSplit/>
      </w:trPr>
      <w:tc>
        <w:tcPr>
          <w:tcW w:w="3000" w:type="dxa"/>
          <w:shd w:val="clear" w:color="auto" w:fill="1F4E78"/>
        </w:tcPr>
        <w:p><w:pPr><w:spacing w:before="100" w:after="100"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr><w:t>Service</w:t></w:r></w:p>
      </w:tc>
      <w:tc>
        <w:tcPr>
          <w:tcW w:w="4500" w:type="dxa"/>
          <w:shd w:val="clear" w:color="auto" w:fill="1F4E78"/>
        </w:tcPr>
        <w:p><w:pPr><w:spacing w:before="100" w:after="100"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr><w:t>Description</w:t></w:r></w:p>
      </w:tc>
      <w:tc>
        <w:tcPr>
          <w:tcW w:w="1800" w:type="dxa"/>
          <w:shd w:val="clear" w:color="auto" w:fill="1F4E78"/>
        </w:tcPr>
        <w:p><w:pPr><w:jc w:val="right"/><w:spacing w:before="100" w:after="100"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr><w:t>Price</w:t></w:r></w:p>
      </w:tc>
    </w:tr>`;

  let calculatedTotal = 0;
  let isNumericTotal = true;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const bgFill = i % 2 === 1 ? 'F8F9FA' : 'FFFFFF';
    const serviceText = escapeXml(item.service);
    const descText = escapeXml(item.description || '');
    const priceText = escapeXml(formatPrice(item.price));

    if (typeof item.price === 'number') {
      calculatedTotal += item.price;
    } else {
      isNumericTotal = false;
    }

    rowsXml += `
    <w:tr>
      <w:trPr>
        <w:cantSplit/>
      </w:trPr>
      <w:tc>
        <w:tcPr>
          <w:tcW w:w="3000" w:type="dxa"/>
          <w:shd w:val="clear" w:color="auto" w:fill="${bgFill}"/>
        </w:tcPr>
        <w:p><w:pPr><w:spacing w:before="80" w:after="80"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${serviceText}</w:t></w:r></w:p>
      </w:tc>
      <w:tc>
        <w:tcPr>
          <w:tcW w:w="4500" w:type="dxa"/>
          <w:shd w:val="clear" w:color="auto" w:fill="${bgFill}"/>
        </w:tcPr>
        <w:p><w:pPr><w:spacing w:before="80" w:after="80"/></w:pPr><w:r><w:t xml:space="preserve">${descText}</w:t></w:r></w:p>
      </w:tc>
      <w:tc>
        <w:tcPr>
          <w:tcW w:w="1800" w:type="dxa"/>
          <w:shd w:val="clear" w:color="auto" w:fill="${bgFill}"/>
        </w:tcPr>
        <w:p><w:pPr><w:jc w:val="right"/><w:spacing w:before="80" w:after="80"/></w:pPr><w:r><w:t xml:space="preserve">${priceText}</w:t></w:r></w:p>
      </w:tc>
    </w:tr>`;
  }

  // Total Row
  const displayTotal = totalValue !== undefined
    ? formatPrice(totalValue)
    : (isNumericTotal ? formatPrice(calculatedTotal) : '');

  if (displayTotal) {
    rowsXml += `
    <w:tr>
      <w:trPr>
        <w:cantSplit/>
      </w:trPr>
      <w:tc>
        <w:tcPr>
          <w:gridSpan w:val="2"/>
          <w:tcW w:w="7500" w:type="dxa"/>
          <w:shd w:val="clear" w:color="auto" w:fill="EBF1F5"/>
        </w:tcPr>
        <w:p><w:pPr><w:jc w:val="right"/><w:spacing w:before="100" w:after="100"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t>Total Investment</w:t></w:r></w:p>
      </w:tc>
      <w:tc>
        <w:tcPr>
          <w:tcW w:w="1800" w:type="dxa"/>
          <w:shd w:val="clear" w:color="auto" w:fill="EBF1F5"/>
        </w:tcPr>
        <w:p><w:pPr><w:jc w:val="right"/><w:spacing w:before="100" w:after="100"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="1F4E78"/></w:rPr><w:t xml:space="preserve">${escapeXml(displayTotal)}</w:t></w:r></w:p>
      </w:tc>
    </w:tr>`;
  }

  return `
    <w:p><w:pPr><w:pStyle w:val="Heading1"/><w:spacing w:before="360" w:after="120"/><w:rPr><w:b/><w:sz w:val="32"/><w:szCs w:val="32"/><w:color w:val="1F4E78"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/><w:szCs w:val="32"/><w:color w:val="1F4E78"/></w:rPr><w:t>Pricing &amp; Investment</w:t></w:r></w:p>
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="9300" w:type="dxa"/>
        <w:jc w:val="center"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="6" w:space="0" w:color="1F4E78"/>
          <w:bottom w:val="single" w:sz="6" w:space="0" w:color="1F4E78"/>
          <w:left w:val="none"/>
          <w:right w:val="none"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E0E0E0"/>
          <w:insideV w:val="none"/>
        </w:tblBorders>
        <w:tblCellMar>
          <w:top w:w="100" w:type="dxa"/>
          <w:left w:w="150" w:type="dxa"/>
          <w:bottom w:w="100" w:type="dxa"/>
          <w:right w:w="150" w:type="dxa"/>
        </w:tblCellMar>
      </w:tblPr>
      <w:tblGrid>
        <w:gridCol w:w="3000"/>
        <w:gridCol w:w="4500"/>
        <w:gridCol w:w="1800"/>
      </w:tblGrid>
      ${rowsXml}
    </w:tbl>
    <w:p/>`;
}

/**
 * Renders a two-column signature table block at the bottom of the proposal.
 */
function renderSignatureBlock(clientName: string): string {
  const escapedClient = escapeXml(clientName);
  return `
    <w:p><w:pPr><w:pStyle w:val="Heading1"/><w:spacing w:before="360" w:after="120"/><w:rPr><w:b/><w:sz w:val="32"/><w:szCs w:val="32"/><w:color w:val="1F4E78"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/><w:szCs w:val="32"/><w:color w:val="1F4E78"/></w:rPr><w:t>Acceptance &amp; Authorization</w:t></w:r></w:p>
    <w:p><w:pPr><w:spacing w:after="180"/></w:pPr><w:r><w:t>By signing below, the client agrees to the terms and scope of work outlined in this proposal.</w:t></w:r></w:p>
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="9300" w:type="dxa"/>
        <w:jc w:val="center"/>
        <w:tblBorders>
          <w:top w:val="none"/>
          <w:left w:val="none"/>
          <w:bottom w:val="none"/>
          <w:right w:val="none"/>
          <w:insideH w:val="none"/>
          <w:insideV w:val="none"/>
        </w:tblBorders>
        <w:tblCellMar>
          <w:top w:w="120" w:type="dxa"/>
          <w:left w:w="120" w:type="dxa"/>
          <w:bottom w:w="120" w:type="dxa"/>
          <w:right w:w="120" w:type="dxa"/>
        </w:tblCellMar>
      </w:tblPr>
      <w:tblGrid>
        <w:gridCol w:w="5000"/>
        <w:gridCol w:w="4300"/>
      </w:tblGrid>
      <w:tr>
        <w:tc>
          <w:tcPr><w:tcW w:w="5000" w:type="dxa"/></w:tcPr>
          <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Client Signature:</w:t></w:r></w:p>
          <w:p><w:pPr><w:spacing w:before="180" w:after="120"/></w:pPr><w:r><w:t>_____________________________________</w:t></w:r></w:p>
          <w:p><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${escapedClient}</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="4300" w:type="dxa"/></w:tcPr>
          <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Date:</w:t></w:r></w:p>
          <w:p><w:pPr><w:spacing w:before="180" w:after="120"/></w:pPr><w:r><w:t>____________________</w:t></w:r></w:p>
          <w:p/>
        </w:tc>
      </w:tr>
    </w:tbl>`;
}

/**
 * Generates a valid .docx (Office Open XML format) document binary as a Uint8Array.
 *
 * @param data Proposal details including title, client_name, sections, pricing, etc.
 * @returns Promise resolving to the Uint8Array representing the .docx ZIP file.
 */
export async function generateProposalDocx(data: ProposalDocData): Promise<Uint8Array> {
  const zip = new ZipWriter();

  // 1. [Content_Types].xml
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;
  zip.addFile('[Content_Types].xml', contentTypesXml);

  // 2. _rels/.rels
  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
  zip.addFile('_rels/.rels', relsXml);

  // 3. word/_rels/document.xml.rels
  const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;
  zip.addFile('word/_rels/document.xml.rels', docRelsXml);

  // 4. Build word/document.xml
  let bodyXml = '';

  // Document Title as Heading1
  bodyXml += `<w:p><w:pPr><w:pStyle w:val="Heading1"/><w:jc w:val="center"/><w:spacing w:before="240" w:after="120"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="48"/><w:szCs w:val="48"/><w:color w:val="1F4E78"/></w:rPr><w:t xml:space="preserve">${escapeXml(data.title)}</w:t></w:r></w:p>`;

  // Prepared for: {client} centered
  bodyXml += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="80"/></w:pPr><w:r><w:rPr><w:i/><w:sz w:val="24"/><w:szCs w:val="24"/><w:color w:val="595959"/></w:rPr><w:t xml:space="preserve">Prepared for: ${escapeXml(data.client_name)}</w:t></w:r></w:p>`;

  // Date if created_at present
  if (data.created_at) {
    const formattedDate = escapeXml(data.created_at.split('T')[0] || data.created_at);
    bodyXml += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="240"/></w:pPr><w:r><w:rPr><w:sz w:val="20"/><w:szCs w:val="20"/><w:color w:val="7F7F7F"/></w:rPr><w:t xml:space="preserve">Date: ${formattedDate}</w:t></w:r></w:p>`;
  } else {
    bodyXml += `<w:p><w:pPr><w:spacing w:after="240"/></w:pPr></w:p>`;
  }

  // Horizontal accent line
  bodyXml += `<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="12" w:space="1" w:color="1F4E78"/></w:pBdr><w:spacing w:after="240"/></w:pPr></w:p>`;

  // Render sections
  if (data.sections && data.sections.length > 0) {
    for (const section of data.sections) {
      if (section.title) {
        bodyXml += `<w:p><w:pPr><w:pStyle w:val="Heading1"/><w:spacing w:before="360" w:after="120"/><w:rPr><w:b/><w:sz w:val="32"/><w:szCs w:val="32"/><w:color w:val="1F4E78"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/><w:szCs w:val="32"/><w:color w:val="1F4E78"/></w:rPr><w:t xml:space="preserve">${escapeXml(section.title)}</w:t></w:r></w:p>`;
      }
      if (section.content) {
        bodyXml += renderMarkdownContent(section.content);
      }
    }
  }

  // Render pricing table if present
  if (data.pricing && data.pricing.length > 0) {
    bodyXml += renderPricingTable(data.pricing, data.total_value);
  }

  // Render terms if present
  if (data.terms) {
    bodyXml += `<w:p><w:pPr><w:pStyle w:val="Heading1"/><w:spacing w:before="360" w:after="120"/><w:rPr><w:b/><w:sz w:val="32"/><w:szCs w:val="32"/><w:color w:val="1F4E78"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/><w:szCs w:val="32"/><w:color w:val="1F4E78"/></w:rPr><w:t>Terms &amp; Conditions</w:t></w:r></w:p>`;
    bodyXml += renderMarkdownContent(data.terms);
  }

  // Signature Block at the end
  bodyXml += renderSignatureBlock(data.client_name);

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${bodyXml}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  zip.addFile('word/document.xml', documentXml);

  return zip.build();
}
