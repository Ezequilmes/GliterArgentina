import React, { useRef, useState } from "react";
import { Button } from "@/components/ui";
import { Image as ImageIcon } from "lucide-react";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content && !imageFile) return;
    let imageUrl = "";
    if (imageFile) imageUrl = URL.createObjectURL(imageFile);
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
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
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
      <div className="flex justify-end">
        <button type="submit" className="px-4 py-2 rounded-md bg-primary text-primary-foreground">
          Publicar
        </button>
      </div>
    </form>
  );
}
