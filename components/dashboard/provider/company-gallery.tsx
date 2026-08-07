"use client";

import { useRef, useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    addCompanyImage,
    deleteCompanyImage,
} from "@/actions/provider-company";
import { createUploadUrl } from "@/actions/upload";

type GalleryImage = {
    id: number;
    image: string;
    sortOrder: number;
};

type Props = {
    companyId: number;
    images: GalleryImage[];
};

export function CompanyGallery({ companyId, images: initialImages }: Props) {
    const [images, setImages] = useState(initialImages);
    const [uploading, setUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        if (images.length >= 5) {
            setError("Maximum 5 gallery images");
            return;
        }

        setError(null);
        setUploading(true);

        try {
            const result = await createUploadUrl({
                filename: file.name,
                contentType: file.type,
                folder: "companies",
                entityId: companyId,
            });

            if ("error" in result && result.error) {
                setError(result.error);
                return;
            }

            if (!result.uploadUrl || !result.publicUrl) {
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

            const saveResult = await addCompanyImage(
                companyId,
                result.publicUrl
            );

            if (saveResult.error) {
                setError(saveResult.error);
                return;
            }

            if (saveResult.image) {
                setImages((prev) => [...prev, saveResult.image!]);
            }
        } catch {
            setError("Failed to upload image");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    async function handleDelete(imageId: number) {
        setError(null);
        setDeletingId(imageId);

        try {
            const result = await deleteCompanyImage(companyId, imageId);
            if (result.error) {
                setError(result.error);
                return;
            }
            setImages((prev) => prev.filter((img) => img.id !== imageId));
        } catch {
            setError("Failed to delete image");
        } finally {
            setDeletingId(null);
        }
    }

    const canAdd = images.length < 5;
    const busy = uploading || deletingId !== null;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                    Gallery · {images.length}/5
                </p>

                {canAdd && (
                    <>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
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
                                    Add photo
                                </>
                            )}
                        </Button>
                    </>
                )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {images.map((img) => (
                        <div
                            key={img.id}
                            className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={img.image}
                                alt=""
                                className="size-full object-cover"
                            />
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleDelete(img.id)}
                                className="absolute right-1 top-1 rounded-md bg-black/60 p-1 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100 disabled:opacity-50"
                                title="Delete"
                            >
                                {deletingId === img.id ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                    <Trash2 className="size-3.5" />
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}