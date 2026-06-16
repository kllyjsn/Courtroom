import { Fragment, type ReactNode } from "react";

/** Render inline markdown: **bold**, *italic*, `code`, and [text](url) links. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex =
    /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const key = `${keyPrefix}-${i++}`;
    if (match[2] !== undefined) {
      nodes.push(<strong key={key}>{match[2]}</strong>);
    } else if (match[4] !== undefined) {
      nodes.push(<em key={key}>{match[4]}</em>);
    } else if (match[6] !== undefined) {
      nodes.push(<code key={key}>{match[6]}</code>);
    } else if (match[8] !== undefined && match[9] !== undefined) {
      nodes.push(
        <a key={key} href={match[9]} target="_blank" rel="noreferrer noopener">
          {match[8]}
        </a>
      );
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

/** Minimal, dependency-free markdown renderer for AI output. */
export default function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let key = 0;

  const flushList = () => {
    if (!list) return;
    const items = list.items.map((it, idx) => (
      <li key={idx}>{renderInline(it, `li-${key}-${idx}`)}</li>
    ));
    blocks.push(
      list.ordered ? (
        <ol key={`ol-${key++}`}>{items}</ol>
      ) : (
        <ul key={`ul-${key++}`}>{items}</ul>
      )
    );
    list = null;
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim()) {
      flushList();
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      flushList();
      const level = h[1].length;
      const content = renderInline(h[2], `h-${key}`);
      const Tag = (`h${Math.min(level + 1, 4)}`) as "h2" | "h3" | "h4";
      blocks.push(<Tag key={`h-${key++}`}>{content}</Tag>);
      continue;
    }
    const ol = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    const ul = /^\s*[-*•]\s+(.*)$/.exec(line);
    if (ol) {
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(ol[1]);
      continue;
    }
    if (ul) {
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(ul[1]);
      continue;
    }
    flushList();
    blocks.push(<p key={`p-${key++}`}>{renderInline(line, `p-${key}`)}</p>);
  }
  flushList();

  return (
    <div className="prose-legal">
      {blocks.map((b, i) => (
        <Fragment key={i}>{b}</Fragment>
      ))}
    </div>
  );
}
