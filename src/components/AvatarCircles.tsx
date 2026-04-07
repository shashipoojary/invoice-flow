"use client"

import React from "react"

import { cn } from "@/lib/utils"

interface AvatarCirclesProps {
  className?: string
  numPeople?: number
  avatarUrls: string[]
}

const AvatarCircles = ({
  numPeople,
  className,
  avatarUrls,
}: AvatarCirclesProps) => {
  return (
    <div
      className={cn(
        // Isolate from marketing page [&_*]:!rounded-none — avatars must stay circular
        "avatar-stack isolate z-10 flex items-center pl-1",
        className
      )}
    >
      {avatarUrls.map((url, index) => (
        <img
          key={index}
          className={cn(
            "relative h-10 w-10 shrink-0 !rounded-full border-[2.5px] border-white object-cover shadow-sm",
            "dark:border-gray-900",
            index > 0 && "-ml-3 sm:-ml-3.5"
          )}
          style={{ zIndex: index + 1 }}
          src={url}
          width={40}
          height={40}
          alt=""
        />
      ))}
      <div
        data-avatar-overflow
        className={cn(
          "relative -ml-3 sm:-ml-3.5 flex h-10 w-10 shrink-0 items-center justify-center !rounded-full",
          "border-[2.5px] border-white bg-black text-center text-[11px] font-semibold tabular-nums tracking-tight text-white",
          "shadow-sm dark:border-gray-900"
        )}
        style={{ zIndex: avatarUrls.length + 1 }}
      >
        +{numPeople}
      </div>
    </div>
  )
}

export { AvatarCircles }

