import React from 'react';

interface LeetCodeIconProps {
  size?: number;
}

export const LeetCodeIcon: React.FC<LeetCodeIconProps> = ({ size = 20 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M16.102 17.93l-2.627 2.628c-.52.52-1.37.52-1.89 0L4.108 13.08c-.52-.52-.52-1.37 0-1.89l2.627-2.628c.52-.52 1.37-.52 1.89 0l7.477 7.477c.52.52.52 1.37 0 1.89z" />
    <path d="M14.212 16.04l-7.477-7.477c-.52-.52-.52-1.37 0-1.89l2.627-2.628c.52-.52 1.37-.52 1.89 0l7.477 7.477c.52.52.52 1.37 0 1.89l-2.627 2.628c-.52.52-1.37.52-1.89 0z" />
    <path d="M18.102 12.93l2.627-2.628c.52-.52.52-1.37 0-1.89l-2.627-2.628c-.52-.52-1.37-.52-1.89 0l-2.627 2.628c-.52.52-.52 1.37 0 1.89l2.627 2.628c.52.52 1.37.52 1.89 0z" />
  </svg>
);
