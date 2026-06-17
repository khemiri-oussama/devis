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
              font-size: 12.5px;
              line-height: 1.4;
              display: flex;
              flex-direction: column;
              overflow: hidden;
            }

            .header-section {
              padding: 10mm 15mm;
              border-bottom: 3px solid #1e40af;
              background-color: #f8fafc;
              flex-shrink: 0;
            }

            .company-block {
              margin-bottom: 12px;
            }

            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 4px;
            }

            .company-meta {
              font-size: 11px;
              color: #64748b;
              line-height: 1.5;
            }

            .header-row {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }

            .doc-title {
              font-size: 19px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 7px;
            }

            .doc-meta {
              font-size: 11px;
              color: #475569;
            }

            .doc-meta div {
              margin-bottom: 3px;
            }

            .client-block {
              text-align: right;
              font-size: 11px;
            }

            .client-label {
              font-weight: bold;
              margin-bottom: 5px;
              color: #1e40af;
            }

            .client-detail {
              margin-bottom: 3px;
              color: #64748b;
            }

            .content-section {
              padding: 6mm 15mm 5mm;
              flex: 1;
              overflow: hidden;
              display: flex;
              flex-direction: column;
            }

            .intro-block {
              margin-bottom: 9px;
              background-color: #f1f5f9;
              padding: 7px 10px;
              border-left: 4px solid #1e40af;
            }

            .intro-text {
              white-space: pre-wrap;
              font-size: 11px;
              line-height: 1.5;
            }

            .work-items-section {
              margin-bottom: 9px;
              flex: 1;
              overflow: hidden;
            }

            .section-title {
              font-size: 12.5px;
              font-weight: bold;
              margin-bottom: 7px;
              color: #1e40af;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 4px;
            }

            .work-item {
              margin-bottom: 7px;
              padding-bottom: 7px;
            }

            .work-item-border {
              border-bottom: 1px solid #e2e8f0;
            }

            .work-item-title {
              font-weight: bold;
              margin-bottom: 3px;
              font-size: 11px;
              color: #0f172a;
            }

            .work-item-desc {
              white-space: pre-wrap;
              font-size: 10.5px;
              line-height: 1.4;
              color: #475569;
            }

            .premises-block {
              margin-bottom: 9px;
              background-color: #f8fafc;
              padding: 7px 10px;
              border-radius: 4px;
            }

            .premises-label {
              font-weight: bold;
              margin-bottom: 4px;
              font-size: 11px;
              color: #0f172a;
            }

            .premises-text {
              font-size: 10.5px;
              color: #475569;
            }

            .passages-wrap {
              page-break-inside: avoid;
              break-inside: avoid;
              margin-top: 9px;
              flex-shrink: 0;
            }

            .passages-title {
              font-size: 11px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 5px;
            }

            .passages-table {
              width: 100%;
              border-collapse: collapse;
            }

            .passages-table td, .passages-table th {
              padding: 5px 10px;
              font-size: 10.5px;
            }

            .passages-table th {
              text-align: left;
              background-color: #e2e8f0;
              color: #1e40af;
              font-weight: bold;
              border-bottom: 1px solid #cbd5e1;
            }

            .passages-table td {
              border-bottom: 1px solid #e2e8f0;
              color: #475569;
            }

            .passages-table td.num {
              text-align: right;
              font-weight: 600;
              color: #0f172a;
            }

            .pricing-wrap {
              page-break-inside: avoid;
              break-inside: avoid;
              margin-top: 9px;
              flex-shrink: 0;
            }

            .pricing-table {
              width: 100%;
              border-collapse: collapse;
            }

            .pricing-table td {
              padding: 7px 10px;
            }

            .row-ht { background-color: #f1f5f9; }
            .row-ht td {
              border-bottom: 2px solid #1e40af;
              font-weight: bold;
              font-size: 11px;
            }

            .row-tva { background-color: #f8fafc; }
            .row-tva td {
              border-bottom: 1px solid #e2e8f0;
              font-size: 11px;
            }
            .row-tva td:last-child {
              font-weight: bold;
            }

            .row-ttc { background-color: #dbeafe; }
            .row-ttc td {
              padding: 9px 10px;
              border-bottom: 2px solid #1e40af;
              font-weight: bold;
              font-size: 12px;
              color: #1e40af;
            }
            .row-ttc td:last-child {
              font-size: 14px;
            }

            .text-right { text-align: right; }
            .col-label  { width: 60%; }
            .col-value  { width: 40%; }

            .footer-section {
              padding: 7mm 15mm;
              border-top: 3px solid #1e40af;
              background-color: #f8fafc;
              flex-shrink: 0;
              page-break-inside: avoid;
              break-inside: avoid;
            }

            .signature-block {
              margin-bottom: 9px;
              text-align: center;
            }

            .signature-name {
              font-size: 12px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 3px;
            }

            .signature-date {
              font-size: 10.5px;
              color: #64748b;
            }

            .footer-note {
              font-size: 9.5px;
              color: #64748b;
              text-align: center;
              font-style: italic;
              border-top: 1px solid #e2e8f0;
              padding-top: 7px;
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

  // tax mode + passages data (all optional / backward-compatible with old devis records)
  const taxMode = (devis as any).taxMode ?? 'ttc';
  const passageCount: number = (devis as any).passageCount ?? 1;
  const passageSamePrice: boolean = (devis as any).passageSamePrice ?? true;
  const passageUnitPrice: string = (devis as any).passageUnitPrice ?? '';
  const passagePrices: string[] = (devis as any).passagePrices ?? [];

  const showPassageBreakdown = passageCount > 1;

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

  const passageRows = showPassageBreakdown
    ? Array.from({ length: passageCount }, (_, idx) => {
        const price = passageSamePrice
          ? parseFloat(passageUnitPrice) || 0
          : parseFloat(passagePrices[idx]) || 0;
        return { label: `Passage ${idx + 1}`, price };
      })
    : [];

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
          fontSize: '12.5px',
          lineHeight: '1.4',
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
            padding: '10mm 15mm',
            borderBottom: '3px solid #1e40af',
            backgroundColor: '#f8fafc',
            flexShrink: 0,
          }}
        >
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e40af', marginBottom: '4px' }}>
              {settings.companyName}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.5' }}>
              <div>{settings.companyAddress}</div>
              <div>Tél: {settings.phone} | Email: {settings.email}</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '19px', fontWeight: 'bold', color: '#1e40af', marginBottom: '7px' }}>
                DEVIS
              </div>
              <div style={{ fontSize: '11px', color: '#475569' }}>
                <div style={{ marginBottom: '3px' }}><strong>N°:</strong> {devis.number}</div>
                <div style={{ marginBottom: '3px' }}>
                  <strong>Date:</strong> {new Date(devis.date).toLocaleDateString('fr-FR')}
                </div>
                {devis.subject && <div><strong>Objet:</strong> {devis.subject}</div>}
              </div>
            </div>

            {client && (
              <div style={{ textAlign: 'right', fontSize: '11px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#1e40af' }}>CLIENT</div>
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{client.companyName}</div>
                <div style={{ marginBottom: '3px' }}>{client.contactPerson}</div>
                {client.title && <div style={{ marginBottom: '3px', color: '#64748b' }}>{client.title}</div>}
                <div style={{ marginBottom: '3px', color: '#64748b' }}>{client.email}</div>
                <div style={{ marginBottom: '3px', color: '#64748b' }}>{client.phone}</div>
                <div style={{ color: '#64748b' }}>{client.address}</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Content (flex: 1 → fills space between header and footer) ── */}
        <div
          className="content-section"
          style={{
            padding: '6mm 15mm 5mm',
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
                marginBottom: '9px',
                backgroundColor: '#f1f5f9',
                padding: '7px 10px',
                borderLeft: '4px solid #1e40af',
                flexShrink: 0,
              }}
            >
              <div style={{ whiteSpace: 'pre-wrap', fontSize: '11px', lineHeight: '1.5' }}>
                {devis.introduction}
              </div>
            </div>
          )}

          {/* Work Items */}
          <div style={{ marginBottom: '9px', flex: 1, overflow: 'hidden' }}>
            <div
              style={{
                fontSize: '12.5px',
                fontWeight: 'bold',
                marginBottom: '7px',
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
                    marginBottom: '7px',
                    paddingBottom: '7px',
                    borderBottom: idx < devis.workItems.length - 1 ? '1px solid #e2e8f0' : 'none',
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '3px', fontSize: '11px', color: '#0f172a' }}>
                    {item.title}
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: '10.5px', lineHeight: '1.4', color: '#475569' }}>
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
                marginBottom: '9px',
                backgroundColor: '#f8fafc',
                padding: '7px 10px',
                borderRadius: '4px',
                flexShrink: 0,
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '11px', color: '#0f172a' }}>
                Locaux à traiter:
              </div>
              <div style={{ fontSize: '10.5px', color: '#475569' }}>{devis.premises}</div>
            </div>
          )}

          {/* Passages breakdown */}
          {showPassageBreakdown && (
            <div
              className="passages-wrap"
              style={{
                marginTop: '9px',
                flexShrink: 0,
                pageBreakInside: 'avoid',
                breakInside: 'avoid',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e40af', marginBottom: '5px' }}>
                Prix des passages ({passageCount})
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '5px 10px',
                        fontSize: '10.5px',
                        backgroundColor: '#e2e8f0',
                        color: '#1e40af',
                        fontWeight: 'bold',
                        borderBottom: '1px solid #cbd5e1',
                      }}
                    >
                      Passage
                    </th>
                    <th
                      style={{
                        textAlign: 'right',
                        padding: '5px 10px',
                        fontSize: '10.5px',
                        backgroundColor: '#e2e8f0',
                        color: '#1e40af',
                        fontWeight: 'bold',
                        borderBottom: '1px solid #cbd5e1',
                      }}
                    >
                      Prix ({settings.currency})
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {passageRows.map((row, idx) => (
                    <tr key={idx}>
                      <td
                        style={{
                          padding: '5px 10px',
                          fontSize: '10.5px',
                          color: '#475569',
                          borderBottom: '1px solid #e2e8f0',
                        }}
                      >
                        {row.label}
                      </td>
                      <td
                        style={{
                          padding: '5px 10px',
                          fontSize: '10.5px',
                          textAlign: 'right',
                          fontWeight: 600,
                          color: '#0f172a',
                          borderBottom: '1px solid #e2e8f0',
                        }}
                      >
                        {row.price.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pricing Table */}
          <div
            className="pricing-wrap"
            style={{
              marginTop: '9px',
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
                      padding: taxMode === 'ttc' ? '7px 10px' : '9px 10px',
                      textAlign: 'right',
                      borderBottom: '2px solid #1e40af',
                      fontWeight: 'bold',
                      fontSize: taxMode === 'ttc' ? '11px' : '12px',
                      color: taxMode === 'ttc' ? undefined : '#1e40af',
                      width: '60%',
                    }}
                  >
                    {taxMode === 'ttc' ? 'Montant H.T:' : 'MONTANT TOTAL H.T:'}
                  </td>
                  <td
                    style={{
                      padding: taxMode === 'ttc' ? '7px 10px' : '9px 10px',
                      textAlign: 'right',
                      borderBottom: '2px solid #1e40af',
                      fontWeight: 'bold',
                      fontSize: taxMode === 'ttc' ? '12px' : '14px',
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
                      <td style={{ padding: '7px 10px', textAlign: 'right', borderBottom: '1px solid #e2e8f0', fontSize: '11px' }}>
                        TVA (19%):
                      </td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', fontSize: '12px' }}>
                        {taxesNum.toFixed(2)} {settings.currency}
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: '#dbeafe' }}>
                      <td style={{ padding: '9px 10px', textAlign: 'right', borderBottom: '2px solid #1e40af', fontWeight: 'bold', fontSize: '12px', color: '#1e40af' }}>
                        MONTANT TOTAL TTC:
                      </td>
                      <td style={{ padding: '9px 10px', textAlign: 'right', borderBottom: '2px solid #1e40af', fontWeight: 'bold', fontSize: '14px', color: '#1e40af' }}>
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
            padding: '7mm 15mm',
            borderTop: '3px solid #1e40af',
            backgroundColor: '#f8fafc',
            flexShrink: 0,
            pageBreakInside: 'avoid',
            breakInside: 'avoid',
          }}
        >
          <div style={{ marginBottom: '9px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af', marginBottom: '3px' }}>
              {devis.signatureName}
            </div>
            <div style={{ fontSize: '10.5px', color: '#64748b' }}>
              Signé le {new Date(devis.emailDate).toLocaleDateString('fr-FR')}
            </div>
          </div>

          <div
            style={{
              fontSize: '9.5px',
              color: '#64748b',
              textAlign: 'center',
              fontStyle: 'italic',
              borderTop: '1px solid #e2e8f0',
              paddingTop: '7px',
            }}
          >
            <div>Devis valable 30 jours à compter de sa date de signature</div>
            <div style={{ marginTop: '3px' }}>Merci de votre confiance</div>
          </div>
        </div>
      </div>
    </div>
  );
}