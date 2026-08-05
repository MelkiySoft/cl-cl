"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateProfile, type AccountState } from "@/actions/account";
import { createUploadUrl } from "@/actions/upload";

type AccountFormProps = {
    user: {
        id: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
};

export function AccountForm({ user }: AccountFormProps) {
    const { update } = useSession();
    const [state, formAction, isPending] = useActionState<AccountState, FormData>(
        updateProfile,
        {}
    );

    const [name, setName] = useState(user.name ?? "");
    const [imageUrl, setImageUrl] = useState(user.image ?? "");
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // После успешного сохранения обновляем клиентскую сессию
    useEffect(() => {
        if (state.success) {
            update({
                name,
                image: imageUrl || null,
            });
        }
    }, [state.success]); // eslint-disable-line react-hooks/exhaustive-deps

    const initials = name
        ? name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : user.email?.[0]?.toUpperCase() ?? "U";

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadError(null);
        setUploading(true);

        try {
            const result = await createUploadUrl({
                filename: file.name,
                contentType: file.type,
                folder: "users",
                entityId: user.id,
            });

            if ("error" in result && result.error) {
                setUploadError(result.error);
                return;
            }

            // Прямая загрузка в R2
            const uploadRes = await fetch(result.uploadUrl, {
                method: "PUT",
                body: file,
                headers: {
                    "Content-Type": file.type,
                },
            });

            if (!uploadRes.ok) {
                setUploadError("Ошибка загрузки файла");
                return;
            }

            setImageUrl(result.publicUrl);
        } catch {
            setUploadError("Не удалось загрузить изображение");
        } finally {
            setUploading(false);
            // сбрасываем input, чтобы можно было выбрать тот же файл снова
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    }

    return (
        <form action={formAction} className="space-y-8 max-w-lg">
            {/* Avatar */}
            <div className="flex items-center gap-6">
                <Avatar className="size-20">
                    <AvatarImage src={imageUrl || undefined} alt={name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                        {initials}
                    </AvatarFallback>
                </Avatar>

                <div className="space-y-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={uploading || isPending}
                    />

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploading || isPending}
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
                                Change photo
                            </>
                        )}
                    </Button>

                    <p className="text-xs text-muted-foreground">
                        JPG, PNG or WebP. Max ~2–3 MB recommended.
                    </p>

                    {uploadError && (
                        <p className="text-sm text-destructive">{uploadError}</p>
                    )}
                </div>
            </div>

            {/* Hidden field for image URL */}
            <input type="hidden" name="image" value={imageUrl} />

            {/* Name */}
            <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                    Name
                </label>
                <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    minLength={2}
                    maxLength={80}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={isPending}
                />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                    Email
                </label>
                <input
                    type="email"
                    value={user.email ?? ""}
                    disabled
                    className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                    Email нельзя изменить (пока)
                </p>
            </div>

            {/* Messages */}
            {state?.error && (
                <p className="text-sm text-destructive">{state.error}</p>
            )}
            {state?.success && (
                <p className="text-sm text-green-600 dark:text-green-400">
                    Изменения сохранены
                </p>
            )}

            <Button type="submit" disabled={isPending || uploading}>
                {isPending ? (
                    <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Saving...
                    </>
                ) : (
                    "Save changes"
                )}
            </Button>
        </form>
    );
}