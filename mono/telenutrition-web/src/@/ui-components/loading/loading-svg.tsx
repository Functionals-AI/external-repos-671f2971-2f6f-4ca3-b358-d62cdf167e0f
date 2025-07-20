export default function LoadingSvg() {
  return (
    <>
      <style>
        {`
            .loading {
                display: flex;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }
            #loading-fork {
                width: 16px;
                margin-right: 2px;
                animation: bounce 2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
                animation-delay: 0
            }
            #loading-plate {
                height: 69px;
                animation: bounce 2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
                animation-delay: 0.2s
            }
            #loading-knife {
                width: 11px;
                margin-left: 3px;
                animation: bounce 2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
                animation-delay: 0.4s
            }
            @keyframes bounce {
                0%, 50%, 100% {transform: translateY(0);}
                25% {transform: translateY(-48px);}
                75% {transform: translateY(-24px);}
            }
        `}
      </style>
      <div className="loading">
        <svg id="loading-fork" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 23 88">
          <path
            fill="#0A9B6F"
            fillRule="evenodd"
            d="M1 0a1 1 0 0 1 1 1v24c0 3.298 2.846 6 6 6a1 1 0 0 1 1 1v51c0 1.822 1.095 3 2.5 3s2.5-1.178 2.5-3V32a1 1 0 0 1 1-1c3.154 0 6-2.702 6-6V1a1 1 0 1 1 2 0v24c0 4.081-3.196 7.426-7 7.933V83c0 2.597-1.687 5-4.5 5C8.687 88 7 85.597 7 83V32.933C3.196 32.426 0 29.081 0 25V1a1 1 0 0 1 1-1Zm7 0a1 1 0 0 1 1 1v23a1 1 0 1 1-2 0V1a1 1 0 0 1 1-1Zm8 1a1 1 0 1 0-2 0v23a1 1 0 1 0 2 0V1Z"
            clipRule="evenodd"
          />
        </svg>

        <svg
          id="loading-plate"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 102 102"
        >
          <path
            fill="#0A9B6F"
            fillRule="evenodd"
            d="M87 51c0 19.882-16.118 36-36 36S15 70.882 15 51s16.118-36 36-36 36 16.118 36 36Zm-2 0c0 18.778-15.222 34-34 34S17 69.778 17 51s15.222-34 34-34 34 15.222 34 34Z"
            clipRule="evenodd"
          />
          <path
            fill="#0A9B6F"
            fillRule="evenodd"
            d="M102 51c0 28.166-22.834 51-51 51S0 79.166 0 51 22.834 0 51 0s51 22.834 51 51Zm-2 0c0 27.062-21.938 49-49 49S2 78.062 2 51 23.938 2 51 2s49 21.938 49 49Z"
            clipRule="evenodd"
          />
        </svg>

        <svg id="loading-knife" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 89">
          <path
            fill="#0A9B6F"
            fillRule="evenodd"
            d="M2 0H0v84.5a4.5 4.5 0 1 0 9 0V52h3a5 5 0 0 0 5-5V15C17 6.716 10.284 0 2 0Zm5 52H2v32.5a2.5 2.5 0 0 0 5 0V52Zm5-2a3 3 0 0 0 3-3V15C15 7.82 9.18 2 2 2v48h10Z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </>
  );
}
