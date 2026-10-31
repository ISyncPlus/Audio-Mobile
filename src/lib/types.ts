export interface Artist {
  id: string;
  name?: string | null;
  username?: string | null;
  profileImage?: string | null;
  pageCover?: string | null;
  bio?: string | null;
  instagram?: string | null;
  walletAddress?: string;
}
export interface Profile extends Artist {
  email?: string;
  role: "listener" | "artist" | "admin";
  rewardPoints: number;
  totalStreams: number;
  totalStreamTime: number;
  uniqueListeners: number;
}
export interface Song {
  id: string;
  title: string;
  artist: Artist;
  genre?: string | null;
  coverArtPath?: string | null;
  duration?: number;
  likeCount?: number;
  isLiked?: boolean;
  reason?: string;
  voteCount?: number;
}
export interface Comment {
  id: string;
  content: string;
  user: Artist;
  rating?: number;
}
export interface Room {
  id: string;
  title: string;
  description?: string;
  price: string;
  state: "upcoming" | "live" | "closed";
  accessStartsAt: string;
  accessEndsAt: string;
  artist: Artist;
  song: Omit<Song, "artist"> | null;
  hasTicket?: boolean;
  avgRating?: number;
  reviews?: Comment[];
}
export interface Round {
  roundId: string;
  roundNumber: number;
  status: string;
  closesAt: string | null;
  hasVoted?: boolean;
  votedSongId?: string;
}
export interface Collection {
  id: string;
  title: string;
  description?: string;
  status: string;
  creatorId: string;
  members: (Artist & { userId: string; splitBps: number; status: string })[];
}
export interface Stats {
  totalSongs: number;
  totalStreams: number;
  rangeStreams: number;
  songs: { id: string; title: string; status: string; plays: number }[];
  trend: { date: string; streams: number }[];
  topCountries: { country: string; streams: number }[];
}
export const artistName = (artist?: Artist | null) =>
  artist?.username || artist?.name || "Unknown Artist";
