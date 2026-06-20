'use client';

import { Devis } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { FiPrinter, FiDownload } from 'react-icons/fi';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useRef } from 'react';

interface DevisPreviewProps {
  devis: Devis;
  showActions?: boolean;
}

// Fixed 12-month list used to build the passages table. Order matters —
// this is both the row order in the UI and the row order in the PDF/print
// output.
export const MONTHS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
] as const;

export type MonthlyPassage = {
  month: string;
  count: number;
};

export type ContractType = 'monthly' | 'oneoff';

// Builds a default 12-row array (one per month, count 0) — used as a
// fallback for old devis records that predate this field.
export function buildDefaultMonthlyPassages(): MonthlyPassage[] {
  return MONTHS.map((month) => ({ month, count: 0 }));
}

/**
 * Builds the full plain-CSS HTML document used for BOTH print and PDF
 * export. This is the single source of truth: every color in here is a
 * literal hex value, with no Tailwind classes, no CSS variables, and no
 * connection whatsoever to the parent page's stylesheet.
 *
 * Why this exists: html2canvas's color parser only understands
 * rgb()/rgba()/hsl()/hex. This app's globals.css defines :root variables
 * (--background, --primary, etc.) using oklch(), which Tailwind v4/shadcn
 * use by default. Even when html2canvas is pointed at a cloned node with
 * inline styles forced via getComputedStyle, it STILL throws — because
 * internally it re-derives some colors (especially background-color)
 * by walking the page's actual stylesheet rules, not just inline styles,
 * and any class still present on an element (e.g. a leftover `bg-background`
 * className) maps back to the oklch() variable through that stylesheet.
 *
 * The only reliable fix is to remove the stylesheet from the equation
 * entirely: render into a document that has no Tailwind, no shadcn theme,
 * nothing but this hardcoded <style> block. That's exactly what
 * `handlePrint` was already doing via window.open() — a brand new
 * document with its own <head>, totally disconnected from the app's CSS.
 * We now reuse that same plain-HTML builder for the PDF path too, via
 * a hidden iframe instead of a popup window.
 */
function buildDevisHtmlDocument(params: {
  devisNumber: string;
  innerHtml: string;
}) {
  const { devisNumber, innerHtml } = params;

  return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${devisNumber} - Devis</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            @page {
              size: A4;
              margin: 0;
            }

            html, body {
              width: 210mm;
              margin: 0 auto;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background: #ffffff;
              color: #0f172a;
            }

            .devis-root {
              width: 210mm;
              min-height: 297mm;
              height: 297mm;
              background: #ffffff;
              font-size: 14px;
              line-height: 1.35;
              display: flex;
              flex-direction: column;
              overflow: hidden;
            }

            .header-section {
              padding: 8mm 15mm;
              border-bottom: 3px solid #1e40af;
              background-color: #f8fafc;
              flex-shrink: 0;
            }

            .company-block {
              margin-bottom: 10px;
            }

            .company-name {
              font-size: 26px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 4px;
            }

            .company-meta {
              font-size: 12.5px;
              color: #64748b;
              line-height: 1.45;
            }

            .header-row {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }

            .doc-title {
              font-size: 21px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 6px;
            }

            .doc-meta {
              font-size: 12.5px;
              color: #475569;
            }

            .doc-meta div {
              margin-bottom: 3px;
            }

            .client-block {
              text-align: right;
              font-size: 12.5px;
            }

            .client-label {
              font-weight: bold;
              margin-bottom: 4px;
              color: #1e40af;
            }

            .client-detail {
              margin-bottom: 2px;
              color: #64748b;
            }

            .content-section {
              padding: 5mm 15mm 4mm;
              flex: 1;
              overflow: hidden;
              display: flex;
              flex-direction: column;
            }

            .intro-block {
              margin-bottom: 8px;
              background-color: #f1f5f9;
              padding: 6px 10px;
              border-left: 4px solid #1e40af;
            }

            .intro-text {
              white-space: pre-wrap;
              font-size: 12.5px;
              line-height: 1.4;
            }

            .work-items-section {
              margin-bottom: 8px;
              flex: 1;
              overflow: hidden;
            }

            .section-title {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 6px;
              color: #1e40af;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 4px;
            }

            .work-item {
              margin-bottom: 6px;
              padding-bottom: 6px;
            }

            .work-item-border {
              border-bottom: 1px solid #e2e8f0;
            }

            .work-item-title {
              font-weight: bold;
              margin-bottom: 2px;
              font-size: 12.5px;
              color: #0f172a;
            }

            .work-item-desc {
              white-space: pre-wrap;
              font-size: 12px;
              line-height: 1.35;
              color: #475569;
            }

            .premises-block {
              margin-bottom: 8px;
              background-color: #f8fafc;
              padding: 6px 10px;
              border-radius: 4px;
            }

            .premises-label {
              font-weight: bold;
              margin-bottom: 3px;
              font-size: 12.5px;
              color: #0f172a;
            }

            .premises-text {
              font-size: 12px;
              color: #475569;
            }

            .passages-wrap {
              page-break-inside: avoid;
              break-inside: avoid;
              margin-top: 8px;
              flex-shrink: 0;
            }

            .passages-title {
              font-size: 12.5px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 4px;
            }

            .passages-table {
              width: 100%;
              border-collapse: collapse;
            }

            .passages-table td, .passages-table th {
              padding: 4px 6px;
              font-size: 11px;
            }

            .passages-table th {
              text-align: center;
              background-color: #e2e8f0;
              color: #1e40af;
              font-weight: bold;
              border-bottom: 1px solid #cbd5e1;
              border-right: 1px solid #cbd5e1;
            }

            .passages-table th:last-child {
              border-right: none;
            }

            .passages-table td {
              border-bottom: 1px solid #e2e8f0;
              border-right: 1px solid #e2e8f0;
              color: #475569;
              text-align: center;
            }

            .passages-table td:last-child {
              border-right: none;
            }

            .passages-table .month-row td.month-cell {
              font-weight: 600;
              color: #0f172a;
              background-color: #f8fafc;
            }

            .passages-summary {
              margin-top: 5px;
              text-align: right;
              font-size: 12px;
              color: #1e40af;
              font-weight: bold;
            }

            .pricing-wrap {
              page-break-inside: avoid;
              break-inside: avoid;
              margin-top: 8px;
              flex-shrink: 0;
            }

            .pricing-table {
              width: 100%;
              border-collapse: collapse;
            }

            .pricing-table td {
              padding: 6px 10px;
            }

            .row-ht { background-color: #f1f5f9; }
            .row-ht td {
              border-bottom: 2px solid #1e40af;
              font-weight: bold;
              font-size: 12.5px;
            }

            .row-tva { background-color: #f8fafc; }
            .row-tva td {
              border-bottom: 1px solid #e2e8f0;
              font-size: 12.5px;
            }
            .row-tva td:last-child {
              font-weight: bold;
            }

            .row-ttc { background-color: #dbeafe; }
            .row-ttc td {
              padding: 8px 10px;
              border-bottom: 2px solid #1e40af;
              font-weight: bold;
              font-size: 13.5px;
              color: #1e40af;
            }
            .row-ttc td:last-child {
              font-size: 16px;
            }

            .text-right { text-align: right; }
            .col-label  { width: 60%; }
            .col-value  { width: 40%; }

            .footer-section {
              padding: 6mm 15mm;
              border-top: 3px solid #1e40af;
              background-color: #f8fafc;
              flex-shrink: 0;
              page-break-inside: avoid;
              break-inside: avoid;
            }

            .signature-block {
              margin-bottom: 7px;
              text-align: center;
            }

            .signature-name {
              font-size: 13.5px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 3px;
            }

            .signature-date {
              font-size: 12px;
              color: #64748b;
            }

            .footer-note {
              font-size: 11px;
              color: #64748b;
              text-align: center;
              font-style: italic;
              border-top: 1px solid #e2e8f0;
              padding-top: 6px;
            }

            .footer-note div + div {
              margin-top: 3px;
            }
          </style>
        </head>
        <body>
          <div class="devis-root">
            ${innerHtml}
          </div>
        </body>
      </html>
    `;
}

export function DevisPreview({ devis, showActions = false }: DevisPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const getClientById = useAppStore((state) => state.getClientById);
  const settings = useAppStore((state) => state.settings);

  const client = getClientById(devis.clientId);

  // Tax mode defaults to 'ht' (no TVA line) but the toggle in the editor
  // still lets the user switch back to 'ttc'. All ?? fallbacks below exist
  // only for devis records saved before this field existed.
  const taxMode = (devis as any).taxMode ?? 'ht';

  // Contract type: 'monthly' uses the 12-month table below, 'oneoff' uses
  // a single flat passage count with no month breakdown.
  const contractType: ContractType = (devis as any).contractType ?? 'monthly';
  const isOneOff = contractType === 'oneoff';

  // Monthly passages table: 12 fixed rows (Jan→Dec), one shared unit price.
  // Falls back to a zeroed 12-row array for old devis records that don't
  // have this field yet. Only relevant when contractType === 'monthly'.
  const monthlyPassages: MonthlyPassage[] =
    (devis as any).monthlyPassages ?? buildDefaultMonthlyPassages();
  const passageUnitPrice: string = (devis as any).passageUnitPrice ?? '';

  const unitPriceNum = parseFloat(passageUnitPrice) || 0;

  const handlePrint = () => {
    if (!previewRef.current) return;

    const printContent = previewRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    printWindow.document.write(
      buildDevisHtmlDocument({ devisNumber: devis.number, innerHtml: printContent })
    );

    printWindow.document.close();
    printWindow.focus();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 300);
    };
  };

  const handleExportPDF = async () => {
    if (!previewRef.current) return;

    /**
     * Render into a fully isolated, off-screen iframe instead of an
     * in-page clone. An iframe gets its OWN document — its own <head>,
     * its own stylesheet context — completely disconnected from this
     * page's Tailwind/shadcn CSS and the oklch() :root variables that
     * were causing html2canvas to throw. We write the exact same plain
     * HTML string used for print into the iframe's document, then run
     * html2canvas against the iframe's <body>, which only ever sees
     * literal hex colors.
     */
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '-9999px';
    iframe.style.width = '210mm';
    iframe.style.height = '297mm';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    try {
      const iframeDoc = iframe.contentDocument;
      if (!iframeDoc) throw new Error('Could not access iframe document');

      const innerHtml = previewRef.current.innerHTML;
      iframeDoc.open();
      iframeDoc.write(
        buildDevisHtmlDocument({ devisNumber: devis.number, innerHtml })
      );
      iframeDoc.close();

      // Wait one frame for the iframe to fully parse + layout before
      // capturing — without this, html2canvas can run against an
      // incomplete/empty document.
      await new Promise<void>((resolve) => {
        if (iframe.contentWindow) {
          iframe.contentWindow.requestAnimationFrame(() => {
            setTimeout(resolve, 50);
          });
        } else {
          setTimeout(resolve, 100);
        }
      });

      const targetBody = iframeDoc.body;
      const canvas = await html2canvas(targetBody, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        // The iframe's own window — ensures html2canvas resolves layout
        // and computed styles against the iframe's context, not the
        // parent page's.
        // @ts-ignore — html2canvas supports a windowWidth/Height option
        // but not an explicit window override in its public types; the
        // node we pass (targetBody) already belongs to the iframe's own
        // document, which is what actually matters here.
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      const imgData = canvas.toDataURL('image/png');

      while (heightLeft >= 0) {
        const heightToPrint = Math.min(heightLeft, pageHeight);
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, heightToPrint);
        heightLeft -= pageHeight;
        position -= pageHeight;
        if (heightLeft > 0) {
          pdf.addPage();
        }
      }

      pdf.save(`${devis.number}-${client?.companyName || 'devis'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erreur lors de la génération du PDF');
    } finally {
      document.body.removeChild(iframe);
    }
  };

  const amountNum = parseFloat(devis.amount) || 0;
  const taxesNum = parseFloat(devis.taxes) || 0;
  const ttcNum   = parseFloat(devis.ttc)   || 0;

  return (
    <div>
      {showActions && (
        <div className="flex gap-2 mb-4 print:hidden">
          <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90">
            <FiPrinter className="mr-2 w-4 h-4" />
            Imprimer
          </Button>
          <Button onClick={handleExportPDF} variant="outline">
            <FiDownload className="mr-2 w-4 h-4" />
            Télécharger PDF
          </Button>
        </div>
      )}

      {/* ── Printable document root (this is what's screen-rendered AND
           what gets read via .innerHTML for both print and PDF) ── */}
      <div
        ref={previewRef}
        style={{
          width: '210mm',
          minHeight: '297mm',
          background: 'white',
          color: '#0f172a',
          fontSize: '14px',
          lineHeight: '1.35',
          margin: '0 auto',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ── Header ── */}
        <div
          className="header-section"
          style={{
            padding: '8mm 15mm',
            borderBottom: '3px solid #1e40af',
            backgroundColor: '#f8fafc',
            flexShrink: 0,
          }}
        >
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#1e40af', marginBottom: '4px' }}>
              {settings.companyName}
            </div>
            <div style={{ fontSize: '12.5px', color: '#64748b', lineHeight: '1.45' }}>
              <div>{settings.companyAddress}</div>
              <div>Tél: {settings.phone} | Email: {settings.email}</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '21px', fontWeight: 'bold', color: '#1e40af', marginBottom: '6px' }}>
                DEVIS
              </div>
              <div style={{ fontSize: '12.5px', color: '#475569' }}>
                <div style={{ marginBottom: '3px' }}><strong>N°:</strong> {devis.number}</div>
                <div style={{ marginBottom: '3px' }}>
                  <strong>Date:</strong> {new Date(devis.date).toLocaleDateString('fr-FR')}
                </div>
                {devis.subject && <div><strong>Objet:</strong> {devis.subject}</div>}
              </div>
            </div>

            {client && (
              <div style={{ textAlign: 'right', fontSize: '12.5px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#1e40af' }}>CLIENT</div>
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{client.companyName}</div>
                <div style={{ marginBottom: '2px' }}>{client.contactPerson}</div>
                {client.title && <div style={{ marginBottom: '2px', color: '#64748b' }}>{client.title}</div>}
                <div style={{ marginBottom: '2px', color: '#64748b' }}>{client.email}</div>
                <div style={{ marginBottom: '2px', color: '#64748b' }}>{client.phone}</div>
                <div style={{ color: '#64748b' }}>{client.address}</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Content (flex: 1 → fills space between header and footer) ── */}
        <div
          className="content-section"
          style={{
            padding: '5mm 15mm 4mm',
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Introduction */}
          {devis.introduction && (
            <div
              style={{
                marginBottom: '8px',
                backgroundColor: '#f1f5f9',
                padding: '6px 10px',
                borderLeft: '4px solid #1e40af',
                flexShrink: 0,
              }}
            >
              <div style={{ whiteSpace: 'pre-wrap', fontSize: '12.5px', lineHeight: '1.4' }}>
                {devis.introduction}
              </div>
            </div>
          )}

          {/* Work Items */}
          <div style={{ marginBottom: '8px', flex: 1, overflow: 'hidden' }}>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '6px',
                color: '#1e40af',
                borderBottom: '2px solid #e2e8f0',
                paddingBottom: '4px',
              }}
            >
              Description des travaux
            </div>
            <div>
              {devis.workItems.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    marginBottom: '6px',
                    paddingBottom: '6px',
                    borderBottom: idx < devis.workItems.length - 1 ? '1px solid #e2e8f0' : 'none',
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '2px', fontSize: '12.5px', color: '#0f172a' }}>
                    {item.title}
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: '12px', lineHeight: '1.35', color: '#475569' }}>
                    {item.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Premises */}
          {devis.premises && (
            <div
              style={{
                marginBottom: '8px',
                backgroundColor: '#f8fafc',
                padding: '6px 10px',
                borderRadius: '4px',
                flexShrink: 0,
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '3px', fontSize: '12.5px', color: '#0f172a' }}>
                Locaux à traiter:
              </div>
              <div style={{ fontSize: '12px', color: '#475569' }}>{devis.premises}</div>
            </div>
          )}

          {/* Passages: 12-month table for recurring contracts, simple
              one-line summary for a one-off job */}
          {isOneOff ? (
            <div
              className="passages-wrap"
              style={{
                marginTop: '8px',
                flexShrink: 0,
                pageBreakInside: 'avoid',
                breakInside: 'avoid',
                backgroundColor: '#f8fafc',
                padding: '6px 10px',
                borderRadius: '4px',
              }}
            >
              <div style={{ fontSize: '12.5px', color: '#0f172a' }}>
                <strong>Prix:</strong> {unitPriceNum.toFixed(2)} {settings.currency} / passage
              </div>
            </div>
          ) : (
            <div
              className="passages-wrap"
              style={{
                marginTop: '8px',
                flexShrink: 0,
                pageBreakInside: 'avoid',
                breakInside: 'avoid',
              }}
            >
              <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#1e40af', marginBottom: '4px' }}>
                Calendrier des passages
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {monthlyPassages.map((m) => (
                      <th
                        key={`h-${m.month}`}
                        style={{
                          textAlign: 'center',
                          padding: '4px 6px',
                          fontSize: '11px',
                          backgroundColor: '#e2e8f0',
                          color: '#1e40af',
                          fontWeight: 'bold',
                          borderBottom: '1px solid #cbd5e1',
                          borderRight: '1px solid #cbd5e1',
                        }}
                      >
                        {m.month.slice(0, 3)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {monthlyPassages.map((m) => (
                      <td
                        key={`v-${m.month}`}
                        style={{
                          textAlign: 'center',
                          padding: '4px 6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#0f172a',
                          borderBottom: '1px solid #e2e8f0',
                          borderRight: '1px solid #e2e8f0',
                        }}
                      >
                        {m.count}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: '5px', textAlign: 'right', fontSize: '12px', color: '#1e40af', fontWeight: 'bold' }}>
                Prix: {unitPriceNum.toFixed(2)} {settings.currency} / passage
              </div>
            </div>
          )}

          {/* Pricing Table */}
          <div
            className="pricing-wrap"
            style={{
              marginTop: '8px',
              flexShrink: 0,
              pageBreakInside: 'avoid',
              breakInside: 'avoid',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ backgroundColor: taxMode === 'ttc' ? '#f1f5f9' : '#dbeafe' }}>
                  <td
                    style={{
                      padding: taxMode === 'ttc' ? '6px 10px' : '8px 10px',
                      textAlign: 'right',
                      borderBottom: '2px solid #1e40af',
                      fontWeight: 'bold',
                      fontSize: taxMode === 'ttc' ? '12.5px' : '13.5px',
                      color: taxMode === 'ttc' ? undefined : '#1e40af',
                      width: '60%',
                    }}
                  >
                    {taxMode === 'ttc' ? 'Montant H.T:' : 'MONTANT TOTAL H.T:'}
                  </td>
                  <td
                    style={{
                      padding: taxMode === 'ttc' ? '6px 10px' : '8px 10px',
                      textAlign: 'right',
                      borderBottom: '2px solid #1e40af',
                      fontWeight: 'bold',
                      fontSize: taxMode === 'ttc' ? '13.5px' : '16px',
                      color: taxMode === 'ttc' ? undefined : '#1e40af',
                      width: '40%',
                    }}
                  >
                    {amountNum.toFixed(2)} {settings.currency}
                  </td>
                </tr>

                {taxMode === 'ttc' && (
                  <>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <td style={{ padding: '6px 10px', textAlign: 'right', borderBottom: '1px solid #e2e8f0', fontSize: '12.5px' }}>
                        TVA (19%):
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', fontSize: '13.5px' }}>
                        {taxesNum.toFixed(2)} {settings.currency}
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: '#dbeafe' }}>
                      <td style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '2px solid #1e40af', fontWeight: 'bold', fontSize: '13.5px', color: '#1e40af' }}>
                        MONTANT TOTAL TTC:
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '2px solid #1e40af', fontWeight: 'bold', fontSize: '16px', color: '#1e40af' }}>
                        {ttcNum.toFixed(2)} {settings.currency}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className="footer-section"
          style={{
            padding: '6mm 15mm',
            borderTop: '3px solid #1e40af',
            backgroundColor: '#f8fafc',
            flexShrink: 0,
            pageBreakInside: 'avoid',
            breakInside: 'avoid',
          }}
        >
          <div style={{ marginBottom: '7px', textAlign: 'center' }}>
            <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#1e40af', marginBottom: '3px' }}>
              {devis.signatureName}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Signé le {new Date(devis.emailDate).toLocaleDateString('fr-FR')}
            </div>
          </div>

          <div
            style={{
              fontSize: '11px',
              color: '#64748b',
              textAlign: 'center',
              fontStyle: 'italic',
              borderTop: '1px solid #e2e8f0',
              paddingTop: '6px',
            }}
          >
            <div>-Société S.A.R.L Agrée par le Ministère de la santé Publique-</div>
            <div>Devis valable 30 jours à compter de sa date de signature</div>
            <div style={{ marginTop: '3px' }}>Merci de votre confiance</div>
          </div>
        </div>
      </div>
    </div>
  );
}