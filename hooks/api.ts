import axios from "axios";

export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://yt-reactions-server.fly.dev";

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reaction {
  reactionId: string;
  videoId: string;
  createdAt: string;
  updatedAt: string;
  reportCount: number;
  reaction: Video;
  reactionTo: Video;
}

export const getReactions = () =>
  axios.get(`${BASE_URL}/reactions`).then((res) => res.data);

export const getToken = (token: string) => {
  axios
    .get(`${BASE_URL}/auth/google/token?code=${token}`)
    .then((res) => res.data);
};
