import { getReactions } from "../hooks/api";
import { useQuery } from "@tanstack/react-query";

import { orderBy, slice } from "lodash";
import { Reaction, Video } from "../hooks/api";
import Image from "next/future/image";
import React from "react";

const VideoList = ({ videos }: { videos: Video[] }) => (
  <div>
    {videos.map((video) => (
      <span key={video.id} className="my-3 video">
        <div className="videoImage">
          <Image src={video.thumbnail} alt="" width={60} height={34} />
        </div>
        <span className="videoTitle">{video.title}</span>
      </span>
    ))}
  </div>
);

const ListSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col my-2">
    <div className="mb-2 font-semibold text-gray-600">{title}</div>
    {children}
  </div>
);

interface Channel {
  id: string;
  title: string;
  count: number;
}
interface Metrics {
  reactions: number;
  videos: number;
  channels: number;
  recent: Video[];
  topVideos: Video[];
  topChannels: Channel[];
}

// temporary hack: generate metrics client side
const useMetrics = () => {
  const { isLoading, error, data } = useQuery(["reactions"], getReactions);

  let res: Metrics | null = null;
  if (data) {
    const videoMap: { [key: string]: Video } = {};
    const reactions: { [key: string]: number } = {};
    const channels: { [key: string]: Channel } = {};

    data.forEach((d: Reaction) => {
      const { reaction, reactionTo } = d;
      videoMap[reaction.id] = reaction;
      videoMap[reactionTo.id] = reactionTo;

      // count reactions on videos
      if (!reactions[reactionTo.id]) {
        reactions[reactionTo.id] = 0;
      }
      reactions[reactionTo.id] += 1;

      // count reactions channels
      // ignoring channels without a title
      if (reaction.channelTitle) {
        if (!channels[reaction.channelId]) {
          channels[reaction.channelId] = {
            id: reaction.channelId,
            title: reaction.channelTitle,
            count: 0,
          };
        }
        channels[reaction.channelId].count += 1;
      }
    });

    res = {
      reactions: data.length,
      videos: Object.keys(videoMap).length,
      channels: Object.keys(channels).length,

      // aggregations
      recent: slice(orderBy(data, "createdAt", "desc"), 0, 10).map(
        (reaction) => reaction.reaction
      ),
      topVideos: slice(
        orderBy(
          Object.keys(reactions).map((id) => ({
            ...videoMap[id],
            count: reactions[id],
          })),
          "count",
          "desc"
        ),
        0,
        10
      ),
      topChannels: slice(
        orderBy(Object.values(channels), "count", "desc"),
        0,
        10
      ),
    };
  }

  return { isLoading, error, data: res };
};

const Home = () => {
  const { isLoading, error, data } = useMetrics();

  if (isLoading) return "Loading...";
  if (data === null) return null;

  return (
    <>
      <div className="bg-gray-800">
        <main className="px-4 py-10 mx-auto max-w-7xl sm:py-12 sm:px-6 md:py-16 lg:py-20 lg:px-8 xl:py-28">
          <div className="sm:text-center lg:text-left">
            <h1 className="text-4xl font-bold tracking-tight text-gray-100 sm:text-5xl md:text-6xl">
              <span className="block xl:inline">Discover reactions</span>
            </h1>
            <p className="mt-3 text-base text-gray-500 sm:mx-auto sm:mt-5 sm:max-w-xl sm:text-lg md:mt-5 md:text-xl lg:mx-0">
              Easily find and follow your favorite youtube reactions.
            </p>
            <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
              <div className="rounded-md shadow">
                <a
                  href="https://chrome.google.com/webstore/detail/youtube-reactions/djljninaopfopcjkbfmofjipndcehapk"
                  className="flex items-center justify-center w-full px-8 py-3 text-base font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 md:py-4 md:px-10 md:text-lg"
                >
                  Get the extension
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>

      <div className="bg-gray-100">
        <div className="grid items-center max-w-2xl grid-cols-1 px-4 py-6 mx-auto gap-y-4 gap-x-8 sm:px-6 sm:py-8 lg:max-w-7xl lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Available when you need it
            </h2>
            <p className="mt-4 text-gray-500">
              The extension adds reactions to your video recommendations so you
              can see reactions to the videos you&apos;re currently watching.
            </p>
          </div>
          <div className="max-w-md pb-6 lg:py-6">
            <img
              src="/reactions-screenshot.png"
              alt="Screenshot of reaction in youtube recommendations panel."
              className="rounded-lg shadow"
            />
          </div>
        </div>
      </div>
      <div className="px-4 py-10 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 mb-14 sm:gap-6 sm:grid-cols-3 lg:gap-8">
          {[
            {
              title: "Reactions",
              count: data.reactions,
            },
            {
              title: "Videos",
              count: data.videos,
            },
            {
              title: "Channels",
              count: data.channels,
            },
          ].map((d) => (
            <div
              key={d.title}
              className="flex flex-col p-6 rounded shadow bg-gray-50"
            >
              <div className="text-gray-500">{d.title}</div>
              <div className="mt-2 text-3xl">{d.count}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 mx-auto mb-10 max-w-7xl sm:gap-6 lg:grid-cols-3 lg:gap-8">
          <ListSection title="Recently added">
            <VideoList videos={data.recent} />
          </ListSection>
          <ListSection title="Most reacted to videos">
            <VideoList videos={data.topVideos} />
          </ListSection>
          <ListSection title="Top Channels">
            {data.topChannels.map((channel) => (
              <span
                key={channel.id}
                className="flex items-center justify-between my-1"
              >
                <span>{channel.title}</span>
                <span className="text-gray-500">{channel.count}</span>
              </span>
            ))}
          </ListSection>
        </div>
      </div>
    </>
  );
};

export default Home;
