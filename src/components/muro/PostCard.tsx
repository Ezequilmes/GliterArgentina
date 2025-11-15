import React, { useState } from "react";

interface Comment { id: number; author: string; text: string }
interface Post {
  id: number;
  author: string;
  authorId: string;
  date: string;
  content: string;
  image?: string;
  likes: number;
  dislikes: number;
  comments: Comment[];
}

interface PostCardProps {
  post: Post;
  currentUser: any;
  onDelete: (id: number) => void;
  onLike: (id: number) => void;
  onDislike: (id: number) => void;
  onComment?: (id: string, text: string) => void;
}

/**
 * PostCard
 * Tarjeta de publicación del muro.
 */
export function PostCard({ post, currentUser, onDelete, onLike, onDislike, onComment }: PostCardProps): JSX.Element {
  const [commentText, setCommentText] = useState("");

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
        <div>
          <span className="font-bold text-primary">{post.author}</span>
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
      <div className="flex space-x-4 mb-2">
        <button onClick={() => onLike(post.id)} className="text-accent hover:opacity-80">👍 {post.likes}</button>
        <button onClick={() => onDislike(post.id)} className="text-accent hover:opacity-80">👎 {post.dislikes}</button>
      </div>
      <div className="space-y-1 mb-2">
        {post.comments.map((c) => (
          <div key={c.id} className="text-white/90 text-sm">
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
    </div>
  );
}
