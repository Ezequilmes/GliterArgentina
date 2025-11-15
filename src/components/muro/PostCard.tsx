import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { userService } from "@/lib/firestore";

interface Comment { id: number; authorId?: string; author: string; authorPhoto?: string; text: string }
interface Post {
  id: string | number;
  author: string;
  authorId: string;
  authorPhoto?: string;
  date: string;
  content: string;
  image?: string;
  likedBy?: string[];
  dislikedBy?: string[];
  likes: number;
  dislikes: number;
  comments: Comment[];
}

interface PostCardProps {
  post: Post;
  currentUser: any;
  onDelete: (id: string | number) => void;
  onLike: (id: string | number) => void;
  onDislike: (id: string | number) => void;
  onComment?: (id: string, text: string) => void;
}

/**
 * PostCard
 * Tarjeta de publicación del muro.
 */
export function PostCard({ post, currentUser, onDelete, onLike, onDislike, onComment }: PostCardProps): React.ReactElement {
  const [commentText, setCommentText] = useState("");
  const [likedUsers, setLikedUsers] = useState<{ id: string; name: string; photo?: string }[]>([]);
  const [dislikedUsers, setDislikedUsers] = useState<{ id: string; name: string; photo?: string }[]>([]);
  const [likesModalOpen, setLikesModalOpen] = useState(false);
  const [dislikesModalOpen, setDislikesModalOpen] = useState(false);
  const [likedUsersFull, setLikedUsersFull] = useState<{ id: string; name: string; photo?: string }[]>([]);
  const [dislikedUsersFull, setDislikedUsersFull] = useState<{ id: string; name: string; photo?: string }[]>([]);

  useEffect(() => {
    const loadUsers = async (ids?: string[]) => {
      const out: { id: string; name: string; photo?: string }[] = [];
      if (!ids || ids.length === 0) return out;
      for (const id of ids.slice(0, 8)) {
        try {
          const u = await userService.getUser(id);
          if (u) out.push({ id: u.id, name: u.name || "Usuario", photo: Array.isArray(u.photos) && u.photos.length > 0 ? u.photos[0] : undefined });
        } catch {}
      }
      return out;
    };
    loadUsers(post.likedBy).then(setLikedUsers);
    loadUsers(post.dislikedBy).then(setDislikedUsers);
  }, [post.likedBy, post.dislikedBy]);

  const openLikesModal = async () => {
    const ids = post.likedBy || [];
    const out: { id: string; name: string; photo?: string }[] = [];
    for (const id of ids) {
      try {
        const u = await userService.getUser(id);
        if (u) out.push({ id: u.id, name: u.name || "Usuario", photo: Array.isArray(u.photos) && u.photos.length > 0 ? u.photos[0] : undefined });
      } catch {}
    }
    setLikedUsersFull(out);
    setLikesModalOpen(true);
  };

  const openDislikesModal = async () => {
    const ids = post.dislikedBy || [];
    const out: { id: string; name: string; photo?: string }[] = [];
    for (const id of ids) {
      try {
        const u = await userService.getUser(id);
        if (u) out.push({ id: u.id, name: u.name || "Usuario", photo: Array.isArray(u.photos) && u.photos.length > 0 ? u.photos[0] : undefined });
      } catch {}
    }
    setDislikedUsersFull(out);
    setDislikesModalOpen(true);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText) return;
    if (onComment) {
      onComment(String(post.id), commentText);
    }
    setCommentText("");
  };

  return (
    <div className="bg-black border border-primary rounded-xl p-4 w-full max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Link href={`/profile/${post.authorId}`} className="flex items-center gap-2">
            {post.authorPhoto ? (
              <Image src={post.authorPhoto} alt={post.author} width={28} height={28} className="rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary" />
            )}
            <span className="font-bold text-primary">{post.author}</span>
          </Link>
          <span className="text-muted-foreground text-xs ml-2">{post.date}</span>
        </div>
        {post.authorId === (currentUser?.id || "") && (
          <button onClick={() => onDelete(post.id)} className="text-red-500 text-sm">Eliminar</button>
        )}
      </div>
      {post.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.image} alt="Publicación" className="rounded-lg mb-2 object-cover max-h-60 w-full" />
      )}
      <p className="text-white mb-2">{post.content}</p>
      <div className="flex space-x-4 mb-2 items-center">
        <button onClick={() => onLike(post.id)} className="text-accent hover:opacity-80">👍 {post.likes}</button>
        <div className="flex -space-x-2 items-center">
          {likedUsers.map(u => (
            u.photo ? (
              <Image key={`like-${u.id}`} src={u.photo} alt={u.name} title={u.name} width={20} height={20} className="rounded-full border border-primary" />
            ) : (
              <div key={`like-${u.id}`} title={u.name} className="w-5 h-5 rounded-full bg-primary" />
            )
          ))}
          {Array.isArray(post.likedBy) && post.likedBy.length > likedUsers.length && (
            <button onClick={openLikesModal} className="ml-2 text-xs text-primary underline">Ver todos</button>
          )}
        </div>
        <button onClick={() => onDislike(post.id)} className="text-accent hover:opacity-80">👎 {post.dislikes}</button>
        <div className="flex -space-x-2 items-center">
          {dislikedUsers.map(u => (
            u.photo ? (
              <Image key={`dislike-${u.id}`} src={u.photo} alt={u.name} title={u.name} width={20} height={20} className="rounded-full border border-primary" />
            ) : (
              <div key={`dislike-${u.id}`} title={u.name} className="w-5 h-5 rounded-full bg-primary" />
            )
          ))}
          {Array.isArray(post.dislikedBy) && post.dislikedBy.length > dislikedUsers.length && (
            <button onClick={openDislikesModal} className="ml-2 text-xs text-primary underline">Ver todos</button>
          )}
        </div>
      </div>
      <div className="space-y-1 mb-2">
        {post.comments.map((c) => (
          <div key={c.id} className="text-white/90 text-sm flex items-center gap-2">
            {c.authorPhoto ? (
              <Image src={c.authorPhoto} alt={c.author} title={c.author} width={20} height={20} className="rounded-full object-cover" />
            ) : (
              <div title={c.author} className="w-5 h-5 rounded-full bg-primary" />
            )}
            <span className="font-semibold">{c.author}:</span> {c.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleAddComment} className="flex items-center">
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Escribir comentario..."
          className="flex-1 px-2 py-1 bg-black border border-primary rounded-l-md text-white"
        />
        <button type="submit" className="px-3 py-1 bg-accent text-accent-foreground rounded-r-md">Comentar</button>
      </form>

      {likesModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setLikesModalOpen(false)}>
          <div className="bg-black border border-primary rounded-xl p-4 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-white font-semibold mb-3">A quién le gusta</h4>
            <div className="space-y-2 max-h-80 overflow-auto">
              {likedUsersFull.map(u => (
                <Link key={`likes-full-${u.id}`} href={`/profile/${u.id}`} className="flex items-center gap-2">
                  {u.photo ? (
                    <Image src={u.photo} alt={u.name} width={24} height={24} className="rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary" />
                  )}
                  <span className="text-white text-sm">{u.name}</span>
                </Link>
              ))}
            </div>
            <div className="mt-3 flex justify-end">
              <button onClick={() => setLikesModalOpen(false)} className="px-3 py-1 bg-primary text-primary-foreground rounded-md">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {dislikesModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setDislikesModalOpen(false)}>
          <div className="bg-black border border-primary rounded-xl p-4 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-white font-semibold mb-3">A quién no le gusta</h4>
            <div className="space-y-2 max-h-80 overflow-auto">
              {dislikedUsersFull.map(u => (
                <Link key={`dislikes-full-${u.id}`} href={`/profile/${u.id}`} className="flex items-center gap-2">
                  {u.photo ? (
                    <Image src={u.photo} alt={u.name} width={24} height={24} className="rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary" />
                  )}
                  <span className="text-white text-sm">{u.name}</span>
                </Link>
              ))}
            </div>
            <div className="mt-3 flex justify-end">
              <button onClick={() => setDislikesModalOpen(false)} className="px-3 py-1 bg-primary text-primary-foreground rounded-md">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
