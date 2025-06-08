import React from 'react';
import { Text, TextProps } from 'react-native';
import { useFontSize } from '@hooks/useFontSize';

/**
 * Enhanced Text component that supports dynamic font sizing based on app settings
 */
interface TextSizeProps extends TextProps {
  size?: 'tiny' | 'small' | 'normal' | 'medium' | 'large' | 'xlarge' | 'xxlarge' | 'xxxlarge';
}

export const TextSize: React.FC<TextSizeProps> = ({
  style,
  size = 'normal',
  ...props
}) => {
  const { getSize } = useFontSize();

  return (
    <Text
      style={[
        { fontSize: getSize(size) }, // Dynamic font size from settings store
        style,
      ]}
      {...props}
    />
  );
};

// 일반적으로 사용되는 텍스트 크기 컴포넌트들을 미리 정의
export const TextTiny: React.FC<TextProps> = (props) => <TextSize size="tiny" {...props} />;
export const TextSmall: React.FC<TextProps> = (props) => <TextSize size="small" {...props} />;
export const TextNormal: React.FC<TextProps> = (props) => <TextSize size="normal" {...props} />;
export const TextMedium: React.FC<TextProps> = (props) => <TextSize size="medium" {...props} />;
export const TextLarge: React.FC<TextProps> = (props) => <TextSize size="large" {...props} />;
export const TextXLarge: React.FC<TextProps> = (props) => <TextSize size="xlarge" {...props} />;
export const TextXXLarge: React.FC<TextProps> = (props) => <TextSize size="xxlarge" {...props} />;
export const TextXXXLarge: React.FC<TextProps> = (props) => <TextSize size="xxxlarge" {...props} />;

// 타이틀과 같은 특수 목적 텍스트
export const TextTitle: React.FC<TextProps> = ({ style, ...props }) => (
  <TextSize
    size="xlarge"
    style={[{ fontFamily:'Pretendard_Bold' }, style]}
    {...props}
  />
);

export const TextHeading: React.FC<TextProps> = ({ style, ...props }) => (
  <TextSize
    size="large"
    style={[{ fontFamily:'Pretendard_Bold' }, style]}
    {...props}
  />
);

export const TextSubheading: React.FC<TextProps> = ({ style, ...props }) => (
  <TextSize
    size="medium"
    style={[{ fontWeight: '600' }, style]}
    {...props}
  />
);

export const TextCaption: React.FC<TextProps> = ({ style, ...props }) => (
  <TextSize
    size="small"
    style={[{ color: '#666' }, style]}
    {...props}
  />
);
