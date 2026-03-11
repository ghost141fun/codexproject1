import { User, Channel, DirectMessage, Workspace, Message } from './types';

export const currentUser: User = {
  id: 'u-1',
  name: 'Alex Rivera',
  avatar: 'https://picsum.photos/seed/alex/100/100',
  status: 'online',
  role: 'Senior Frontend Engineer',
};

export const workspaces: Workspace[] = [
  { id: 'w-1', name: 'Acme Corp', icon: 'AC' },
  { id: 'w-2', name: 'Open Source', icon: 'OS' },
  { id: 'w-3', name: 'Personal Projects', icon: 'PP' },
];

export const channels: Channel[] = [
  { id: 'c-1', name: 'general', description: 'General announcements and chatter', isPrivate: false, type: 'channel' },
  { id: 'c-2', name: 'frontend-dev', description: 'All things React, Next.js, and CSS', isPrivate: false, type: 'channel' },
  { id: 'c-3', name: 'backend-api', description: 'Node.js, Go, and Rust discussions', isPrivate: false, type: 'channel' },
  { id: 'c-4', name: 'security-ops', description: 'Confidential security discussions', isPrivate: true, type: 'channel' },
];

export const directMessages: DirectMessage[] = [
  { id: 'dm-1', userId: 'u-2', name: 'Sarah Chen', avatar: 'https://picsum.photos/seed/sarah/100/100', type: 'dm' },
  { id: 'dm-2', userId: 'u-3', name: 'Marcus Bell', avatar: 'https://picsum.photos/seed/marcus/100/100', type: 'dm' },
  { id: 'dm-3', userId: 'u-4', name: 'Elena Rodriguez', avatar: 'https://picsum.photos/seed/elena/100/100', type: 'dm' },
];

export const initialMessages: Record<string, Message[]> = {
  'c-1': [
    {
      id: 'm-1',
      senderId: 'u-2',
      senderName: 'Sarah Chen',
      senderAvatar: 'https://picsum.photos/seed/sarah/100/100',
      content: 'Hey everyone! Just joined the workspace. Excited to build with you all.',
      timestamp: '2023-10-25T10:00:00Z',
      type: 'text',
    },
    {
      id: 'm-2',
      senderId: 'u-3',
      senderName: 'Marcus Bell',
      senderAvatar: 'https://picsum.photos/seed/marcus/100/100',
      content: 'Welcome Sarah! Check out the #frontend-dev channel for the latest PRs.',
      timestamp: '2023-10-25T10:05:00Z',
      type: 'text',
    },
    {
      id: 'm-3',
      senderId: 'u-1',
      senderName: 'Alex Rivera',
      senderAvatar: 'https://picsum.photos/seed/alex/100/100',
      content: 'Has anyone seen the latest documentation update for GenAI flows? It seems there are some new parameters.',
      timestamp: '2023-10-25T10:10:00Z',
      type: 'text',
    },
  ],
  'c-2': [
    {
      id: 'm-4',
      senderId: 'u-2',
      senderName: 'Sarah Chen',
      senderAvatar: 'https://picsum.photos/seed/sarah/100/100',
      content: 'Just deployed the new button component. Check it out!',
      timestamp: '2023-10-25T11:00:00Z',
      type: 'text',
    },
  ],
};