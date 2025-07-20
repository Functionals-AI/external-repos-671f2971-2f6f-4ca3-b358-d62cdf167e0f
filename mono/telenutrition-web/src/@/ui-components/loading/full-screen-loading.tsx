import { createPortal } from 'react-dom';
import LoadingSvg from './loading-svg';

export default function FullScreenLoading() {
  return (
    <>
      {createPortal(
        <div>
          <div
            style={{
              minHeight: '15rem',
              position: 'absolute',
              background: 'rgba(255,255,255,0.5)',
              backdropFilter: 'blur(8px)',
              width: '100%',
              height: '100%',
              top: 0,
              left: 0,
              zIndex: 500,
            }}
          >
            <LoadingSvg />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
