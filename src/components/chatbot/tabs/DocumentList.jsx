import React, { useState } from "react";
import { Icon } from "@mdi/react";
import { mdiChevronDown, mdiChevronUp, mdiDownload, mdiPencil, mdiDelete } from "@mdi/js";
import "./DocumentList.css";
import { documentService } from "../../../service/documentService";
import { useToast } from "../../common/Toast";

const DocumentList = ({ documents, onRefresh }) => {
  const { addToast } = useToast();
  const [expandedDocs, setExpandedDocs] = useState({});

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // 근태 제목 필터링 (대소문자 구분 없이, 공백 제거 후 검사, 더 엄격한 필터링)
  const filteredDocuments = documents.filter((doc) => {
    if (!doc.title) return true;
    const title = doc.title.trim().toLowerCase();
    // "근태"가 포함된 모든 경우 필터링 (정규표현식 사용)
    const hasAttendance = /근태/.test(title);
    return !hasAttendance;
  });

  const toggleExpand = (docId) => {
    setExpandedDocs((prev) => ({
      ...prev,
      [docId]: !prev[docId],
    }));
  };

  const handleDownload = async (doc) => {
    try {
      const downloadUrl = await documentService.getDocumentDownloadUrl(
        doc.employeeId || doc.id,
        doc.id
      );
      if (downloadUrl) {
        window.open(downloadUrl, "_blank");
        addToast({
          type: "success",
          title: "성공",
          message: "파일 다운로드가 시작되었습니다.",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("다운로드 실패:", error);
      addToast({
        type: "error",
        title: "오류",
        message: "파일 다운로드에 실패했습니다.",
        duration: 3000,
      });
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`"${doc.title || "선택된 문서"}"를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await documentService.deleteDocument(doc.employeeId || doc.id, doc.id);
      addToast({
        type: "success",
        title: "성공",
        message: "문서가 성공적으로 삭제되었습니다.",
        duration: 3000,
      });
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("문서 삭제 실패:", error);
      addToast({
        type: "error",
        title: "오류",
        message: "문서 삭제에 실패했습니다.",
        duration: 3000,
      });
    }
  };

  if (!filteredDocuments || filteredDocuments.length === 0) {
    return (
      <div className="document-list-empty">
        등록된 문서가 없습니다.
      </div>
    );
  }

  return (
    <div className="document-list-container">
      <div className="document-list-title">
        📄 문서 목록 ({filteredDocuments.length}개)
      </div>
      <div className="document-list-grid">
        {filteredDocuments.map((doc) => {
          const isExpanded = expandedDocs[doc.id];
          return (
            <div key={doc.id} className="document-list-item">
              <div className="document-item-content">
                <div className="document-item-row">
                  <span className="document-item-label">문서명:</span>
                  <span className="document-item-value">{doc.title || "제목 없음"}</span>
                </div>
                <div className="document-item-row">
                  <span className="document-item-label">유형:</span>
                  <span className="document-item-value">{doc.documentType}</span>
                </div>
                {doc.description && (
                  <div className="document-item-row">
                    <span className="document-item-label">설명:</span>
                    <span className="document-item-value">{doc.description}</span>
                  </div>
                )}
                <div className="document-item-row">
                  <span className="document-item-label">등록일:</span>
                  <span className="document-item-value">
                    {formatDate(doc.uploadedAt || doc.createdAt)}
                  </span>
                </div>
              </div>
              <div className="document-item-actions">
                <button
                  className="document-expand-btn"
                  onClick={() => toggleExpand(doc.id)}
                  aria-label={isExpanded ? "접기" : "펼치기"}
                >
                  <Icon path={isExpanded ? mdiChevronUp : mdiChevronDown} size={1} />
                </button>
                {isExpanded && (
                  <div className="document-action-buttons">
                    <button
                      className="document-action-btn document-action-download"
                      onClick={() => handleDownload(doc)}
                      title="다운로드"
                    >
                      <Icon path={mdiDownload} size={1.2} />
                    </button>
                    <button
                      className="document-action-btn document-action-edit"
                      onClick={() => {
                        addToast({
                          type: "info",
                          title: "알림",
                          message: "문서 수정 기능은 지점관리에서 이용해주세요.",
                          duration: 3000,
                        });
                      }}
                      title="수정"
                    >
                      <Icon path={mdiPencil} size={1.2} />
                    </button>
                    <button
                      className="document-action-btn document-action-delete"
                      onClick={() => handleDelete(doc)}
                      title="삭제"
                    >
                      <Icon path={mdiDelete} size={1.2} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentList;

