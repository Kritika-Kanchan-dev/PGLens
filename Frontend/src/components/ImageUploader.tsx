// src/components/ImageUploader.tsx
import { useState, useRef, useCallback } from "react";
import { Upload, X, Star, ImagePlus, AlertCircle, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface ImageFile {
  file: File;
  preview: string;
  id: string;
}

interface UploadedImage {
  id: number;
  image_url: string;
  is_primary: boolean;
}

interface ImageUploaderProps {
  pgId: number;
  existingImages?: UploadedImage[];
  onUploadComplete?: (images: UploadedImage[]) => void;
}

const ImageUploader = ({ pgId, existingImages = [], onUploadComplete }: ImageUploaderProps) => {
  const [pendingFiles, setPendingFiles] = useState<ImageFile[]>([]);
  const [uploaded, setUploaded] = useState<UploadedImage[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalCount = uploaded.length + pendingFiles.length;
  const canAddMore = totalCount < 10;
  const canUpload = pendingFiles.length > 0;
  const hasMinimum = totalCount >= 4;

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    const remaining = 10 - totalCount;
    if (remaining <= 0) {
      toast.error("Maximum 10 images allowed");
      return;
    }

    const newFiles: ImageFile[] = [];
    const toAdd = Array.from(files).slice(0, remaining);

    for (const file of toAdd) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        continue;
      }
      newFiles.push({
        file,
        preview: URL.createObjectURL(file),
        id: `${Date.now()}-${Math.random()}`,
      });
    }

    if (Array.from(files).length > remaining) {
      toast.warning(`Only ${remaining} more image(s) can be added. Others were ignored.`);
    }

    setPendingFiles((prev) => [...prev, ...newFiles]);
  }, [totalCount]);

  const removePending = (id: string) => {
    setPendingFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  const deleteUploaded = async (imageId: number) => {
    try {
      const res = await fetch(`${API_URL}/images/${imageId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("pglens_token")}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message);
      }
      setUploaded((prev) => prev.filter((img) => img.id !== imageId));
      toast.success("Image deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete image");
    }
  };

  const setPrimary = async (imageId: number) => {
    try {
      const res = await fetch(`${API_URL}/images/${imageId}/primary`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${localStorage.getItem("pglens_token")}` },
      });
      if (!res.ok) throw new Error("Failed to set primary");
      setUploaded((prev) =>
        prev.map((img) => ({ ...img, is_primary: img.id === imageId }))
      );
      toast.success("Cover image updated");
    } catch {
      toast.error("Failed to update cover image");
    }
  };

  const handleUpload = async () => {
    if (pendingFiles.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      pendingFiles.forEach((pf) => formData.append("images", pf.file));

      const res = await fetch(`${API_URL}/images/upload/${pgId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("pglens_token")}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      const newImages: UploadedImage[] = data.images;
      setUploaded((prev) => [...prev, ...newImages]);
      pendingFiles.forEach((pf) => URL.revokeObjectURL(pf.preview));
      setPendingFiles([]);
      toast.success(`${newImages.length} image(s) uploaded!`);
      onUploadComplete?.([...uploaded, ...newImages]);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">
            PG Images
            <span className={`ml-2 text-xs font-semibold ${hasMinimum ? "text-success" : "text-warning"}`}>
              {totalCount}/10 images {!hasMinimum && `(need at least 4)`}
            </span>
          </p>
        </div>
        {!hasMinimum && (
          <div className="flex items-center gap-1 text-xs text-warning">
            <AlertCircle className="h-3.5 w-3.5" />
            Minimum 4 required
          </div>
        )}
        {hasMinimum && (
          <div className="flex items-center gap-1 text-xs text-success">
            <CheckCircle className="h-3.5 w-3.5" />
            Good to go!
          </div>
        )}
      </div>

      {/* Already uploaded images */}
      {uploaded.length > 0 && (
        <div>
          <p className="mb-2 text-xs text-muted-foreground">Uploaded images — click ⭐ to set as cover</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {uploaded.map((img) => (
              <motion.div key={img.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="relative group aspect-square overflow-hidden rounded-xl border-2 border-border">
                <img src={img.image_url} alt="PG" className="h-full w-full object-cover" />
                {img.is_primary && (
                  <div className="absolute top-1.5 left-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                    Cover
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!img.is_primary && (
                    <button onClick={() => setPrimary(img.id)}
                      className="rounded-full bg-white/20 p-1.5 hover:bg-white/40 transition-colors" title="Set as cover">
                      <Star className="h-4 w-4 text-yellow-400" />
                    </button>
                  )}
                  <button onClick={() => deleteUploaded(img.id)}
                    className="rounded-full bg-white/20 p-1.5 hover:bg-destructive/80 transition-colors" title="Delete">
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Pending files preview */}
      {pendingFiles.length > 0 && (
        <div>
          <p className="mb-2 text-xs text-muted-foreground">Ready to upload ({pendingFiles.length} file{pendingFiles.length > 1 ? "s" : ""})</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            <AnimatePresence>
              {pendingFiles.map((pf) => (
                <motion.div key={pf.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative aspect-square overflow-hidden rounded-xl border-2 border-dashed border-primary/50">
                  <img src={pf.preview} alt="preview" className="h-full w-full object-cover opacity-80" />
                  <button onClick={() => removePending(pf.id)}
                    className="absolute top-1.5 right-1.5 rounded-full bg-background/80 p-1 hover:bg-destructive hover:text-white transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                  {/* Pending badge */}
                  <div className="absolute bottom-1.5 left-1.5 rounded-full bg-primary/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    Pending
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Drop zone — only show if can add more */}
      {canAddMore && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
            dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-secondary/30"
          }`}
        >
          <ImagePlus className={`mx-auto h-10 w-10 ${dragOver ? "text-primary" : "text-muted-foreground/40"}`} />
          <p className="mt-2 text-sm font-medium text-foreground">
            {dragOver ? "Drop images here!" : "Drag & drop images here"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            or <span className="text-primary font-medium">click to browse</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            JPG, PNG, WEBP · Max 5MB each · {10 - totalCount} more allowed
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>
      )}

      {totalCount >= 10 && (
        <div className="rounded-xl bg-warning/10 border border-warning/20 p-3 text-center text-sm text-warning">
          Maximum 10 images reached. Delete some to add new ones.
        </div>
      )}

      {/* Upload button */}
      {canUpload && (
        <Button onClick={handleUpload} disabled={uploading} className="w-full gap-2" size="lg">
          {uploading ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Uploading {pendingFiles.length} image{pendingFiles.length > 1 ? "s" : ""}...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload {pendingFiles.length} Image{pendingFiles.length > 1 ? "s" : ""}
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default ImageUploader;