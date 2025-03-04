import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';

// This is a simplified approach - ideally you would have the full SFSymbols6_0 type definition
type SFSymbol = 
  | 'house.fill'
  | 'paperplane.fill'
  | 'list.bullet.clipboard'
  | 'banknote'
  | 'chart.pie'
  | 'plus'
  | 'xmark.circle.fill'
  | 'creditcard'
  | 'wallet.pass'
  | 'building.columns'
  | 'dollarsign.circle'
  | 'smartphone';

// Define the SymbolWeight type as it's not exported from IconSymbol
type SymbolWeight = 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black';

interface IconProps {
  name: string;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}

export function Icon({ name, size, color, style, weight }: IconProps) {
  // Type assertion here - we're telling TypeScript to trust that our string is a valid SFSymbol
  return (
    <IconSymbol
      name={name as SFSymbol}
      size={size}
      color={color}
      style={style}
      weight={weight as any} // Using 'any' here since the actual SymbolWeight isn't exported
    />
  );
}
