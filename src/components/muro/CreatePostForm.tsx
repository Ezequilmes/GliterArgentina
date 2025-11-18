import React, { useRef, useState } from "react";
import { Button } from "@/components/ui";
import { Image as ImageIcon } from "lucide-react";
import { storageService } from "@/lib/storage";

interface CreatePostFormProps {
  onCreate: (post: any) => void;
  currentUser: any;
}

/**
 * CreatePostForm
 * Formulario para crear publicaciones del muro.
 */
export function CreatePostForm({ onCreate, currentUser }: CreatePostFormProps): React.ReactElement {
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const cancelUploadRef = useRef<(() => void) | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content && !imageFile) return;
    let imageUrl = "";
    try {
      if (imageFile && currentUser?.id) {
        setIsUploading(true);
        const result = await storageService.uploadPostImage(
          currentUser.id,
          imageFile,
          (p) => { setUploadProgress(Math.round(p.progress)); },
          (cancel) => { cancelUploadRef.current = cancel; }
        );
        imageUrl = result.url;
      }
    } catch (err) {
      console.warn('Error uploading post image:', err);
    }
    const newPost = {
      id: Date.now(),
      author: currentUser?.name || "Usuario",
      authorId: currentUser?.id || "",
      date: new Date().toLocaleString(),
      content,
      image: imageUrl,
      likes: 0,
      dislikes: 0,
      comments: []
    };
    onCreate(newPost);
    setContent("");
    setImageFile(null);
    setIsUploading(false);
    setUploadProgress(0);
    cancelUploadRef.current = null;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="¿Qué estás pensando?"
        className="w-full p-3 rounded-lg bg-black text-white border border-primary"
        rows={3}
      />
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          id="post-image"
          type="file"
          accept="image/*"
          onChange={(e) => {
            setImageFile(e.target.files?.[0] || null);
            setUploadProgress(0);
            if (previewUrl) {
              try { URL.revokeObjectURL(previewUrl); } catch {}
            }
            const file = e.target.files?.[0] || null;
            if (file) {
              try { setPreviewUrl(URL.createObjectURL(file)); } catch {}
            } else {
              setPreviewUrl("");
            }
          }}
          className="sr-only"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
        >
          <ImageIcon className="w-4 h-4 mr-2" /> Seleccionar imagen
        </Button>
        {imageFile && (
          <span className="text-sm text-white/80 truncate max-w-[200px]">{imageFile.name}</span>
        )}
      </div>

      {previewUrl && (
        <div className="mt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Vista previa" className="rounded-lg max-h-40 w-full object-cover border border-primary" />
        </div>
      )}

      {isUploading && (
        <div className="mt-2 w-full">
          <div className="w-full h-2 bg-black border border-primary rounded">
            <div className="h-full bg-primary" style={{ width: `${uploadProgress}%` }} />
          </div>
          <div className="mt-1 text-xs text-white/80 flex items-center justify-between">
            <span>Subiendo imagen... {uploadProgress}%</span>
            <button type="button" className="text-primary underline" onClick={() => {
              try { cancelUploadRef.current?.(); } catch {}
              setIsUploading(false);
              setUploadProgress(0);
            }}>Cancelar</button>
          </div>
        </div>
      )}
      <div className="flex justify-end">
        <button type="submit" disabled={isUploading} className="px-4 py-2 rounded-md bg-primary text-primary-foreground disabled:opacity-60 disabled:cursor-not-allowed">
          {isUploading ? 'Publicando...' : 'Publicar'}
        </button>
      </div>
    </form>
  );
}
