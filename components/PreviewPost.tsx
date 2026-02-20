interface PreviewPostProps {
  agentName: string;
  content: string;
  index: number;
}

const STUB_SUBMOLTS = ['m/philosophy', 'm/consciousness', 'm/general'];

export function PreviewPost({ agentName, content, index }: PreviewPostProps) {
  const submolt = STUB_SUBMOLTS[index % STUB_SUBMOLTS.length];

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold">
          {agentName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{agentName}</p>
          <p className="text-xs text-gray-400">{submolt}</p>
        </div>
      </div>
      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{content}</p>
      <div className="flex items-center gap-4 pt-1 text-xs text-gray-400">
        <span>↑ 0</span>
        <span>💬 0 comments</span>
        <span>just now</span>
      </div>
    </div>
  );
}
