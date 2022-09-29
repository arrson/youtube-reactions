import { getReactions } from "../hooks/api";
import { useQuery } from "@tanstack/react-query";

import { orderBy, slice } from "lodash";
import { Reaction, Video } from "../hooks/api";
import Image from "next/future/image";
import React from "react";
import { motion } from "framer-motion";
import Counter from "../components/Counter";

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

const getVideoUrl = (video: Video) =>
  `https://www.youtube.com/watch?v=${video.id}`;

const getChannelUrl = (channel: Channel) =>
  `https://www.youtube.com/channel/${channel.id}`;

const VideoList = ({ videos }: { videos: Video[] }) => (
  <div>
    {videos.map((video) => (
      <a
        href={getVideoUrl(video)}
        key={video.id}
        className="px-2 py-2 text-sm font-medium leading-5 text-gray-900 whitespace-no-wrap video hover:bg-gray-100"
      >
        <div className="videoImage">
          <Image src={video.thumbnail} alt="" width={60} height={34} />
        </div>
        <span className="videoTitle">{video.title}</span>
      </a>
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
    <div className="p-2 text-lg font-semibold text-gray-700">{title}</div>
    {children}
  </div>
);

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

const easeTransition = {
  duration: 1,
  ease: [0.6, 0.05, -0.01, 0.9],
};
const variants = {
  top: {
    initial: { opacity: 0, y: -70 },
    animate: { duration: 1, opacity: 1, y: 0 },
  },
  bottom: {
    initial: { opacity: 0, y: 70 },
    animate: { duration: 1, opacity: 1, y: 0 },
  },
  left: {
    initial: { opacity: 0, x: -70 },
    animate: { duration: 1, opacity: 1, x: 0 },
  },
  right: {
    initial: { opacity: 0, x: 100 },
    animate: { duration: 1, opacity: 1, x: 0 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { duration: 1, opacity: 1 },
  },
  list: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2,
        delayChildren: 0,
      },
    },
  },
};

const DataSection = () => {
  const { isLoading, error, data } = useMetrics();

  if (isLoading) return null;
  if (data === null) return null;

  console.log("DATA:", data);

  return (
    <div className="px-4 py-10 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <motion.ul
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={variants.list}
        className="grid grid-cols-1 gap-4 mb-14 sm:gap-6 sm:grid-cols-3 lg:gap-8"
      >
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
          <motion.li
            variants={variants.bottom}
            key={d.title}
            className="flex flex-col p-6 rounded shadow bg-gray-50"
          >
            <div className="mt-2 text-4xl">{d.count}</div>
            <div className="text-gray-500">{d.title}</div>
          </motion.li>
        ))}
      </motion.ul>

      <motion.ul
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={variants.list}
        className="grid grid-cols-1 gap-4 mx-auto mb-10 max-w-7xl sm:gap-6 lg:grid-cols-3 lg:gap-8"
      >
        <motion.li variants={variants.top}>
          <ListSection title="Recently added">
            <VideoList videos={data.recent} />
          </ListSection>
        </motion.li>
        <motion.li variants={variants.top}>
          <ListSection title="Most reacted to videos">
            <VideoList videos={data.topVideos} />
          </ListSection>
        </motion.li>
        <motion.li variants={variants.top}>
          <ListSection title="Top Channels">
            {data.topChannels.map((channel) => (
              <a
                key={channel.id}
                href={getChannelUrl(channel)}
                className="flex items-center justify-between p-2 hover:bg-gray-100"
              >
                <span>{channel.title}</span>
                <span className="text-gray-500">{channel.count}</span>
              </a>
            ))}
          </ListSection>
        </motion.li>
      </motion.ul>
    </div>
  );
};

const Home = () => {
  return (
    <>
      <div className="bg-gray-800">
        <motion.div
          initial="initial"
          animate="animate"
          variants={variants.top}
          transition={easeTransition}
        >
          <main className="px-4 py-10 mx-auto max-w-7xl sm:py-12 sm:px-6 md:py-16 lg:py-20 lg:px-8 xl:py-24">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl font-bold tracking-tight text-gray-100 sm:text-3xl md:text-5xl">
                <span className="block xl:inline">Discover reactions</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mx-auto sm:mt-5 sm:max-w-xl sm:text-lg md:mt-5 md:text-xl lg:mx-0">
                Easily find and follow your favorite YouTube reactions.
              </p>
            </div>
          </main>
        </motion.div>
      </div>

      <div className="bg-gray-100">
        <div className="grid items-center max-w-2xl grid-cols-1 px-4 py-6 mx-auto text-center gap-y-4 gap-x-8 sm:px-6 sm:py-8 lg:text-left lg:max-w-7xl lg:grid-cols-2 lg:px-8">
          <motion.div
            initial="initial"
            animate="animate"
            variants={variants.left}
            transition={easeTransition}
          >
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Available when you need it
            </h2>
            <p className="mt-4 text-gray-500">
              The chrome extension adds reactions to your YouTube video
              recommendations so you can view reactions to the videos
              you&apos;re currently watching.
            </p>
            <div className="flex justify-center mt-5 lg:justify-start sm:mt-8">
              <div className="rounded-md shadow">
                <a
                  href="https://chrome.google.com/webstore/detail/youtube-reactions/djljninaopfopcjkbfmofjipndcehapk"
                  className="flex items-center justify-center w-full px-8 py-3 text-base font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 md:text-lg"
                >
                  Get the extension
                </a>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial="initial"
            animate="animate"
            variants={variants.right}
            transition={easeTransition}
            className="max-w-md pb-6 lg:py-6"
          >
            <img
              src="/mockup.png"
              alt="Screenshot of reaction in YouTube recommendations panel."
            />
          </motion.div>
        </div>
      </div>
      <DataSection />
    </>
  );
};

export default Home;
