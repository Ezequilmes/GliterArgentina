import { User } from '@/types';

/**
 * Gets the primary profile photo for a user
 * Prioritizes profilePhoto, then first photo from photos array
 */
export function getUserProfilePhoto(user: User | null | undefined): string | null {
  if (!user) return null;
  
  // First priority: profilePhoto field
  if (user.profilePhoto) {
    return user.profilePhoto;
  }
  
  // Second priority: first photo from photos array
  if (user.photos && user.photos.length > 0) {
    return user.photos[0];
  }
  
  return null;
}

/**
 * Gets all photos for a user (for photo navigation)
 * Combines profilePhoto and photos array, removing duplicates
 */
export function getUserAllPhotos(user: User | null | undefined): string[] {
  if (!user) return [];
  
  const allPhotos: string[] = [];
  
  // Add profilePhoto if it exists
  if (user.profilePhoto) {
    allPhotos.push(user.profilePhoto);
  }
  
  // Add photos from array, avoiding duplicates
  if (user.photos && user.photos.length > 0) {
    user.photos.forEach(photo => {
      if (!allPhotos.includes(photo)) {
        allPhotos.push(photo);
      }
    });
  }
  
  return allPhotos;
}

/**
 * Checks if user has any photos
 */
export function userHasPhotos(user: User | null | undefined): boolean {
  if (!user) return false;
  return !!(user.profilePhoto || (user.photos && user.photos.length > 0));
}