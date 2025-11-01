import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
    currentAvatarUrl?: string | null;
    onUpload: (file: File) => Promise<string | null>;
    onDelete?: () => Promise<boolean>;
    userName?: string | null;
}

export function AvatarUpload({
    currentAvatarUrl,
    onUpload,
    onDelete,
    userName
}: AvatarUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image size must be less than 5MB');
            return;
        }

        setError(null);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
            setIsDialogOpen(true);
        };
        reader.readAsDataURL(file);

        // Store file for upload
        if (fileInputRef.current) {
            fileInputRef.current.files = e.target.files;
        }
    };

    const handleUpload = async () => {
        const file = fileInputRef.current?.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setError(null);

        try {
            const result = await onUpload(file);
            if (result) {
                setIsDialogOpen(false);
                setPreview(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            } else {
                setError('Failed to upload image. Please try again.');
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError('An error occurred during upload');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async () => {
        if (!onDelete) return;

        setIsUploading(true);
        setError(null);

        try {
            const success = await onDelete();
            if (!success) {
                setError('Failed to delete avatar');
            }
        } catch (err) {
            console.error('Delete error:', err);
            setError('An error occurred during deletion');
        } finally {
            setIsUploading(false);
        }
    };

    const getInitials = (name: string | null | undefined): string => {
        if (!name) return 'U';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <>
            <div className="relative group">
                {/* Avatar Display */}
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg">
                    {currentAvatarUrl ? (
                        <img
                            src={currentAvatarUrl}
                            alt={userName || 'User avatar'}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
                            <span className="text-4xl font-bold text-white">
                                {getInitials(userName)}
                            </span>
                        </div>
                    )}

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <div className="flex gap-2">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 text-white"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Camera className="h-5 w-5" />
                                )}
                            </Button>

                            {currentAvatarUrl && onDelete && (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-10 w-10 rounded-full bg-white/20 hover:bg-destructive/80 text-white"
                                    onClick={handleDelete}
                                    disabled={isUploading}
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Upload Button (visible on mobile or always) */}
                <Button
                    size="icon"
                    className="absolute bottom-0 right-0 h-10 w-10 rounded-full shadow-lg bg-primary hover:bg-primary/90"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                >
                    <Upload className="h-5 w-5" />
                </Button>

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>

            {/* Error message */}
            {error && (
                <p className="text-sm text-destructive mt-2">{error}</p>
            )}

            {/* Upload Preview Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Upload Avatar</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {preview && (
                            <div className="flex justify-center">
                                <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-primary/20">
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        )}

                        {error && (
                            <p className="text-sm text-destructive text-center">{error}</p>
                        )}

                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsDialogOpen(false);
                                    setPreview(null);
                                    setError(null);
                                    if (fileInputRef.current) {
                                        fileInputRef.current.value = '';
                                    }
                                }}
                                disabled={isUploading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="bg-gradient-primary"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
