import { v4 as uuidv4 } from 'uuid';
import { Comment } from './types';

const mockCommentA: Comment = {
  id: uuidv4(),
  parent: '',
  author: 'AAA, MD',
  content:
    'Nullam ut justo eget purus rhoncus pretium in ac nulla. Donec varius lacinia nunc, non tincidunt dui lacinia eget. Nullam ut justo eget purus rhoncus pretium in ac nulla. Donec varius lacinia nunc, non tincidunt dui lacinia eget. Nullam ut justo eget purus rhoncus pretium in ac nulla. Donec varius lacinia nunc, non tincidunt dui lacinia eget. Nullam ut justo eget purus rhoncus pretium in ac nulla. Donec varius lacinia nunc, non tincidunt dui lacinia eget.',
  timestamp: '2023-11-16T12:23:00Z',
};

const mockCommentB: Comment = {
  id: uuidv4(),
  parent: mockCommentA.id,
  author: 'BBB, MD',
  content:
    'Nullam ut justo eget purus rhoncus pretium in ac nulla. Donec varius lacinia nunc, non tincidunt dui lacinia eget. Nullam ut justo eget purus rhoncus pretium in ac nulla. Donec varius lacinia nunc, non tincidunt dui lacinia eget. Nullam ut justo eget purus rhoncus pretium in ac nulla. Donec varius lacinia nunc, non tincidunt dui lacinia eget. Nullam ut justo eget purus rhoncus pretium in ac nulla. Donec varius lacinia nunc, non tincidunt dui lacinia eget.',
  timestamp: '2023-11-16T12:23:00Z',
};

const mockCommentC: Comment = {
  id: uuidv4(),
  parent: mockCommentB.id,
  author: 'CCC, MD',
  content:
    'Nullam ut justo eget purus rhoncus pretium in ac nulla. Donec varius lacinia nunc, non tincidunt dui lacinia eget. Nullam ut justo eget purus rhoncus pretium in ac nulla. Donec varius lacinia nunc, non tincidunt dui lacinia eget. Nullam ut justo eget purus rhoncus pretium in ac nulla. Donec varius lacinia nunc, non tincidunt dui lacinia eget. Nullam ut justo eget purus rhoncus pretium in ac nulla. Donec varius lacinia nunc, non tincidunt dui lacinia eget.',
  timestamp: '2023-11-16T12:23:00Z',
};

const mockCommentD: Comment = {
  id: uuidv4(),
  parent: mockCommentA.id,
  author: 'DDD, MD',
  content:
    'Nullam ut justo eget purus rhoncus pretium in ac nulla. Donec varius lacinia nunc, non tincidunt dui lacinia eget. Nullam ut justo eget purus rhoncus pretium in ac nulla. Donec varius lacinia nunc, non tincidunt dui lacinia eget. Nullam ut justo eget purus rhoncus pretium in ac nulla. Donec varius lacinia nunc, non tincidunt dui lacinia eget. Nullam ut justo eget purus rhoncus pretium in ac nulla. Donec varius lacinia nunc, non tincidunt dui lacinia eget.',
  timestamp: '2023-11-16T12:23:00Z',
};

const mockCommentE: Comment = {
  id: uuidv4(),
  parent: mockCommentB.id,
  author: 'EEE, MD',
  content:
    'Nullam ut justo eget purus rhoncus pretium in ac nulla. Donec varius lacinia nunc, non tincidunt dui lacinia eget. Nullam ut justo eget purus rhoncus pretium in ac nulla. Donec varius lacinia nunc, non tincidunt dui lacinia eget. Nullam ut justo eget purus rhoncus pretium in ac nulla. Donec varius lacinia nunc, non tincidunt dui lacinia eget. Nullam ut justo eget purus rhoncus pretium in ac nulla. Donec varius lacinia nunc, non tincidunt dui lacinia eget.',
  timestamp: '2023-11-16T12:23:00Z',
};

const mockCommentF: Comment = {
  id: uuidv4(),
  parent: mockCommentA.id,
  author: 'FFF, MD',
  content:
    'Nullam ut justo eget purus rhoncus pretium in ac nulla. Donec varius lacinia nunc, non tincidunt dui lacinia eget. Nullam ut justo eget purus rhoncus pretium in ac nulla. Donec varius lacinia nunc, non tincidunt dui lacinia eget. Nullam ut justo eget purus rhoncus pretium in ac nulla. Donec varius lacinia nunc, non tincidunt dui lacinia eget. Nullam ut justo eget purus rhoncus pretium in ac nulla. Donec varius lacinia nunc, non tincidunt dui lacinia eget.',
  timestamp: '2023-11-16T12:23:00Z',
};

export const mockComments: Comment[] = [
  mockCommentA,
  mockCommentB,
  mockCommentC,
  mockCommentD,
  mockCommentE,
  mockCommentF,
];
