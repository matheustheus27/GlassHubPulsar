import React, { CSSProperties } from 'react';
import { Heading, Subheading } from '../atoms/Typography';
import { BalancedContactGrid } from '../molecules/BalancedContactGrid';
import { ContactItem } from '../../utils/balancedContactGrid';

interface DynamicResumeHeaderProps {
  name: string;
  title: string;
  contacts: ContactItem[];
  borderColor?: string;
  style?: {
    name?: CSSProperties;
    title?: CSSProperties;
    contact?: CSSProperties;
  };
}

export const DynamicResumeHeader: React.FC<DynamicResumeHeaderProps> = ({
  name,
  title,
  contacts,
  borderColor = 'rgba(255, 255, 255, 0.1)',
  style
}) => {
  return (
    <header
      className="flex flex-col gap-2 pb-6 border-b"
      style={{ borderBottomColor: borderColor }}
    >
      <Heading level={1} style={style?.name}>
        {name}
      </Heading>
      <Subheading style={style?.title}>
        {title}
      </Subheading>
      <BalancedContactGrid items={contacts} style={style?.contact} />
    </header>
  );
};
