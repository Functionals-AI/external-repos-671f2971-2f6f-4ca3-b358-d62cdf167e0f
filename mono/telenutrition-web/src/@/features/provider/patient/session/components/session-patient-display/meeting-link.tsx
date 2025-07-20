import IconButton from '@/ui-components/button/icon';

export default function MeetingLink({ meetingLink }: { meetingLink: string }) {
  function copyToClipboard() {
    navigator.clipboard.writeText(meetingLink);
  }

  return (
    <span className="flex gap-x-2 items-center text-fs-green-600 pt-2">
      <IconButton variant="tertiary" size="sm" iconName="copy" onClick={copyToClipboard} />
      <a className="text-current" href={meetingLink} target="_blank">
        {meetingLink}
      </a>
    </span>
  );
}
