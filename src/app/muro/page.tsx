"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AppLayout, Header } from "@/components/layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Card, Button } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { PostCard } from "@/components/muro/PostCard";
import { CreatePostForm } from "@/components/muro/CreatePostForm";
import { postsService } from "@/lib/firestore";
import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { getUserProfilePhoto } from "@/lib/userUtils";

interface Post {
  id: string;
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
  comments: { id: number; authorId?: string; author: string; authorPhoto?: string; text: string }[];
}

/**
 * MuroPage
 * Página de muro público con lista de publicaciones y carga incremental.
 * Mantiene solo las 30 publicaciones más recientes en memoria.
 */
export default function MuroPage(): React.ReactElement {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  /**
   * Carga inicial de publicaciones (simulada).
   */
  useEffect(() => {
    const unsub = postsService.onPostsChange(20, (posts, last, more) => {
      const normalized = posts.map(p => ({
        id: p.id,
        author: p.author || 'Usuario',
        authorId: p.authorId || '',
        authorPhoto: p.authorPhoto || '',
        date: new Date().toLocaleString(),
        content: p.content || '',
        image: p.image || '',
        likedBy: Array.isArray(p.likedBy) ? p.likedBy : [],
        dislikedBy: Array.isArray(p.dislikedBy) ? p.dislikedBy : [],
        likes: Array.isArray(p.likedBy) ? p.likedBy.length : (p.likes || 0),
        dislikes: Array.isArray(p.dislikedBy) ? p.dislikedBy.length : (p.dislikes || 0),
        comments: Array.isArray(p.comments) ? p.comments : []
      }));
      setPosts(normalized);
      setLastDoc(last);
      setHasMore(more);
    });
    return () => {
      if (unsub) unsub();
    };
  }, []);

  /**
   * Cargar más publicaciones (simulado con datos locales).
   */
  const fetchMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    postsService.listPosts(20, lastDoc ?? undefined).then(({ posts, lastDoc: newLast, hasMore: more }) => {
      const normalized = posts.map(p => ({
        id: p.id,
        author: p.author || 'Usuario',
        authorId: p.authorId || '',
        date: new Date().toLocaleString(),
        content: p.content || '',
        image: p.image || '',
        likes: p.likes || 0,
        dislikes: p.dislikes || 0,
        comments: Array.isArray(p.comments) ? p.comments : []
      }));
      setPosts(prev => [...prev, ...normalized]);
      setLastDoc(newLast);
      setHasMore(more);
    }).finally(() => setLoadingMore(false));
  }, [loadingMore, hasMore, lastDoc]);

  /**
   * Crear una nueva publicación (insertar al inicio, mantener FIFO de 30).
   */
  const handleCreate = useCallback((newPost: Post) => {
    const imageUrl = newPost.image;
    const content = newPost.content;
    const authorId = user?.id || '';
    const authorName = user?.name || 'Usuario';
    postsService.createPost(authorId, authorName, content, imageUrl).then((id) => {
      const created: Post = { 
        ...newPost, 
        id, 
        authorId, 
        author: authorName, 
        authorPhoto: getUserProfilePhoto(user) || '',
        likedBy: [], dislikedBy: [],
        likes: 0, dislikes: 0
      };
      setPosts(prev => [created, ...prev].slice(0, 30));
    });
  }, [user]);

  return (
    <ProtectedRoute requireAuth>
      <AppLayout>
        <div className="space-y-6">
          <Header title="Muro" />

          <Card padding="lg">
            <CreatePostForm onCreate={handleCreate} currentUser={user} />
          </Card>

          <div className="space-y-4">
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={user}
                onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
                onLike={(id) => {
                  postsService.likePost(user?.id || '', String(id)).catch(() => {});
                  setPosts(prev => prev.map(p => p.id === id ? { ...p, likedBy: Array.from(new Set([...(p.likedBy||[]), user?.id || ''])), dislikedBy: (p.dislikedBy||[]).filter(u => u !== (user?.id||'')), likes: (p.likedBy?.length || 0) + 1, dislikes: (p.dislikedBy?.length || 0) - ((p.dislikedBy||[]).includes(user?.id||'') ? 1 : 0) } : p));
                }}
                onDislike={(id) => {
                  postsService.dislikePost(user?.id || '', String(id)).catch(() => {});
                  setPosts(prev => prev.map(p => p.id === id ? { ...p, dislikedBy: Array.from(new Set([...(p.dislikedBy||[]), user?.id || ''])), likedBy: (p.likedBy||[]).filter(u => u !== (user?.id||'')), dislikes: (p.dislikedBy?.length || 0) + 1, likes: (p.likedBy?.length || 0) - ((p.likedBy||[]).includes(user?.id||'') ? 1 : 0) } : p));
                }}
                onComment={(id, text) => {
                  postsService.addComment(id, user?.id || '', user?.name || 'Usuario', text).catch(() => {});
                  setPosts(prev => prev.map(p => p.id === id ? { ...p, comments: [...p.comments, { id: Date.now(), authorId: user?.id || '', author: user?.name || 'Usuario', authorPhoto: getUserProfilePhoto(user) || '', text }] } : p));
                }}
              />
            ))}

            {hasMore && (
              <div className="flex justify-center">
                <Button variant="primary" onClick={fetchMore} disabled={loadingMore}>
                  {loadingMore ? "Cargando..." : "Cargar más"}
                </Button>
              </div>
            )}
            {!hasMore && (
              <p className="text-center text-muted-foreground">No hay más publicaciones.</p>
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
