'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { matchService } from '@/lib/matchService';
import { userService } from '@/lib/firestore';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface UserStats {
  matchesCount: number;
  likesCount: number;
  visitsCount: number;
  superLikesCount: number;
}

export function useUserStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    matchesCount: 0,
    likesCount: 0,
    visitsCount: 0,
    superLikesCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Obtener matches activos
      const matches = await matchService.getUserMatches(user.id);
      const matchesCount = matches.length;

      // Obtener datos del usuario actual para likes recibidos
      const userData = await userService.getUser(user.id);
      const likesCount = userData?.receivedSuperLikes?.length || 0;
      const superLikesCount = userData?.receivedSuperLikes?.length || 0;

      // Para las visitas, podríamos usar analytics o crear una colección específica
      // Por ahora usaremos un valor simulado basado en la actividad
      const visitsCount = Math.floor(Math.random() * 50) + 10; // Valor temporal

      setStats({
        matchesCount,
        likesCount,
        visitsCount,
        superLikesCount
      });
    } catch (err) {
      console.error('Error loading user stats:', err);
      setError('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Configurar listeners en tiempo real para matches
  useEffect(() => {
    if (!user?.id) return;

    let isSubscribed = true;

    // Listener para matches en tiempo real
    const unsubscribeMatches = matchService.onMatchesChange(user.id, (matches) => {
      if (!isSubscribed) return;
      
      setStats(prev => ({
        ...prev,
        matchesCount: matches.length
      }));
    });

    // Listener para cambios en el perfil del usuario (likes recibidos)
    const unsubscribeUser = onSnapshot(
      query(collection(db, 'users'), where('id', '==', user.id)),
      (snapshot) => {
        if (!isSubscribed) return;
        
        snapshot.forEach((doc) => {
          const userData = doc.data();
          const likesCount = userData?.receivedSuperLikes?.length || 0;
          const superLikesCount = userData?.receivedSuperLikes?.length || 0;
          
          setStats(prev => ({
            ...prev,
            likesCount,
            superLikesCount
          }));
        });
      }
    );

    // Cargar estadísticas iniciales
    loadStats();

    return () => {
      isSubscribed = false;
      unsubscribeMatches();
      unsubscribeUser();
    };
  }, [user?.id, loadStats]);

  return {
    stats,
    loading,
    error,
    refreshStats: loadStats
  };
}