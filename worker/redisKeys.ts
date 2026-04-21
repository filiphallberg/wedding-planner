/** Central key layout for seating data (Upstash Redis). */

export const projectBlobKey = (projectId: string) => `seating:project:${projectId}`;

/** Hash: ownerId, name, updatedAt (string fields). Optional; legacy blob is fallback. */
export const projectMetaHashKey = (projectId: string) => `seating:project:${projectId}:meta`;

/** SET of collaborator Clerk user ids. Preferred; legacy JSON string uses membersLegacyKey. */
export const projectMemberSetKey = (projectId: string) => `seating:project:${projectId}:member_set`;

/** Legacy STRING value: JSON string[] of member user ids (kept in sync on write for rollback). */
export const membersLegacyKey = (projectId: string) => `seating:project:${projectId}:members`;

export const indexKey = (userId: string) => `seating:user:${userId}:index`;
export const sharedKey = (userId: string) => `seating:user:${userId}:shared`;
export const inviteKey = (token: string) => `seating:invite:${token}`;
