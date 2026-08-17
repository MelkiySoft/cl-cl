"use client";

import { useRef, useState } from "react";
import { Download, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    deleteCompanyDocument,
    getDocumentDownloadUrl,
    saveCompanyDocument,
} from "@/actions/provider-company";
import { createDocumentUploadUrl } from "@/actions/upload";
import type { DocumentType } from "@/db/schema";

type Doc = {
    id: number;
    type: DocumentType;
    originalName: string;
    contentType: string;
    fileSize: number | null;
    status: string;
    adminNote?: string | null;
    uploadedAt: Date | string;
};

type Props = {
    companyId: number;
    documents: Doc[];
};

const TYPE_LABELS: Record<DocumentType, string> = {
    insurance: "Insurance (COI)",
    bond: "Bond",
    license: "License",
    other: "Other",
};

const STATUS_LABELS: Record<string, string> = {
    pending: "Pending review",
    approved: "Approved",
    rejected: "Rejected",
};

export function CompanyDocuments({
                                     companyId,
                                     documents: initialDocuments,
                                 }: Props) {
    const [documents, setDocuments] = useState(initialDocuments);
    const [type, setType] = useState<DocumentType>("insurance");
    const [uploading, setUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const busy = uploading || deletingId !== null || downloadingId !== null;

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setUploading(true);

        try {
            const result = await createDocumentUploadUrl({
                filename: file.name,
                contentType: file.type,
                companyId,
                type,
            });

            if ("error" in result && result.error) {
                setError(result.error);
                return;
            }

            if (!result.uploadUrl || !result.key) {
                setError("Failed to get upload URL");
                return;
            }

            const uploadRes = await fetch(result.uploadUrl, {
                method: "PUT",
                body: file,
                headers: { "Content-Type": file.type },
            });

            if (!uploadRes.ok) {
                setError("Upload failed");
                return;
            }

            const saveResult = await saveCompanyDocument({
                companyId,
                type,
                fileKey: result.key,
                originalName: file.name,
                contentType: file.type,
                fileSize: file.size,
            });

            if (saveResult.error) {
                setError(saveResult.error);
                return;
            }

            if (saveResult.document) {
                setDocuments((prev) => [saveResult.document!, ...prev]);
            }
        } catch {
            setError("Failed to upload document");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    async function handleDownload(docId: number) {
        setError(null);
        setDownloadingId(docId);

        try {
            const result = await getDocumentDownloadUrl(companyId, docId);
            if (result.error || !result.url) {
                setError(result.error ?? "Failed to get download URL");
                return;
            }
            window.open(result.url, "_blank", "noopener,noreferrer");
        } catch {
            setError("Failed to download document");
        } finally {
            setDownloadingId(null);
        }
    }

    async function handleDelete(docId: number) {
        setError(null);
        setDeletingId(docId);

        try {
            const result = await deleteCompanyDocument(companyId, docId);
            if (result.error) {
                setError(result.error);
                return;
            }
            setDocuments((prev) => prev.filter((d) => d.id !== docId));
        } catch {
            setError("Failed to delete document");
        } finally {
            setDeletingId(null);
        }
    }

    function formatSize(bytes: number | null) {
        if (bytes == null) return "";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                    <label htmlFor="doc-type" className="text-xs font-medium">
                        Document type
                    </label>
                    <select
                        id="doc-type"
                        value={type}
                        onChange={(e) => setType(e.target.value as DocumentType)}
                        disabled={busy}
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        {(Object.keys(TYPE_LABELS) as DocumentType[]).map((t) => (
                            <option key={t} value={t}>
                                {TYPE_LABELS[t]}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={busy}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 size-4" />
                                Upload document
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {documents.length > 0 && (
                <ul className="divide-y rounded-md border">
                    {documents.map((doc) => (
                        <li
                            key={doc.id}
                            className="flex items-center gap-3 px-3 py-2.5"
                        >
                            <FileText className="size-4 shrink-0 text-muted-foreground" />

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                    {doc.originalName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {TYPE_LABELS[doc.type]} ·{" "}
                                    {STATUS_LABELS[doc.status] ?? doc.status}
                                    {doc.fileSize != null &&
                                        ` · ${formatSize(doc.fileSize)}`}
                                </p>
                            </div>

                            <div className="flex shrink-0 gap-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={busy}
                                    onClick={() => handleDownload(doc.id)}
                                    title="Download"
                                >
                                    {downloadingId === doc.id ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <Download className="size-4" />
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={busy}
                                    onClick={() => handleDelete(doc.id)}
                                    title="Delete"
                                >
                                    {deletingId === doc.id ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="size-4" />
                                    )}
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}