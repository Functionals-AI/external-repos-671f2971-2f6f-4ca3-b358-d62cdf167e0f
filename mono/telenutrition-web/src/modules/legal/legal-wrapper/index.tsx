import { ReactNode } from 'react';
import Tabs, { TabId } from './tabs';

export default function LegalWrapper({
  children,
  currentTab,
}: {
  currentTab: TabId;
  children: ReactNode;
}) {
  return (
    <div className="max-w-4xl px-12 mx-auto py-8 legal-wrapper">
      <style global jsx>{`
        .legal-wrapper div {
          margin: 2rem 0;
        }

        h1,
        h2,
        h3,
        h4 {
          margin: 2rem 0;
        }

        p {
          margin: 1rem 0;
        }

        ul {
          list-style-type: circle;
          padding: 0 1rem;
        }
      `}</style>
      <Tabs current={currentTab} />
      {children}
    </div>
  );
}
