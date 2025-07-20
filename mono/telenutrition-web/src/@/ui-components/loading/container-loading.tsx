import LoadingSvg from './loading-svg';

export default function ContainerLoading() {
  return (
    <div className="h-full w-full flex items-center justify-center min-h-[10rem]">
      <LoadingSvg />
    </div>
  );
}
