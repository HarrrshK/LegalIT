import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Upload, 
  Eye, 
  Download, 
  CheckCircle,
  X
} from 'lucide-react';
import { mockCases } from '../../data/mockData';
import type { LegalDocument } from '../../types';

interface DocumentsPageProps {
  onPreviewDocument: (doc: LegalDocument) => void;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({
  onPreviewDocument
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const allDocs = mockCases.flatMap(c => c.documents);
  const categories = ['All', 'Pleading', 'Court Order', 'Affidavit', 'Evidence', 'Vakalatnama'];

  const filteredDocs = allDocs.filter(doc => {
    const matchesCat = selectedCategory === 'All' || doc.category === selectedCategory;
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.caseTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUploadSuccess(true);
    setTimeout(() => {
      setUploadSuccess(false);
      setShowUploadModal(false);
      alert('Document uploaded successfully to your vault and notified to Adv. Rajesh Verma!');
    }, 1200);
  };

  return (
    <div className="documents-page">
      <div className="page-header-flex">
        <div>
          <h1>Documents Vault</h1>
          <p className="text-muted">Encrypted vault for case pleadings, interim court orders, and evidence records</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
          <Upload size={18} /> Upload Document
        </button>
      </div>

      {/* Controls */}
      <div className="controls-row">
        <div className="search-box">
          <Search size={18} className="search-box-icon" />
          <input 
            type="text"
            className="input-field"
            placeholder="Search documents by title, file name, or case..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="category-pills">
          {categories.map(cat => (
            <button
              key={cat}
              className={`pill-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid / Table */}
      <div className="card">
        <div className="docs-table-wrapper">
          <table className="docs-table">
            <thead>
              <tr>
                <th>Document Details</th>
                <th>Associated Case</th>
                <th>Category</th>
                <th>File Size</th>
                <th>Uploaded By</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map(doc => (
                <tr key={doc.id}>
                  <td>
                    <div className="doc-cell">
                      <div className="doc-icon-box">
                        <FileText size={20} color="#2563EB" />
                      </div>
                      <div>
                        <div className="doc-title-text">{doc.title}</div>
                        <div className="doc-filename-text">{doc.fileName}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="case-link-text">{doc.caseTitle}</span></td>
                  <td><span className="badge badge-primary">{doc.category}</span></td>
                  <td>{doc.fileSize}</td>
                  <td>{doc.uploadedBy}</td>
                  <td>{doc.uploadDate}</td>
                  <td>
                    <div className="action-buttons-flex">
                      <button 
                        className="btn-icon" 
                        title="Preview File"
                        onClick={() => onPreviewDocument(doc)}
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Download File"
                        onClick={() => alert(`Downloading ${doc.fileName}...`)}
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Document Dialog */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload Document to Vault</h3>
              <button className="btn-icon" onClick={() => setShowUploadModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="modal-body">
              {uploadSuccess ? (
                <div className="upload-success-state">
                  <CheckCircle size={48} color="#059669" />
                  <h4>File Successfully Uploaded!</h4>
                  <p>Encrypted & stored in case file.</p>
                </div>
              ) : (
                <div className="form-stack">
                  <div className="input-group">
                    <label className="input-label">Select Associated Case</label>
                    <select className="input-field" required>
                      {mockCases.map(c => (
                        <option key={c.id} value={c.id}>{c.title} ({c.cnrNumber})</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Document Category</label>
                    <select className="input-field" required>
                      <option value="Evidence">Evidence / Bank Receipt</option>
                      <option value="Affidavit">Affidavit</option>
                      <option value="Pleading">Pleading Note</option>
                      <option value="Vakalatnama">Vakalatnama Authorization</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Document Title</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. Valuation Certificate 2026"
                      required 
                    />
                  </div>

                  {/* Drop zone UI */}
                  <div className="dropzone-box">
                    <Upload size={32} className="text-muted" />
                    <p>Drag & drop PDF / JPG files here or <strong>browse files</strong></p>
                    <span className="text-xs text-muted">Max file size: 25 MB • Encrypted at rest</span>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Upload to Case File
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      <style>{`
        .documents-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .controls-row {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
        }

        .doc-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .doc-icon-box {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          background-color: rgba(37, 99, 235, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .doc-title-text {
          font-weight: 600;
          color: var(--text-primary);
        }

        .doc-filename-text {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .case-link-text {
          font-size: 0.8125rem;
          color: var(--text-secondary);
        }

        .action-buttons-flex {
          display: flex;
          gap: 0.35rem;
        }

        .dropzone-box {
          border: 2px dashed var(--border-color);
          border-radius: var(--radius-md);
          padding: 2rem;
          text-align: center;
          background-color: var(--bg-app);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .upload-success-state {
          padding: 2.5rem 1rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }
      `}</style>
    </div>
  );
};
