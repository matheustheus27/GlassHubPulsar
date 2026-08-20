import React, { CSSProperties } from 'react';
import { balanceContactLinks, ContactItem } from '../../utils/balancedContactGrid';
import { ContactLinkBadge } from './ContactLinkBadge';

interface BalancedContactGridProps {
  items: ContactItem[];
  containerWidthPx?: number;
  style?: CSSProperties;
  className?: string;
}

export const BalancedContactGrid: React.FC<BalancedContactGridProps> = ({
  items,
  containerWidthPx = 680,
  style,
  className = ''
}) => {
  const rows = balanceContactLinks(items, containerWidthPx);

  return (
    <div className={`flex flex-col gap-2 mt-3 ${className}`}>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex flex-wrap gap-2 items-center">
          {row.map((item, itemIndex) => (
            <ContactLinkBadge
              key={`${rowIndex}-${itemIndex}`}
              title={item.title}
              link={item.link}
              icon={item.icon}
              style={style}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
