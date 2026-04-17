export type User = {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  role?: string;
};

export type Message = {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'code';
};

export type Channel = {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  type: 'channel';
};

export type DirectMessage = {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  color?: string;
  type: 'dm';
};

export type Workspace = {
  id: string;
  name: string;
  icon: string;
};

export type FileAsset = {
  id: string;
  name: string;
  size: string;
  type: 'image' | 'document' | 'code' | 'other';
  uploadedAt: string;
  ownerName: string;
  ownerAvatar: string;
  url: string;
};
