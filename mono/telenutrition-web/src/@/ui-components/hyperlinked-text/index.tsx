import React from 'react'
import Link from 'next/link'

interface HyperlinkedTextProps {
  text?: string
}

export default function HyperlinkedText({ text }: HyperlinkedTextProps) {
  const regex = /(https?:\/\/[^\s]+)/g

  return (
    <>
      {text?.split(regex).map((part, index) =>
        regex.test(part)
          ? <Link key={index} href={part} target="_blank" rel="noopener noreferrer">{part}</Link>
          : (<span key={index}>{part}</span>)
      )}
    </>
  )
}
