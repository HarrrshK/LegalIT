import React from 'react';
import { X, FileText, Download, ShieldCheck, Printer } from 'lucide-react';
import type { LegalDocument } from '../../types';

interface DocumentPreviewModalProps {
  document: LegalDocument | null;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document,
  onClose
}) => {
  if (!document) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content doc-preview-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="doc-preview-title">
            <FileText size={20} className="text-primary" />
            <div>
              <h3>{document.title}</h3>
              <span className="text-xs text-muted">{document.fileName} • {document.fileSize}</span>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body doc-preview-body">
          <div className="preview-watermark-bar">
            <ShieldCheck size={16} color="#059669" />
            <span>Encrypted Legal Repository • Verified by High Court Registry E-Filing System</span>
          </div>

          <div className="document-sheet">
            <div className="sheet-header">
              <div className="court-seal-stamp">HIGH COURT OF DELHI</div>
              <h4>BEFORE THE HON'BLE HIGH COURT OF DELHI AT NEW DELHI</h4>
              <span className="sheet-cnr">IN THE MATTER OF: {document.caseTitle}</span>
            </div>

            <div className="sheet-body-text">
              <p><strong>DOCUMENT TYPE:</strong> {document.category.toUpperCase()}</p>
              <p><strong>DATE OF UPLOAD:</strong> {document.uploadDate}</p>
              <p><strong>VERIFICATION STATUS:</strong> {document.status}</p>

              <hr className="my-3" />

              <p className="legal-prose">
                <strong>MOST RESPECTFULLY SHOWETH:</strong><br />
                1. That the accompanying {document.title} has been filed on behalf of the Plaintiff/Petitioner 
                in compliance with Order 39 Rule 1 & 2 of the Code of Civil Procedure, 1908.<br /><br />
                2. That the contents of paragraphs 1 to 14 of the accompanying application are true and correct to the best of 
                knowledge and legal records maintained by lead counsel <strong>Adv. Rajesh Verma</strong>.<br /><br />
                3. That the original allotment records and payment demand receipts issued by SkyLine Realty Developers Ltd. 
                are annexed herewith as Exhibit P-1 to P-8.
              </p>
            </div>

            <div className="sheet-footer">
              <div className="sig-block">
                <div className="sig-line">[Digital Signature Verified]</div>
                <div className="sig-name">Ananya Sharma (Client/Petitioner)</div>
              </div>
              <div className="sig-block text-right">
                <div className="sig-line">[Advocate Stamp]</div>
                <div className="sig-name">Adv. Rajesh Verma (D/1482/2008)</div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => alert('Printing document mock...')}>
            <Printer size={16} /> Print
          </button>
          <button className="btn btn-primary" onClick={() => alert(`Downloading file ${document.fileName}`)}>
            <Download size={16} /> Download {document.fileName}
          </button>
        </div>
      </div>

      <style>{`
        .doc-preview-modal {
          max-width: 780px;
        }

        .doc-preview-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .doc-preview-body {
          background-color: var(--bg-app);
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .preview-watermark-bar {
          background-color: rgba(5, 150, 105, 0.1);
          color: var(--accent-emerald);
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .document-sheet {
          background-color: #FFFFFF;
          color: #0F172A;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 2.5rem;
          box-shadow: var(--shadow-md);
          font-family: 'Times New Roman', serif;
        }

        .court-seal-stamp {
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.15em;
          color: #1E3A8A;
          text-align: center;
          margin-bottom: 0.5rem;
        }

        .sheet-header {
          text-align: center;
          border-bottom: 2px double #0F172A;
          padding-bottom: 1rem;
          margin-bottom: 1.5rem;
        }

        .sheet-header h4 {
          font-size: 1.1rem;
          color: #0F172A;
        }

        .sheet-cnr {
          font-size: 0.875rem;
          font-weight: 700;
        }

        .sheet-body-text {
          font-size: 0.9375rem;
          line-height: 1.6;
        }

        .legal-prose {
          margin-top: 1rem;
          text-align: justify;
        }

        .sheet-footer {
          margin-top: 3rem;
          display: flex;
          justify-content: space-between;
          padding-top: 1rem;
          border-top: 1px solid #CBD5E1;
        }

        .sig-line { font-weight: 700; color: #1E3A8A; font-size: 0.8125rem; }
        .sig-name { font-size: 0.8125rem; }
        .my-3 { margin: 1rem 0; border: none; border-top: 1px solid #E2E8F0; }
        .text-right { text-align: right; }
      `}</style>
    </div>
  );
};
