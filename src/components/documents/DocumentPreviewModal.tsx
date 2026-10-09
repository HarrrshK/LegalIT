import React from 'react';
import { X, FileText, Download, ShieldCheck } from 'lucide-react';
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
            <span>Document metadata</span>
          </div>

          <div className="document-sheet">
            <div className="sheet-header"><h4>{document.title}</h4><span className="sheet-cnr">{document.caseTitle}</span></div>
            <div className="sheet-body-text">
              <p><strong>Document type:</strong> {document.category}</p>
              <p><strong>Uploaded:</strong> {document.uploadDate}</p>
              <p><strong>Uploaded by:</strong> {document.uploadedBy}</p>
              <p><strong>Status:</strong> {document.status}</p>
              {!document.downloadUrl && <p className="text-muted" style={{ marginTop: '1.5rem' }}>No file is attached to this record.</p>}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          {document.downloadUrl && <a className="btn btn-primary" href={document.downloadUrl} download={document.fileName}>
            <Download size={16} /> Download {document.fileName}
          </a>}
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
