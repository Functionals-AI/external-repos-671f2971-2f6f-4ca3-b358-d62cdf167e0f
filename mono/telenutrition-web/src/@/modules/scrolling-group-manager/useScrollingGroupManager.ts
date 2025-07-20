import { useState, useRef } from 'react';
import { ScrollingGroupRef } from './context';

export interface UseScrollingGroupManagerReturn<GroupData> {
  refs: ScrollingGroupRef[];
  addRef: (newRef: ScrollingGroupRef) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  scrollToGroup: (name: string) => void;
}

export default function useScrollingGroupManager<
  GroupData,
>(): UseScrollingGroupManagerReturn<GroupData> {
  const containerRef = useRef<HTMLDivElement>(null);
  const [refs, setRefs] = useState<ScrollingGroupRef[]>([]);
  function addRef(newRef: ScrollingGroupRef) {
    setRefs((prevRefs) => [...(prevRefs || []), newRef]);
  }

  function scrollToGroup(name: string): void {
    if (!containerRef.current) return;

    const foundInd = refs.find(({ name: n }) => n === name);
    if (!foundInd) return;

    containerRef.current.scroll({
      top: foundInd?.element.offsetTop - 130,
      behavior: 'smooth',
    });
  }

  return {
    refs,
    addRef,
    containerRef,
    scrollToGroup,
  };
}
